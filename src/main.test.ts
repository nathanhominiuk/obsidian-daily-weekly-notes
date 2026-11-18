import { describe, it, expect, beforeEach, vi } from 'vitest';
import moment from 'moment';
import { TFile } from 'obsidian';
import DailyWeeklyNotesPlugin, { DailyWeeklyNotesSettingTab } from './main';

function createPlugin() {
	const executeCommandById = vi.fn();
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
		commands: { executeCommandById },
	};
	const mockManifest = { id: 'daily-weekly-notes', name: 'Test', version: '0.0.1' };
	const plugin = new DailyWeeklyNotesPlugin(mockApp as any, mockManifest as any);
	plugin.settings = {
		dailyNotesFolder: '',
		weeklyNotesFolder: '',
		dailyNoteFormat: 'YYYY-MM-DD',
		weeklyNoteFormat: 'GGGG - [Week] W',
		weeklyDateRangeFormat: 'MMMM Do',
		bookmarkManagedFolders: '',
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

describe('createOrUpdateNote', () => {
	it('should invoke linter after creating a new note', async () => {
		const plugin = createPlugin();

		await plugin.createOrUpdateNote('test.md', 'content', 'daily');

		expect(plugin.mockApp.vault.create).toHaveBeenCalledWith('test.md', 'content');
		expect(plugin.mockApp.commands.executeCommandById).toHaveBeenCalledWith('linter:lint-file');
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

	it('should not throw when linter is unavailable', async () => {
		const plugin = createPlugin();
		plugin.mockApp.commands.executeCommandById.mockImplementation(() => {
			throw new Error('Command not found');
		});
		const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});

		await expect(plugin.createOrUpdateNote('test.md', 'content', 'daily'))
			.resolves.toBeUndefined();
		consoleDebug.mockRestore();
	});
});

describe('manageBookmarks', () => {
	it('should not manage bookmarks when bookmarkManagedFolders is empty', async () => {
		const plugin = createPlugin();
		const mockInstance = { items: [], addItem: vi.fn(), removeItem: vi.fn(), save: vi.fn() };
		(plugin.app as any).internalPlugins = {
			getPluginById: () => ({ enabled: true, instance: mockInstance }),
		};
		plugin.settings.bookmarkManagedFolders = '';

		plugin.manageBookmarks('test.md', 'daily');

		expect(mockInstance.addItem).not.toHaveBeenCalled();
	});

	it('should add bookmark when folder is in managed list', async () => {
		const plugin = createPlugin();
		const mockInstance = { items: [], addItem: vi.fn(), removeItem: vi.fn(), save: vi.fn() };
		(plugin.app as any).internalPlugins = {
			getPluginById: () => ({ enabled: true, instance: mockInstance }),
		};
		plugin.settings.dailyNotesFolder = 'Daily';
		plugin.settings.bookmarkManagedFolders = 'Daily, Weekly';

		plugin.manageBookmarks('Daily/2026-01-06.md', 'daily');

		expect(mockInstance.addItem).toHaveBeenCalledWith({ type: 'file', path: 'Daily/2026-01-06.md' });
		expect(mockInstance.save).toHaveBeenCalled();
	});

	it('should remove old bookmarks in the managed folder', async () => {
		const plugin = createPlugin();
		const oldBookmark = { type: 'file', path: 'Daily/2026-01-05.md' };
		const unrelatedBookmark = { type: 'file', path: 'Other/note.md' };
		const mockInstance = {
			items: [oldBookmark, unrelatedBookmark],
			addItem: vi.fn(),
			removeItem: vi.fn(),
			save: vi.fn(),
		};
		(plugin.app as any).internalPlugins = {
			getPluginById: () => ({ enabled: true, instance: mockInstance }),
		};
		plugin.settings.dailyNotesFolder = 'Daily';
		plugin.settings.bookmarkManagedFolders = 'Daily';

		plugin.manageBookmarks('Daily/2026-01-06.md', 'daily');

		expect(mockInstance.removeItem).toHaveBeenCalledWith(oldBookmark);
		expect(mockInstance.removeItem).not.toHaveBeenCalledWith(unrelatedBookmark);
	});

	it('should handle bookmarks plugin being unavailable', async () => {
		const plugin = createPlugin();
		(plugin.app as any).internalPlugins = {
			getPluginById: () => null,
		};
		plugin.settings.bookmarkManagedFolders = 'Daily';
		plugin.settings.dailyNotesFolder = 'Daily';

		expect(() => plugin.manageBookmarks('Daily/test.md', 'daily')).not.toThrow();
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

		expect(keys).toEqual(['dailyNotesFolder', 'weeklyNotesFolder', 'bookmarkManagedFolders']);
		for (const key of keys) {
			expect(plugin.settings).toHaveProperty(key);
		}
	});
});
