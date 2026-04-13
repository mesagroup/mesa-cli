/**
 * Warns when the npm global bin directory is not on PATH (common on Windows).
 * Never throws — install must always succeed.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

const ANSI_RESET = '\u001B[0m';
const ANSI_YELLOW = '\u001B[33m';

function normalizeForCompare(directory) {
	const resolved = path.resolve(directory.trim());
	return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function getPathEnv() {
	return process.env.PATH ?? process.env.Path ?? '';
}

function isNpmGlobalBinOnPath(binDirectory) {
	const pathEnv = getPathEnv();
	if (!pathEnv) {
		return false;
	}

	const target = normalizeForCompare(binDirectory);
	const segments = pathEnv.split(path.delimiter).filter(Boolean);

	for (const segment of segments) {
		try {
			if (normalizeForCompare(segment) === target) {
				return true;
			}
		} catch {
			// Ignore invalid path segments
		}
	}

	return false;
}

function printWarning(binDirectory) {
	const lines = [
		'',
		`${ANSI_YELLOW}mesa-cli:${ANSI_RESET} npm global bin directory is not in your PATH.`,
		`  ${binDirectory}`,
		'',
		'Add it and restart your terminal so the `mesa` command is found.',
	];

	if (process.platform === 'win32') {
		lines.push(
			'  PowerShell (user PATH, persistent):',
			`    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";${binDirectory}", "User")`,
			'',
			'  Command Prompt (user PATH — truncates PATH length; prefer PowerShell above):',
			`    setx PATH "%PATH%;${binDirectory}"`,
		);
	} else {
		const shellFile = (process.env.SHELL ?? '').includes('zsh')
			? '~/.zshrc'
			: '~/.bashrc';
		lines.push(
			`  Add this line to ${shellFile} (or your shell profile), then restart the terminal:`,
			`    export PATH="${binDirectory}:$PATH"`,
		);
	}

	console.warn(lines.join('\n'));
}

try {
	const prefix = execSync('npm prefix -g', {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim();

	if (prefix) {
		const binDirectory =
			process.platform === 'win32' ? prefix : path.join(prefix, 'bin');

		if (!isNpmGlobalBinOnPath(binDirectory)) {
			printWarning(binDirectory);
		}
	}
} catch {
	// Never fail install
}
