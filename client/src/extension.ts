import * as vscode from "vscode";
import {
	LanguageClient
} from 'vscode-languageclient/node';
import { readFiles } from './file_utils';
import { updateLocals, updateVariables } from './tf';
import { completionItemProvider, definitionProvider, hoverProvider, referenceProvider } from './providers';

let client: LanguageClient;

const refresh = async () => {
	await readFiles();
	await updateVariables();
	await updateLocals();

};

export async function activate(context: vscode.ExtensionContext) {
	await refresh();

	vscode.languages.registerReferenceProvider('terraform', referenceProvider);
	vscode.languages.registerCompletionItemProvider('terraform', completionItemProvider, '.');
	vscode.languages.registerHoverProvider('terraform', hoverProvider);
	vscode.languages.registerDefinitionProvider('terraform', definitionProvider);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
