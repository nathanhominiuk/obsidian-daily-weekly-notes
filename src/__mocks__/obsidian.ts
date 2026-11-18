import moment from 'moment';

export { moment };

export class Plugin {
	app: any;
	manifest: any;
	constructor(app: any, manifest: any) {
		this.app = app;
		this.manifest = manifest;
	}
	addCommand() {}
	addSettingTab() {}
	loadData() { return Promise.resolve({}); }
	saveData() { return Promise.resolve(); }
}

export class PluginSettingTab {
	app: any;
	plugin: any;
	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
}

export class Modal {
	app: any;
	constructor(app: any) {
		this.app = app;
	}
	open() {}
	close() {}
}

export class Setting {}

export class TFile {
	path: string = '';
}

export class Notice {
	constructor(_msg: string) {}
}

export function normalizePath(path: string): string {
	return path;
}
