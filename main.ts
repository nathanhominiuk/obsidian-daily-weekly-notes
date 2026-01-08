import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, normalizePath } from 'obsidian';
import type { Moment } from 'moment';

// Use Obsidian's global moment instance (provided by Obsidian at runtime)
declare const moment: typeof import('moment');

interface DailyWeeklyNotesSettings {
	dailyNoteFormat: string;
	weeklyNoteFormat: string;
	weeklyDateRangeFormat: string;
}

const DEFAULT_SETTINGS: DailyWeeklyNotesSettings = {
	dailyNoteFormat: 'YYYY-MM-DD',
	weeklyNoteFormat: 'GGGG - [Week] W',
	weeklyDateRangeFormat: 'MMMM Do'
}

export default class DailyWeeklyNotesPlugin extends Plugin {
	settings: DailyWeeklyNotesSettings;

	async onload() {
		await this.loadSettings();

		// Add command to create daily note
		this.addCommand({
			id: 'create-daily-note',
			name: 'Create daily note',
			callback: () => {
				this.createDailyNote();
			}
		});

		// Add command to create weekly note
		this.addCommand({
			id: 'create-weekly-note',
			name: 'Create weekly note',
			callback: () => {
				this.createWeeklyNote();
			}
		});

		// Add settings tab
		this.addSettingTab(new DailyWeeklyNotesSettingTab(this.app, this));
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		
		// Validate and sanitize settings
		if (!this.settings.dailyNoteFormat || this.settings.dailyNoteFormat.trim() === '') {
			this.settings.dailyNoteFormat = DEFAULT_SETTINGS.dailyNoteFormat;
		}
		if (!this.settings.weeklyNoteFormat || this.settings.weeklyNoteFormat.trim() === '') {
			this.settings.weeklyNoteFormat = DEFAULT_SETTINGS.weeklyNoteFormat;
		}
		if (!this.settings.weeklyDateRangeFormat || this.settings.weeklyDateRangeFormat.trim() === '') {
			this.settings.weeklyDateRangeFormat = DEFAULT_SETTINGS.weeklyDateRangeFormat;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createDailyNote() {
		try {
			const today = moment();
			const fileName = today.format(this.settings.dailyNoteFormat);
			const filePath = normalizePath(`${fileName}.md`);

			// Generate the template content
			const content = this.generateDailyNoteContent(today);

			// Create or update the file
			await this.createOrUpdateNote(filePath, content, 'daily');
		} catch (error) {
			console.error('Error creating daily note:', error);
			new Notice('Failed to create daily note. Check console for details.');
		}
	}

	async createWeeklyNote() {
		try {
			const today = moment();
			const fileName = today.format(this.settings.weeklyNoteFormat);
			const filePath = normalizePath(`${fileName}.md`);

			// Generate the template content
			const content = this.generateWeeklyNoteContent(today);

			// Create or update the file
			await this.createOrUpdateNote(filePath, content, 'weekly');
		} catch (error) {
			console.error('Error creating weekly note:', error);
			new Notice('Failed to create weekly note. Check console for details.');
		}
	}

	generateDailyNoteContent(date: Moment): string {
		try {
			const formattedDate = date.format('dddd MMMM Do, YYYY');
			const weekLink = date.format(this.settings.weeklyNoteFormat);
			const yesterday = date.clone().subtract(1, 'day').format(this.settings.dailyNoteFormat);
			const tomorrow = date.clone().add(1, 'day').format(this.settings.dailyNoteFormat);

			return `*${formattedDate}*

Week - [[${weekLink}]]
Yesterday - [[${yesterday}]]
Tomorrow - [[${tomorrow}]]

---

`;
		} catch (error) {
			console.error('Error generating daily note content:', error);
			throw new Error('Invalid date format settings');
		}
	}

	generateWeeklyNoteContent(date: Moment): string {
		try {
			// Get the start of the ISO week (Monday)
			const weekStart = date.clone().isoWeekday(1);
			const weekEnd = weekStart.clone().add(6, 'days');

			// Format the date range
			let dateRange: string;
			if (weekStart.month() === weekEnd.month()) {
				// Same month: "January 5th - 11th"
				const startFormat = this.settings.weeklyDateRangeFormat;
				// For end date, extract just the day portion (everything after the last space or the whole thing if no space)
				const endFormat = startFormat.includes(' ') ? startFormat.split(' ').pop() || 'Do' : 'Do';
				dateRange = `${weekStart.format(startFormat)} - ${weekEnd.format(endFormat)}`;
			} else {
				// Different months: "January 30th - February 5th"
				dateRange = `${weekStart.format(this.settings.weeklyDateRangeFormat)} - ${weekEnd.format(this.settings.weeklyDateRangeFormat)}`;
			}

			// Generate links for each day of the week
			const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
			const dayLinks = daysOfWeek.map((dayName, index) => {
				const dayDate = weekStart.clone().add(index, 'days');
				return `${dayName} - [[${dayDate.format(this.settings.dailyNoteFormat)}]]`;
			}).join('\n');

			// Previous and next week links
			const lastWeekDate = date.clone().subtract(1, 'week');
			const lastWeek = lastWeekDate.format(this.settings.weeklyNoteFormat);
			
			const nextWeekDate = date.clone().add(1, 'week');
			const nextWeek = nextWeekDate.format(this.settings.weeklyNoteFormat);

			return `*${dateRange}*

Last week - [[${lastWeek}]]

${dayLinks}

Next week - [[${nextWeek}]]

---

`;
		} catch (error) {
			console.error('Error generating weekly note content:', error);
			throw new Error('Invalid date format settings');
		}
	}

	async createOrUpdateNote(filePath: string, content: string, noteType: string) {
		try {
			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (file instanceof TFile) {
				// File exists, prepend content using atomic process operation
				await this.app.vault.process(file, (existingContent) => {
					return content + '\n' + existingContent;
				});
				new Notice(`${noteType === 'daily' ? 'Daily' : 'Weekly'} note template added to existing file`);
			} else {
				// File doesn't exist, create it
				await this.app.vault.create(filePath, content);
				new Notice(`${noteType === 'daily' ? 'Daily' : 'Weekly'} note created`);
			}

			// Open the file
			const createdFile = this.app.vault.getAbstractFileByPath(filePath);
			if (createdFile instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(createdFile);
			}
		} catch (error) {
			console.error('Error creating/updating note:', error);
			new Notice(`Failed to create ${noteType} note. The file may be open in another program or the format may be invalid.`);
			throw error;
		}
	}
}

class DailyWeeklyNotesSettingTab extends PluginSettingTab {
	plugin: DailyWeeklyNotesPlugin;

	constructor(app: App, plugin: DailyWeeklyNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('p', {
			text: 'Configure date formats using Moment.js format strings. ',
			cls: 'setting-item-description'
		});

		const formatLink = containerEl.createEl('a', {
			text: 'View format reference',
			href: 'https://momentjs.com/docs/#/displaying/format/'
		});
		formatLink.setAttr('target', '_blank');

		containerEl.createEl('br');
		containerEl.createEl('br');

		// Daily note format setting
		const dailyPreview = containerEl.createDiv('setting-item-description');
		dailyPreview.setText(`Preview: ${moment().format(this.plugin.settings.dailyNoteFormat)}`);

		new Setting(containerEl)
			.setName('Daily note filename format')
			.setDesc('Format for daily note filenames and links (e.g., YYYY-MM-DD)')
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.dailyNoteFormat)
				.onChange(async (value) => {
					this.plugin.settings.dailyNoteFormat = value;
					await this.plugin.saveSettings();
					// Update preview
					try {
						dailyPreview.setText(`Preview: ${moment().format(value)}`);
					} catch (e) {
						dailyPreview.setText(`Preview: Invalid format`);
					}
				}));

		containerEl.createEl('br');

		// Weekly note format setting
		const weeklyPreview = containerEl.createDiv('setting-item-description');
		weeklyPreview.setText(`Preview: ${moment().format(this.plugin.settings.weeklyNoteFormat)}`);

		new Setting(containerEl)
			.setName('Weekly note filename format')
			.setDesc('Format for weekly note filenames and links (use W for ISO week number, GGGG for ISO week year, [text] for literal text)')
			.addText(text => text
				.setPlaceholder('GGGG - [Week] W')
				.setValue(this.plugin.settings.weeklyNoteFormat)
				.onChange(async (value) => {
					this.plugin.settings.weeklyNoteFormat = value;
					await this.plugin.saveSettings();
					// Update preview
					try {
						weeklyPreview.setText(`Preview: ${moment().format(value)}`);
					} catch (e) {
						weeklyPreview.setText(`Preview: Invalid format`);
					}
				}));

		containerEl.createEl('br');

		// Weekly date range format setting
		const rangePreview = containerEl.createDiv('setting-item-description');
		const weekStart = moment().isoWeekday(1);
		const weekEnd = weekStart.clone().add(6, 'days');
		rangePreview.setText(`Preview: ${weekStart.format(this.plugin.settings.weeklyDateRangeFormat)} - ${weekEnd.format(this.plugin.settings.weeklyDateRangeFormat)}`);

		new Setting(containerEl)
			.setName('Weekly note date range format')
			.setDesc('Format for the date range shown in weekly notes (e.g., MMMM Do)')
			.addText(text => text
				.setPlaceholder('MMMM Do')
				.setValue(this.plugin.settings.weeklyDateRangeFormat)
				.onChange(async (value) => {
					this.plugin.settings.weeklyDateRangeFormat = value;
					await this.plugin.saveSettings();
					// Update preview
					try {
						const weekStart = moment().isoWeekday(1);
						const weekEnd = weekStart.clone().add(6, 'days');
						rangePreview.setText(`Preview: ${weekStart.format(value)} - ${weekEnd.format(value)}`);
					} catch (e) {
						rangePreview.setText(`Preview: Invalid format`);
					}
				}));

		containerEl.createEl('br');
		new Setting(containerEl).setName('Common format patterns').setHeading();

		const formatExamples = containerEl.createEl('ul');
		formatExamples.createEl('li').setText('YYYY-MM-DD → 2026-01-06 (for daily notes)');
		formatExamples.createEl('li').setText('YYYY/MM/DD → 2026/01/06 (for daily notes)');
		formatExamples.createEl('li').setText('YYYY.MM.DD → 2026.01.06 (for daily notes)');
		formatExamples.createEl('li').setText('YYYYMMDD → 20260106 (for daily notes)');
		formatExamples.createEl('li').setText('GGGG-[W]W → 2026-W2 (for weekly notes)');
		formatExamples.createEl('li').setText('GGGG - [Week] W → 2026 - Week 2 (for weekly notes)');
		formatExamples.createEl('li').setText('MMMM Do → January 6th (for date ranges)');
		formatExamples.createEl('li').setText('MMM D → Jan 6 (for date ranges)');
		
		containerEl.createEl('br');
		
		const note = containerEl.createDiv('setting-item-description');
		note.setText('Note: Use GGGG (ISO week year) instead of YYYY for weekly notes to handle year boundaries correctly.');
	}
}
