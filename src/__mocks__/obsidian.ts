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
	containerEl: any = {
		empty() {},
		createDiv() { return { setText() {} }; },
		createEl() { return { setText() {}, setAttr() {} }; }
	};
	constructor(app: any, plugin: any) {
		this.app = app;
		this.plugin = plugin;
	}
	display() {}
}

export class Setting {
	constructor(_el: any) {}
	setName() { return this; }
	setDesc() { return this; }
	setHeading() { return this; }
	addText() { return this; }
}

export class TFile {
	path: string = '';
}

export class Notice {
	constructor(_msg: string) {}
}

export function normalizePath(path: string): string {
	return path;
}
