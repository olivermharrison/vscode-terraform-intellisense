
import * as vscode from "vscode";

import { getReferencesForWord, locals, variables } from './tf';

export const referenceProvider: vscode.ReferenceProvider = {
	async provideReferences(document, position, context, token) {
		const range = document.getWordRangeAtPosition(position);
		const word = document.getText(range);

		return getReferencesForWord(word).map(r => {
			const targetPos = new vscode.Position(
				r.line,
				r.column
			);
			return new vscode.Location(vscode.Uri.file(r.file), new vscode.Range(targetPos, targetPos))
		});
	}
};

export const completionItemProvider: vscode.CompletionItemProvider = {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
		const linePrefix = document.lineAt(position).text.substr(0, position.character);

		if (linePrefix.endsWith("var.")) {
			return Object.keys(variables).map(k => new vscode.CompletionItem(k, vscode.CompletionItemKind.Variable))
		} else if (linePrefix.endsWith("local.")) {
			return Object.keys(locals).map(k => new vscode.CompletionItem(k, vscode.CompletionItemKind.Variable))
		} 

		return [];	
	}
};

export const hoverProvider: vscode.HoverProvider = {
	provideHover(document, position, token) {

		const range = document.getWordRangeAtPosition(position);
		const word = document.getText(range);

		if (variables[word]) {
			return new vscode.Hover(`${variables[word].description}`)
		} else if (locals[word]) {
			return new vscode.Hover(`${locals[word].value}`)
		}

	}
};

export const definitionProvider: vscode.DefinitionProvider = {
	provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.DefinitionLink[] {
		const range = document.getWordRangeAtPosition(position);
		const word = document.getText(range);

		const data  = variables[word] || locals[word];
		if (data && data.pos) {
			const targetPos = new vscode.Position(
				data.pos.line,
				data.pos.column,
			);
			return [{
				targetUri: vscode.Uri.file(data.pos.file),
				targetRange: new vscode.Range(targetPos, targetPos),
			}];
		}
		return [];
	}
};
