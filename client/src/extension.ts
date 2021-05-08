/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, languages, CompletionItem, CompletionItemKind, Position, TextDocument, Uri, WorkspaceFolder, CancellationToken, Hover, HoverProvider, MarkdownString } from 'vscode';
import * as fs from 'fs';
const parser = require('@evops/hcl-terraform-parser');

import {
	LanguageClient, LanguageClientOptions, ServerOptions, TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();

	let variables = {};
	const files = await workspace.findFiles('**/*.*', '**/node_modules/**');

	for (const file of files) {
		const text = fs.readFileSync(file.path, "utf8");
		const hclFile = parser.parse(text);
		variables = {...variables, ...hclFile.variables};
	}

	const provider2 = languages.registerCompletionItemProvider(
		'terraform',
		{
			provideCompletionItems(document: TextDocument, position: Position) {
				
				const text = document.getText();
				const hclFile = parser.parse(text);
				variables = {...variables, ...hclFile.variables};
			

				// get all text until the `position` and check if it reads `console.`
				// and if so then complete if `log`, `warn`, and `error`
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.endsWith('var.')) {
					return undefined;
				}

				return Object.keys(variables).map(k => new CompletionItem(k, CompletionItemKind.Variable))
			}
		},
		'.' // triggered whenever a '.' is being typed
	);

	context.subscriptions.push(provider2);

	languages.registerHoverProvider('terraform', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

			for (const variable in variables) {
				if (word === variable) {
					const varData = variables[variable];
					const md = new MarkdownString();
					md.value = `*${varData.description}*\n\ntype: **${varData.type}**\n\ndefault: **${varData.default}**`;

					return new Hover(md)
				}
			}
        }
    });
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

