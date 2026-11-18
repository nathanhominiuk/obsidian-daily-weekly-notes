import { describe, it, expect, beforeEach, vi } from 'vitest';
import moment from 'moment';
import { TFile } from 'obsidian';
import DailyWeeklyNotesPlugin, { DailyWeeklyNotesSettingTab, MAX_BULK_NOTES, datesInRange, parseDateInput } from './main';

function createPlugin() {
	const mockApp = {
		vault: {
			getFileByPath: () => null,
			getFolderByPath: () => null,
			createFolder: vi.fn(async () => {}),
			create: vi.fn(async (path: string) => Object.assign(new TFile(), { path })),
			process: vi.fn(async () => ''),
		},
		workspace: {
			getLeaf: () => ({ openFile: async () => {} }),
		},
	};
	const mockManifest = { id: 'daily-weekly-notes', name: 'Test', version: '0.0.1' };
	const plugin = new DailyWeeklyNotesPlugin(mockApp as any, mockManifest as any);
	plugin.settings = {
		dailyNotesFolder: '',
		weeklyNotesFolder: '',
		dailyNoteFormat: 'YYYY-MM-DD',
		weeklyNoteFormat: 'GGGG - [Week] W',
		weeklyDateRangeFormat: 'MMMM Do',
	};
	return Object.assign(plugin, { mockApp });
}

describe('buildFilePath', () => {
	let plugin: ReturnType<typeof createPlugin>;
	beforeEach(() => { plugin = createPlugin(); });

	it('should return filename with .md extension when no folder', () => {
		expect((plugin as any).buildFilePath('', 'test')).toBe('test.md');
	});

	it('should include folder prefix when folder is set', () => {
		expect((plugin as any).buildFilePath('Notes', 'test')).toBe('Notes/test.md');
	});
});

describe('buildLinkPath', () => {
	let plugin: ReturnType<typeof createPlugin>;
	beforeEach(() => { plugin = createPlugin(); });

	it('should return just the filename when no folder', () => {
		expect((plugin as any).buildLinkPath('', 'test')).toBe('test');
	});

	it('should include folder prefix when folder is set', () => {
		expect((plugin as any).buildLinkPath('Notes', 'test')).toBe('Notes/test');
	});
});

describe('generateDailyNoteContent', () => {
	let plugin: ReturnType<typeof createPlugin>;
	beforeEach(() => { plugin = createPlugin(); });

	it('should include daily tag in frontmatter', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toMatch(/^---\ntags: \[daily\]\n/);
	});

	it('should include mobility property in frontmatter', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toMatch(/^---\ntags: \[daily\]\nmobility: false\n---\n/);
	});

	it('should contain the formatted date', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toContain('*Tuesday January 6th, 2026*');
	});

	it('should contain a link to the weekly note', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toContain('Week - [[2026 - Week 2]]');
	});

	it('should contain yesterday and tomorrow links', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toContain('Yesterday - [[2026-01-05]]');
		expect(content).toContain('Tomorrow - [[2026-01-07]]');
	});

	it('should end with a horizontal rule', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toContain('---\n\n');
	});

	it('should include folder paths in links when folders are set', () => {
		plugin.settings.dailyNotesFolder = 'Daily';
		plugin.settings.weeklyNotesFolder = 'Weekly';
		const date = moment('2026-01-06');
		const content = plugin.generateDailyNoteContent(date);
		expect(content).toContain('Week - [[Weekly/2026 - Week 2]]');
		expect(content).toContain('Yesterday - [[Daily/2026-01-05]]');
		expect(content).toContain('Tomorrow - [[Daily/2026-01-07]]');
	});
});

describe('generateWeeklyNoteContent', () => {
	let plugin: ReturnType<typeof createPlugin>;
	beforeEach(() => { plugin = createPlugin(); });

	it('should include daily and weekly tags in frontmatter', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toMatch(/^---\ntags: \[daily, weekly\]\n---\n/);
	});

	it('should contain the date range for same-month weeks', () => {
		const date = moment('2026-01-06'); // Week of Jan 5-11
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toContain('*January 5th - 11th*');
	});

	it('should contain links to all 7 days', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toContain('Monday - [[2026-01-05]]');
		expect(content).toContain('Tuesday - [[2026-01-06]]');
		expect(content).toContain('Wednesday - [[2026-01-07]]');
		expect(content).toContain('Thursday - [[2026-01-08]]');
		expect(content).toContain('Friday - [[2026-01-09]]');
		expect(content).toContain('Saturday - [[2026-01-10]]');
		expect(content).toContain('Sunday - [[2026-01-11]]');
	});

	it('should contain previous and next week links', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toContain('Last week - [[2026 - Week 1]]');
		expect(content).toContain('Next week - [[2026 - Week 3]]');
	});

	it('should handle cross-month date ranges', () => {
		// Week containing Jan 26 - Feb 1, 2026
		const date = moment('2026-01-29');
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toContain('January 26th - February 1st');
	});

	it('should include folder paths in links when folders are set', () => {
		plugin.settings.dailyNotesFolder = 'Daily';
		plugin.settings.weeklyNotesFolder = 'Weekly';
		const date = moment('2026-01-06');
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toContain('Monday - [[Daily/2026-01-05]]');
		expect(content).toContain('Last week - [[Weekly/2026 - Week 1]]');
		expect(content).toContain('Next week - [[Weekly/2026 - Week 3]]');
	});

	it('should end with a horizontal rule', () => {
		const date = moment('2026-01-06');
		const content = plugin.generateWeeklyNoteContent(date);
		expect(content).toMatch(/---\s*$/);
	});
});

describe('settings fallbacks', () => {
	it('should strip surrounding slashes and whitespace from folders', () => {
		const plugin = createPlugin();
		plugin.settings.dailyNotesFolder = ' /Daily/ ';
		plugin.settings.weeklyNotesFolder = '/';
		const content = plugin.generateDailyNoteContent(moment('2026-01-06'));
		expect(content).toContain('Yesterday - [[Daily/2026-01-05]]');
		expect(content).toContain('Week - [[2026 - Week 2]]');
	});

	it('should fall back to the default format when a format is empty', () => {
		const plugin = createPlugin();
		plugin.settings.dailyNoteFormat = ' ';
		plugin.settings.weeklyDateRangeFormat = '';
		expect(plugin.generateDailyNoteContent(moment('2026-01-06'))).toContain('Tomorrow - [[2026-01-07]]');
		expect(plugin.generateWeeklyNoteContent(moment('2026-01-06'))).toContain('*January 5th - 11th*');
	});
});

describe('createNote', () => {
	it('should create the parent folder of the note, including folders from the format', async () => {
		const plugin = createPlugin();
		plugin.settings.dailyNotesFolder = 'Daily';
		plugin.settings.dailyNoteFormat = 'YYYY/[note]';

		await plugin.createNote('daily');

		const year = moment().format('YYYY');
		expect(plugin.mockApp.vault.createFolder).toHaveBeenCalledWith(`Daily/${year}`);
		expect(plugin.mockApp.vault.create).toHaveBeenCalledWith(`Daily/${year}/note.md`, expect.any(String));
	});

	it('should not create a folder for notes in the vault root', async () => {
		const plugin = createPlugin();

		await plugin.createNote('weekly');

		expect(plugin.mockApp.vault.createFolder).not.toHaveBeenCalled();
		expect(plugin.mockApp.vault.create).toHaveBeenCalledOnce();
	});

	it('should not throw when creating the note fails', async () => {
		const plugin = createPlugin();
		plugin.mockApp.vault.create.mockRejectedValue(new Error('disk full'));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(plugin.createNote('daily')).resolves.toBeUndefined();
		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});
});

describe('createNote for a specific date', () => {
	it('should create the daily note for the given date', async () => {
		const plugin = createPlugin();

		await plugin.createNote('daily', moment('2025-03-14'));

		const [path, content] = plugin.mockApp.vault.create.mock.calls[0] as unknown as [string, string];
		expect(path).toBe('2025-03-14.md');
		expect(content).toContain('*Friday March 14th, 2025*');
	});

	it('should create the weekly note for the week containing the given date', async () => {
		const plugin = createPlugin();

		await plugin.createNote('weekly', moment('2026-01-01'));

		const [path, content] = plugin.mockApp.vault.create.mock.calls[0] as unknown as [string, string];
		expect(path).toBe('2026 - Week 1.md');
		expect(content).toContain('Monday - [[2025-12-29]]');
	});
});

describe('parseDateInput', () => {
	it('should parse a date input value', () => {
		expect(parseDateInput('2026-02-28')?.format('YYYY-MM-DD')).toBe('2026-02-28');
	});

	it('should reject empty and invalid values', () => {
		expect(parseDateInput('')).toBeNull();
		expect(parseDateInput('2026-02-30')).toBeNull();
		expect(parseDateInput('28/02/2026')).toBeNull();
	});
});

describe('datesInRange', () => {
	const format = (dates: moment.Moment[]) => dates.map((date) => date.format('YYYY-MM-DD'));

	it('should list every day, both ends included', () => {
		expect(format(datesInRange('daily', moment('2026-02-27'), moment('2026-03-02'))))
			.toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
	});

	it('should list a single day when start and end match', () => {
		expect(format(datesInRange('daily', moment('2026-01-06'), moment('2026-01-06')))).toEqual(['2026-01-06']);
	});

	it('should list the Monday of every week touching the range', () => {
		// Sunday of week 1 to Monday of week 3
		expect(format(datesInRange('weekly', moment('2026-01-04'), moment('2026-01-12'))))
			.toEqual(['2025-12-29', '2026-01-05', '2026-01-12']);
	});

	it('should return nothing when the end is before the start', () => {
		expect(datesInRange('daily', moment('2026-01-06'), moment('2026-01-05'))).toEqual([]);
	});
});

describe('createNotesInRange', () => {
	it('should create one daily note per day', async () => {
		const plugin = createPlugin();
		plugin.settings.dailyNotesFolder = 'Daily';

		const result = await plugin.createNotesInRange('daily', moment('2026-01-30'), moment('2026-02-01'));

		expect(result).toEqual({ created: 3, skipped: 0 });
		expect(plugin.mockApp.vault.create.mock.calls.map((call) => call[0]))
			.toEqual(['Daily/2026-01-30.md', 'Daily/2026-01-31.md', 'Daily/2026-02-01.md']);
		expect(plugin.mockApp.vault.createFolder).toHaveBeenCalledWith('Daily');
	});

	it('should create one weekly note per week across a year boundary', async () => {
		const plugin = createPlugin();

		await plugin.createNotesInRange('weekly', moment('2025-12-22'), moment('2026-01-05'));

		expect(plugin.mockApp.vault.create.mock.calls.map((call) => call[0]))
			.toEqual(['2025 - Week 52.md', '2026 - Week 1.md', '2026 - Week 2.md']);
	});

	it('should skip existing notes without modifying them', async () => {
		const plugin = createPlugin();
		plugin.mockApp.vault.getFileByPath = ((path: string) =>
			path === '2026-01-06.md' ? Object.assign(new TFile(), { path }) : null) as any;

		const result = await plugin.createNotesInRange('daily', moment('2026-01-05'), moment('2026-01-07'));

		expect(result).toEqual({ created: 2, skipped: 1 });
		expect(plugin.mockApp.vault.process).not.toHaveBeenCalled();
		expect(plugin.mockApp.vault.create.mock.calls.map((call) => call[0])).toEqual(['2026-01-05.md', '2026-01-07.md']);
	});

	it('should create nothing when the range exceeds the limit', async () => {
		const plugin = createPlugin();

		const result = await plugin.createNotesInRange('daily', moment('2026-01-01'), moment('2026-01-01').add(MAX_BULK_NOTES, 'days'));

		expect(result).toEqual({ created: 0, skipped: 0 });
		expect(plugin.mockApp.vault.create).not.toHaveBeenCalled();
	});

	it('should not throw when a note fails, and report what was created', async () => {
		const plugin = createPlugin();
		plugin.mockApp.vault.create.mockResolvedValueOnce(new TFile()).mockRejectedValue(new Error('disk full'));
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await plugin.createNotesInRange('daily', moment('2026-01-05'), moment('2026-01-07'));

		expect(result).toEqual({ created: 1, skipped: 0 });
		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});
});

describe('createOrUpdateNote', () => {
	it('should create a new note', async () => {
		const plugin = createPlugin();

		await plugin.createOrUpdateNote('test.md', 'content', 'daily');

		expect(plugin.mockApp.vault.create).toHaveBeenCalledWith('test.md', 'content');
	});

	it('should prepend the template when the note already exists', async () => {
		const plugin = createPlugin();
		const existing = Object.assign(new TFile(), { path: 'test.md' });
		plugin.mockApp.vault.getFileByPath = (() => existing) as any;

		await plugin.createOrUpdateNote('test.md', 'content', 'daily');

		expect(plugin.mockApp.vault.create).not.toHaveBeenCalled();
		const [file, transform] = plugin.mockApp.vault.process.mock.calls[0] as unknown as [TFile, (data: string) => string];
		expect(file).toBe(existing);
		expect(transform('old')).toBe('content\nold');
	});
});

describe('settings tab', () => {
	it('should bind every control to an existing setting', () => {
		const plugin = createPlugin();
		const tab = new DailyWeeklyNotesSettingTab(plugin.app, plugin);

		const keys: string[] = [];
		const collect = (items: any[]) => {
			for (const item of items) {
				if (item.control) keys.push(item.control.key);
				if (item.items) collect(item.items);
			}
		};
		collect(tab.getSettingDefinitions());

		expect(keys).toEqual(['dailyNotesFolder', 'weeklyNotesFolder']);
		for (const key of keys) {
			expect(plugin.settings).toHaveProperty(key);
		}
	});
});
