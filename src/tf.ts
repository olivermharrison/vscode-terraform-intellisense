import { files, findInFiles, ISearchResult } from './files';

interface IItem {
	pos: {
		file: string;
		line: number;
		column;
	};
	references: ISearchResult[];
}

interface ILocal extends IItem {
	name: string;
	value: any;
}

interface IVariable extends IItem {
	default: any;
	description: string;
	name: string;
	required: boolean;
	type: string;
}

export let variables: Record<string, IVariable> = {};
export let locals: Record<string, ILocal> = {};

export const updateVariables = async (filename?: string) => {
	if (!filename) {
		variables = {};
	}
	const filesToScan = filename ? [filename] : Object.keys(files);
	for (const f of filesToScan) {
		const file = files[f];
		if (file.json?.variable) {
			for (const v in file.json?.variable) {
				const data = file.json.variable[v][0];

				const search = await findInFiles(new RegExp(`variable "${v}"`));
				const references = await findInFiles(new RegExp(`var.${v}`));

				variables[v] = {
					default: data.default,
					description: data.description,
					type: data.type,
					required: data.required,
					name: v,
					pos: {
						file: file.path,
						line: search[0]?.line || 0,
						column: search[0]?.column || 0,
					},
					references,
				};
			}
		}
	}
};

export const updateLocals = async (filename?: string) => {
	if (!filename) {
		locals = {};
	}
	const filesToScan = filename ? [filename] : Object.keys(files);
	for (const f of filesToScan) {
		const file = files[f];
		if (file.json?.locals) {
			for (const item of file.json.locals) {
				for (const local in item) {

				// TODO smart search... regex
				// const search = await findInFiles(`variable "${v}"`);
				const references = await findInFiles(new RegExp(`local.${local}`));

					locals[local] = {
						name: local,
						value: item[local],
						pos: {
							file: file.path,
							line: 0,
							column: 0,
						},
						references,
					}
				}
			}
		}
	}
};

export const getReferencesForWord = (word: string): ISearchResult[] => {
	return variables[word]?.references || locals[word]?.references || [];
};
