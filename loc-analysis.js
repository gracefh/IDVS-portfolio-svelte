import { createWriteStream } from "fs";
import { spawn } from "child_process";
import { createInterface } from 'readline';
import { globSync } from "glob";

const OUTPUT_FILE = "static/loc.csv";
const INPUT_FILES = "{src,static}/**/*.{svelte,css,html,js}";
const INDENT = "  ";

const files = globSync(INPUT_FILES);

if (files.length === 0) {
	console.error("No files found");
	process.exit(1);
}

const stream = createWriteStream(OUTPUT_FILE);
let wroteHeader = false;
let totalLines = 0;

for (let i=0; i<files.length; i++) {
	const file = files[i];
	const gitBlame = spawn('git', ['blame', file]);
	const rl = createInterface({ input: gitBlame.stdout });

	// Line number
	let index = 1;
	let fileType = file.split(".").pop();
	let type = fileType;

	for await (let line of rl) {
		totalLines++;
		let info = {file, line: index++, type};

		if (line.startsWith("^")) {
			line = line.slice(1);
		}

		info.commit = line.match(/^[0-9a-f]{6,}/i)[0];
		line = line.slice(info.commit.length + 1);

		let commitInfo = line.match(/^.*?\((?<author>.+?) (?<date>\d{4}-\d{2}-\d{2}) (?<time>\d{2}:\d{2}:\d{2}) (?<timezone>-?\d{4})\s+\d+\) /);
		if (commitInfo === null) {
			console.error("No match for", line);
		}

		info.author = commitInfo.groups.author;

		info.date = commitInfo.groups.date;
		info.time = commitInfo.groups.time;
		info.timezone = commitInfo.groups.timezone.slice(0, 3) + ":" + commitInfo.groups.timezone.slice(3);
		info.datetime = commitInfo.groups.date + "T" + info.time + info.timezone;
		// Object.assign(info, commitInfo.groups);

		line = line.slice(commitInfo[0].length);

		let indent = line.match(RegExp(`^(${INDENT})*`))[0]; // will always match something due to the *
		info.depth = indent.length / INDENT.length;

		line = line.trim();

		if (fileType === "svelte") {
			if (line === "<style>") {
				type = "css";
			}
			else if (line === "<script>") {
				type = "js";
			}
			else if (/<\/style>|<\/script>/.test(line)) {
				info.type = type = fileType;
			}
		}

		info.length = line.slice(indent.length).length;

		if (!wroteHeader) {
			stream.write(Object.keys(info).join(",") + "\n");
			wroteHeader = true;
		}

		stream.write(Object.values(info).join(",") + "\n");
	}

	gitBlame.kill();
}

console.info(`Analyzed a total of ${totalLines} lines of code in ${files.length} files. Results written to ${OUTPUT_FILE}`);

stream.end();