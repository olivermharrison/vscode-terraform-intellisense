import * as vscode from "vscode";
import * as fs from "fs";
const customParser = require("./parser");

interface ITerraformFile {
	[key: string]: any;

	variable?: Record<string, any[]>;
}

interface IFile {
	path: string;
	text: string;
	json?: ITerraformFile;
}
export interface ISearchResult {
	search: string;
	file: string;
	line: number;
	column: number;
}

export let files: Record<string, IFile> = {};

export const readFiles = async (file?: string) => {
	if (!files) {
		files = {};
	}
	const workspaceFiles = await vscode.workspace.findFiles(file || '**/*.tf', '**/node_modules/**');

	const fileReader = (file: string): Promise<IFile> => {
		return new Promise(resolve => {
			fs.readFile(file, "utf8", (err, text) => {
				
				let json: any;
				try {
					json = JSON.parse(customParser.parse(text));
				} catch(e) {
					console.error(e);
				}
				resolve({
					path: file,
					text,
					json,
				});
			});
		});
	};

	const promises = workspaceFiles.map(f => {
		return fileReader(f.path);
	});

	const fileArray = await Promise.all<IFile>(promises);
	for (const f of fileArray) {
		files[f.path] = f;
	}
}

export const findInFiles = async (search: RegExp): Promise<ISearchResult[]> => {
	const results: ISearchResult[] = [];
	for (const filename in files) {
		const file = files[filename];
		if (search.test(file.text)) {
			file.text.split("\n").forEach((line, index) => {
				const match = line.match(search);
				if (match) {
					for (const m of match) {
						results.push({
							search: m,
							file: file.path,
							line: index,
							column: line.search(search),
						});
					}
				}
			});
		}
	}

	return results;
};
