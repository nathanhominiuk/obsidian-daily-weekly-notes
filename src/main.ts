import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, moment, normalizePath } from 'obsidian';
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
 * Obsidian's bundled Moment.js. Its typings are a namespace import, which
 * TypeScript no longer treats as callable, hence the cast.
 */
const createMoment = moment as unknown as (input?: string, format?: string, strict?: boolean) => Moment;
const now = () => createMoment();

/** Value format of an HTML date input. */
const DATE_INPUT_FORMAT = 'YYYY-MM-DD';

/** Upper bound on notes created by one bulk command, as a guard against typos in the range. */
export const MAX_BULK_NOTES = 366;

/** Parse the value of a date input; null when it is empty or not a real date. */
export function parseDateInput(value: string): Moment | null {
	const date = createMoment(value.trim(), DATE_INPUT_FORMAT, true);
	return date.isValid() ? date : null;
}

/**
 * The dates of the notes covering a range, both ends included: every day for
 * daily notes, the Monday of every ISO week touching the range for weekly notes.
 */
export function datesInRange(type: NoteType, start: Moment, end: Moment): Moment[] {
	const unit = type === 'daily' ? 'day' : 'week';
	const cursor = type === 'daily' ? start.clone().startOf('day') : start.clone().startOf('isoWeek');
	const dates: Moment[] = [];
	while (!cursor.isAfter(end, 'day')) {
		dates.push(cursor.clone());
		cursor.add(1, unit);
	}
	return dates;
}

function plural(count: number, type: NoteType): string {
	return `${count} ${type} ${count === 1 ? 'note' : 'notes'}`;
}

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

		for (const type of ['daily', 'weekly'] as const) {
			this.addCommand({
				id: `create-${type}-note-for-date`,
				name: `Create ${type} note for a specific date`,
				callback: () => new DateModal(this.app, this, type).open()
			});

			this.addCommand({
				id: `create-${type}-notes-for-range`,
				name: `Create ${type} notes for a date range`,
				callback: () => new DateRangeModal(this.app, this, type).open()
			});
		}

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

	/** File path and template content of the note of the given type for a date. */
	private noteFor(type: NoteType, date: Moment): { filePath: string; content: string } {
		return {
			filePath: this.buildFilePath(this.folder(type), this.fileName(type, date)),
			content: type === 'daily'
				? this.generateDailyNoteContent(date)
				: this.generateWeeklyNoteContent(date),
		};
	}

	/** Create the parent folder of a note. It comes from the path, so formats such as YYYY/MM/DD work too. */
	private async ensureParentExists(filePath: string): Promise<void> {
		await this.ensureFolderExists(filePath.substring(0, filePath.lastIndexOf('/')));
	}

	/** Create and open the note for a date (today by default). For weekly notes, any date in the week works. */
	async createNote(type: NoteType, date: Moment = now()) {
		try {
			const { filePath, content } = this.noteFor(type, date);
			await this.ensureParentExists(filePath);
			await this.createOrUpdateNote(filePath, content, type);
		} catch (error) {
			console.error(`Error creating ${type} note:`, error);
			new Notice(`Failed to create ${type} note. Check the console for details.`);
		}
	}

	/**
	 * Create the notes covering a date range, both ends included. Unlike
	 * createNote, existing notes are left untouched and nothing is opened.
	 */
	async createNotesInRange(type: NoteType, start: Moment, end: Moment): Promise<{ created: number; skipped: number }> {
		let created = 0;
		let skipped = 0;
		try {
			const dates = datesInRange(type, start, end);
			if (dates.length > MAX_BULK_NOTES) {
				new Notice(`That range covers ${plural(dates.length, type)}. The limit is ${MAX_BULK_NOTES} at a time.`);
				return { created, skipped };
			}

			for (const date of dates) {
				const { filePath, content } = this.noteFor(type, date);
				if (this.app.vault.getFileByPath(filePath)) {
					skipped++;
					continue;
				}
				await this.ensureParentExists(filePath);
				await this.app.vault.create(filePath, content);
				created++;
			}

			new Notice(`Created ${plural(created, type)}` + (skipped ? `, skipped ${skipped} that already exist` : ''));
		} catch (error) {
			console.error(`Error creating ${type} notes:`, error);
			new Notice(`Failed after creating ${plural(created, type)}. Check the console for details.`);
		}
		return { created, skipped };
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
	}
}

/** Add a native date picker row to a modal and return its input element. */
function addDateInput(containerEl: HTMLElement, name: string, desc: string, value: string, onEnter: () => void): HTMLInputElement {
	let inputEl!: HTMLInputElement;
	new Setting(containerEl).setName(name).setDesc(desc).addText((text) => {
		inputEl = text.inputEl;
		inputEl.type = 'date';
		text.setValue(value);
		inputEl.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				onEnter();
			}
		});
	});
	return inputEl;
}

/** Asks for a date, then creates the daily or weekly note for it. */
export class DateModal extends Modal {
	constructor(app: App, private plugin: DailyWeeklyNotesPlugin, private type: NoteType) {
		super(app);
	}

	onOpen() {
		this.setTitle(`Create ${this.type} note`);
		const desc = this.type === 'daily' ? 'Day of the note.' : 'Any day in the week of the note.';
		const submit = () => {
			const date = parseDateInput(inputEl.value);
			if (!date) {
				new Notice('Enter a valid date');
				return;
			}
			this.close();
			void this.plugin.createNote(this.type, date);
		};
		const inputEl = addDateInput(this.contentEl, 'Date', desc, now().format(DATE_INPUT_FORMAT), submit);
		new Setting(this.contentEl).addButton((button) => button.setButtonText('Create').setCta().onClick(submit));
	}

	onClose() {
		this.contentEl.empty();
	}
}

/** Asks for a start and end date, then creates every daily or weekly note in between. */
export class DateRangeModal extends Modal {
	constructor(app: App, private plugin: DailyWeeklyNotesPlugin, private type: NoteType) {
		super(app);
	}

	onOpen() {
		this.setTitle(`Create ${this.type} notes`);
		const weekly = this.type === 'weekly';
		const submit = () => {
			const start = parseDateInput(startEl.value);
			const end = parseDateInput(endEl.value);
			if (!start || !end) {
				new Notice('Enter a valid start and end date');
				return;
			}
			if (end.isBefore(start)) {
				new Notice('The end date is before the start date');
				return;
			}
			this.close();
			void this.plugin.createNotesInRange(this.type, start, end);
		};
		const today = now().format(DATE_INPUT_FORMAT);
		const startEl = addDateInput(this.contentEl, 'Start date',
			weekly ? 'Any day in the first week.' : 'First day, included.', today, submit);
		const endEl = addDateInput(this.contentEl, 'End date',
			weekly ? 'Any day in the last week.' : 'Last day, included.', today, submit);
		new Setting(this.contentEl)
			.setDesc(`Existing notes are skipped. At most ${MAX_BULK_NOTES} notes are created at a time.`)
			.addButton((button) => button.setButtonText('Create').setCta().onClick(submit));
	}

	onClose() {
		this.contentEl.empty();
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
