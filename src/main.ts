import { App, Notice, Plugin, PluginSettingTab, moment, normalizePath } from 'obsidian';
import type { SettingDefinition, SettingDefinitionItem } from 'obsidian';
import type { Moment } from 'moment';

type NoteType = 'daily' | 'weekly';
type FormatKey = 'dailyNoteFormat' | 'weeklyNoteFormat' | 'weeklyDateRangeFormat';

interface DailyWeeklyNotesSettings {
	dailyNotesFolder: string;
	weeklyNotesFolder: string;
	dailyNoteFormat: string;
	weeklyNoteFormat: string;
	weeklyDateRangeFormat: string;
}

const DEFAULT_SETTINGS: DailyWeeklyNotesSettings = {
	dailyNotesFolder: '',
	weeklyNotesFolder: '',
	dailyNoteFormat: 'YYYY-MM-DD',
	weeklyNoteFormat: 'GGGG - [Week] W',
	weeklyDateRangeFormat: 'MMMM Do'
}

const FORMAT_REFERENCE_URL = 'https://momentjs.com/docs/#/displaying/format/';

/**
 * The command registry is not in the public API. It is optional here so a
 * future Obsidian change degrades to a no-op.
 */
interface InternalApp extends App {
	commands?: {
		executeCommandById(id: string): boolean;
	};
}

/**
 * Obsidian's bundled Moment.js. Its typings are a namespace import, which
 * TypeScript no longer treats as callable, hence the cast.
 */
const now = moment as unknown as () => Moment;

/** Strip surrounding whitespace and slashes; the vault root is the empty string. */
function cleanFolder(folder: string): string {
	return folder.trim().replace(/^\/+|\/+$/g, '');
}

export default class DailyWeeklyNotesPlugin extends Plugin {
	settings: DailyWeeklyNotesSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'create-daily-note',
			name: 'Create daily note',
			callback: () => void this.createNote('daily')
		});

		this.addCommand({
			id: 'create-weekly-note',
			name: 'Create weekly note',
			callback: () => void this.createNote('weekly')
		});

		this.addSettingTab(new DailyWeeklyNotesSettingTab(this.app, this));
	}

	/** Pick up settings changed outside this instance, for example by Sync. */
	async onExternalSettingsChange() {
		await this.loadSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<DailyWeeklyNotesSettings> | null);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Folder for a note type. Stored values are cleaned on read, because the
	 * settings tab writes them directly.
	 */
	private folder(type: NoteType): string {
		return cleanFolder(type === 'daily' ? this.settings.dailyNotesFolder : this.settings.weeklyNotesFolder);
	}

	/** A date format setting, falling back to its default when left empty. */
	private format(key: FormatKey): string {
		return this.settings[key].trim() || DEFAULT_SETTINGS[key];
	}

	/** File name (without extension) of the note of the given type for a date. */
	private fileName(type: NoteType, date: Moment): string {
		return date.format(this.format(type === 'daily' ? 'dailyNoteFormat' : 'weeklyNoteFormat'));
	}

	/** Wiki link target of the note of the given type for a date. */
	private link(type: NoteType, date: Moment): string {
		return this.buildLinkPath(this.folder(type), this.fileName(type, date));
	}

	/**
	 * Build the full file path including folder and extension
	 */
	private buildFilePath(folder: string, fileName: string): string {
		return normalizePath(folder ? `${folder}/${fileName}.md` : `${fileName}.md`);
	}

	/**
	 * Build the link path for wiki links (without .md extension)
	 */
	private buildLinkPath(folder: string, fileName: string): string {
		return folder ? `${folder}/${fileName}` : fileName;
	}

	/**
	 * Ensure a folder exists, creating it if necessary
	 */
	private async ensureFolderExists(folderPath: string): Promise<void> {
		if (!folderPath) return; // Vault root always exists

		if (!this.app.vault.getFolderByPath(folderPath)) {
			await this.app.vault.createFolder(folderPath);
		}
	}

	async createNote(type: NoteType) {
		try {
			const today = now();
			const filePath = this.buildFilePath(this.folder(type), this.fileName(type, today));
			const content = type === 'daily'
				? this.generateDailyNoteContent(today)
				: this.generateWeeklyNoteContent(today);

			// The parent comes from the path, so formats such as YYYY/MM/DD work too
			await this.ensureFolderExists(filePath.substring(0, filePath.lastIndexOf('/')));
			await this.createOrUpdateNote(filePath, content, type);
		} catch (error) {
			console.error(`Error creating ${type} note:`, error);
			new Notice(`Failed to create ${type} note. Check the console for details.`);
		}
	}

	generateDailyNoteContent(date: Moment): string {
		const formattedDate = date.format('dddd MMMM Do, YYYY');
		const weekLink = this.link('weekly', date);
		const yesterday = this.link('daily', date.clone().subtract(1, 'day'));
		const tomorrow = this.link('daily', date.clone().add(1, 'day'));

		return `---
tags: [daily]
mobility: false
---
*${formattedDate}*

Week - [[${weekLink}]]
Yesterday - [[${yesterday}]]
Tomorrow - [[${tomorrow}]]

---

`;
	}

	generateWeeklyNoteContent(date: Moment): string {
		// Get the start of the ISO week (Monday)
		const weekStart = date.clone().isoWeekday(1);
		const weekEnd = weekStart.clone().add(6, 'days');

		// Same month: "January 5th - 11th"; different months: "January 30th - February 5th"
		const rangeFormat = this.format('weeklyDateRangeFormat');
		const endFormat = weekStart.month() === weekEnd.month()
			// For the end date, keep only the day portion (everything after the last space)
			? (rangeFormat.includes(' ') ? rangeFormat.split(' ').pop() || 'Do' : 'Do')
			: rangeFormat;
		const dateRange = `${weekStart.format(rangeFormat)} - ${weekEnd.format(endFormat)}`;

		const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		const dayLinks = daysOfWeek
			.map((dayName, index) => `${dayName} - [[${this.link('daily', weekStart.clone().add(index, 'days'))}]]`)
			.join('\n');

		const lastWeek = this.link('weekly', date.clone().subtract(1, 'week'));
		const nextWeek = this.link('weekly', date.clone().add(1, 'week'));

		return `---
tags: [daily, weekly]
---
*${dateRange}*

Last week - [[${lastWeek}]]

${dayLinks}

Next week - [[${nextWeek}]]

---

`;
	}

	async createOrUpdateNote(filePath: string, content: string, noteType: NoteType) {
		const label = noteType === 'daily' ? 'Daily' : 'Weekly';
		let file = this.app.vault.getFileByPath(filePath);

		if (file) {
			// File exists, prepend content using atomic process operation
			await this.app.vault.process(file, (existingContent) => content + '\n' + existingContent);
			new Notice(`${label} note template added to existing file`);
		} else {
			file = await this.app.vault.create(filePath, content);
			new Notice(`${label} note created`);
		}

		await this.app.workspace.getLeaf().openFile(file);

		this.runLinter();
	}

	/** Run the Linter community plugin on the open note, if it is installed. */
	private runLinter() {
		try {
			(this.app as InternalApp).commands?.executeCommandById('linter:lint-file');
		} catch (e) {
			console.debug('Linter plugin not available:', e);
		}
	}
}

export class DailyWeeklyNotesSettingTab extends PluginSettingTab {
	plugin: DailyWeeklyNotesPlugin;

	constructor(app: App, plugin: DailyWeeklyNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Daily notes folder',
				desc: 'Folder where daily notes are created. It is created if it does not exist.',
				control: { type: 'folder', key: 'dailyNotesFolder', includeRoot: true, placeholder: 'Vault root' },
			},
			{
				name: 'Weekly notes folder',
				desc: 'Folder where weekly notes are created. It is created if it does not exist.',
				control: { type: 'folder', key: 'weeklyNotesFolder', includeRoot: true, placeholder: 'Vault root' },
			},
			{
				type: 'group',
				heading: 'Date formats',
				items: [
					this.formatSetting(
						'Daily note filename format',
						'Format for daily note filenames and links.',
						'dailyNoteFormat'),
					this.formatSetting(
						'Weekly note filename format',
						'Format for weekly note filenames and links. Use GGGG (ISO week year) with W (ISO week number) so year boundaries work.',
						'weeklyNoteFormat'),
					this.formatSetting(
						'Weekly note date range format',
						'Format for the date range shown at the top of weekly notes.',
						'weeklyDateRangeFormat'),
				],
			},
		];
	}

	/**
	 * A Moment.js format input with a live preview. There is no declarative
	 * control for these yet, so the row is rendered (and saved) by hand.
	 */
	private formatSetting(name: string, desc: string, key: FormatKey): SettingDefinition {
		return {
			name,
			desc,
			render: (setting) => {
				let sampleEl!: HTMLElement;
				setting.setDesc(createFragment((frag) => {
					frag.appendText(`${desc} See the `);
					frag.createEl('a', { text: 'format reference', href: FORMAT_REFERENCE_URL });
					frag.appendText('. Preview: ');
					sampleEl = frag.createEl('b', { cls: 'u-pop' });
				}));
				setting.addMomentFormat((momentFormat) => momentFormat
					.setDefaultFormat(DEFAULT_SETTINGS[key])
					.setSampleEl(sampleEl)
					.setValue(this.plugin.settings[key])
					.onChange(async (value) => {
						this.plugin.settings[key] = value;
						await this.plugin.saveSettings();
					}));
			},
		};
	}
}
