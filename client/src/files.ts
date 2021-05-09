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

export let files: IFile[] = [];

export const readFiles = async () => {
	files = [];
	const workspaceFiles = await vscode.workspace.findFiles('**/*.tf', '**/node_modules/**');

	for (const file of workspaceFiles) {
		const text = fs.readFileSync(file.path, "utf8");
		files.push({
			path: file.path,
			text,
			json: JSON.parse(customParser.parse(text)),
		});
	}
};

export const findInFiles = async (search: RegExp): Promise<ISearchResult[]> => {
	const results: ISearchResult[] = [];
	for (const file of files) {
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
