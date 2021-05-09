
import * as vscode from 'vscode';
import { findInFiles, ISearchResult } from './files';
import { locals, variables } from './tf';

export async function refreshDiagnostics(collection: vscode.DiagnosticCollection) {
	const searches = [
		{
			name: "Variable",
			keyword: "var",
			collection: variables,
			regex: new RegExp(/var\.[a-z,_]*/gm),
		},
		{
			name: "Local",
			keyword: "local",
			collection: locals,
			regex: new RegExp(/local\.[a-z,_]*/gm)
		},
	];
	const diagnosticsByFile: Record<string, vscode.Diagnostic[]> = {};

	for (const s of searches) {
		const vars = await findInFiles(s.regex);
	
		for (const v of vars) {
			const varName = v.search.substring(s.keyword.length+1);
			if (!s.collection[varName]) {
				const range = new vscode.Range(v.line, v.column, v.line, v.column + v.search.length);
				const diagnostic = new vscode.Diagnostic(range, `${s.name} ${varName} is undefined`, vscode.DiagnosticSeverity.Information);
				if (!diagnosticsByFile[v.file]) {
					diagnosticsByFile[v.file] = [];
				}
	
				diagnosticsByFile[v.file].push(diagnostic)
			}
		}
	
	}
	for (const v in diagnosticsByFile) {
		collection.set(vscode.Uri.file(v), diagnosticsByFile[v]);
	}
}
