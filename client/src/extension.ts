import * as vscode from "vscode";
import {
	LanguageClient
} from 'vscode-languageclient/node';
import { readFiles } from './files';
import { updateLocals, updateVariables } from './tf';
import { completionItemProvider, definitionProvider, hoverProvider, referenceProvider } from './providers';
import { refreshDiagnostics } from './diagnostics';

let client: LanguageClient;

const refresh = async () => {
	await readFiles();
	await updateVariables();
	await updateLocals();
	refreshDiagnostics(diagnostics)
};

const diagnostics = vscode.languages.createDiagnosticCollection("terraform-intellisense");

export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(diagnostics);
	await refresh();

	vscode.languages.registerReferenceProvider('terraform', referenceProvider);
	vscode.languages.registerCompletionItemProvider('terraform', completionItemProvider, '.');
	vscode.languages.registerHoverProvider('terraform', hoverProvider);
	vscode.languages.registerDefinitionProvider('terraform', definitionProvider);

	const watcher = vscode.workspace.createFileSystemWatcher("**/*.tf");
	watcher.onDidChange(async () => {
		await refresh();
	});
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
