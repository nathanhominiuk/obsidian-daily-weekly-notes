import { describe, it, expect, beforeEach, vi } from 'vitest';
import moment from 'moment';
import { TFile } from 'obsidian';
import DailyWeeklyNotesPlugin from './main';

function createPlugin(): DailyWeeklyNotesPlugin {
	const mockApp = {
		vault: {
			getAbstractFileByPath: () => null,
			createFolder: async () => {},
			create: async () => {},
			process: async () => {},
		},
		workspace: {
			getLeaf: () => ({ openFile: async () => {} }),
		},
		commands: {
			executeCommandById: vi.fn(),
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
	return plugin;
}

describe('buildFilePath', () => {
	let plugin: DailyWeeklyNotesPlugin;
	beforeEach(() => { plugin = createPlugin(); });

	it('should return filename with .md extension when no folder', () => {
		expect((plugin as any).buildFilePath('', 'test')).toBe('test.md');
	});

	it('should include folder prefix when folder is set', () => {
		expect((plugin as any).buildFilePath('Notes', 'test')).toBe('Notes/test.md');
	});
});

describe('buildLinkPath', () => {
	let plugin: DailyWeeklyNotesPlugin;
	beforeEach(() => { plugin = createPlugin(); });

	it('should return just the filename when no folder', () => {
		expect((plugin as any).buildLinkPath('', 'test')).toBe('test');
	});

	it('should include folder prefix when folder is set', () => {
		expect((plugin as any).buildLinkPath('Notes', 'test')).toBe('Notes/test');
	});
});

describe('generateDailyNoteContent', () => {
	let plugin: DailyWeeklyNotesPlugin;
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
	let plugin: DailyWeeklyNotesPlugin;
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
		expect(content.trimEnd()).toMatch(/---$/);
	});
});

describe('createOrUpdateNote', () => {
	it('should invoke linter after creating a new note', async () => {
		const plugin = createPlugin();
		const mockFile = Object.create(TFile.prototype);
		mockFile.path = 'test.md';
		let callCount = 0;
		(plugin.app.vault as any).getAbstractFileByPath = () => {
			callCount++;
			// First call: check if file exists (return null = doesn't exist)
			// Second call: get created file (return TFile instance)
			return callCount === 1 ? null : mockFile;
		};
		(plugin.app.vault as any).create = vi.fn().mockResolvedValue(undefined);

		await plugin.createOrUpdateNote('test.md', 'content', 'daily');

		expect(plugin.app.commands.executeCommandById).toHaveBeenCalledWith('linter:lint-file');
	});

	it('should not throw when linter is unavailable', async () => {
		const plugin = createPlugin();
		const mockFile = Object.create(TFile.prototype);
		mockFile.path = 'test.md';
		let callCount = 0;
		(plugin.app.vault as any).getAbstractFileByPath = () => {
			callCount++;
			return callCount === 1 ? null : mockFile;
		};
		(plugin.app.vault as any).create = vi.fn().mockResolvedValue(undefined);
		plugin.app.commands.executeCommandById.mockImplementation(() => {
			throw new Error('Command not found');
		});

		await expect(plugin.createOrUpdateNote('test.md', 'content', 'daily'))
			.resolves.not.toThrow();
	});
});
