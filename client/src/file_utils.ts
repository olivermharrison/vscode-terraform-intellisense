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

export const files: IFile[] = [];

export const readFiles = async () => {
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

export const findInFiles = async (search: string): Promise<ISearchResult[]> => {
	const results: ISearchResult[] = [];
	for (const file of files) {
		if (file.text.includes(search)) {
			file.text.split("\n").forEach((line, index) => {
				if (line.includes(search)) {
					// TODO support for multiple in occurance in same line?
					results.push({
						search,
						file: file.path,
						line: index,
						column: line.indexOf(search),
					});
				}
			});
		}
	}

	return results;
};

