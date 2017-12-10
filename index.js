const readline = require('readline');
const { readFileSync } = require('fs');
const { resolve: fsResolve } = require('path')
const chalk = require('chalk');
const Downloader = require('./Downloader');
const ProgressBar = require('./ProgressBar');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const program = (async () => {
	console.log(`Hello and welcome to ${chalk.green.bold('YouTube Music Downloader')}!`);
	console.log();
	console.log(
		`${chalk.green.bold('Youtube Music Downloader')} can download YouTube ` +
		`videos as .mp3\nfiles! You can provide the Youtube URL(s) here on the ` +
		`command\nline or enter them in a text file that ` +
		`${chalk.green.bold('Youtube Music Downloader')}\nwill read.`
	);
	console.log();
	console.log('----------------------------------------------------------------');
	console.log();

	const option = await new Promise((resolve, reject) => {
		const prompt =
			`Press ${chalk.green.bold(1)} (one) to enter the YouTube URLs to download, or\n` +
			`Press ${chalk.green.bold(2)} (two) to enter the path of a text file containing YouTube URLs.\n` +
			'\n' +
			`${chalk.green('>')} `;

		rl.question(prompt, answer => {
			if (!['1', '2'].includes(answer)) {
				console.log(
					`${chalk.red.bold('Error: ')}` +
					`"${chalk.green.bold(answer)}" is not in the list of numbers above.`
				);
				process.exit();
			}

			resolve(answer);
		});
	});

	let videos;
	if (option === '1') {
		videos = await new Promise((resolve, reject) => {
			rl.question(`Enter the YouTube URLs below (separated by spaces).\n${chalk.green('>')} `, answer => {
				resolve(answer.split(/\s/).filter(s => s !== ''));
			});
		});
	} else if (option === '2') {
		videos = await new Promise((resolve, reject) => {
			rl.question(`Please enter the file path to read from (relative or absolute).\n${chalk.green('>')} `, answer => {
				const filePath = fsResolve(answer);

				let fileContents;

				try {
					fileContents = readFileSync(filePath).toString();
				} catch (e) {
					console.log(`${chalk.red.bold('Error:')} "${filePath}" does not appear to be a valid text file.`);
					throw new Error(e);
				}

				resolve(fileContents.split(/\s/).filter(s => s !== ''));
			});
		});
	}

	console.log();
	console.log('Got it!');

	const downloader = new Downloader();
	const progressBar = new ProgressBar();

	downloader.on('error', error => {
		throw new Error(error);
	});
	downloader.on('invalidId', url => {
		console.log(`Whoops! "${chalk.cyan(url)}" doesn't seem to be a valid URL. Skipping!`);
	});
	downloader.on('progress', data => {
		progressBar.update(data.progress.percentage / 100);
	});
	downloader.on('finished', (err, data) => {
		console.log(chalk.green.bold('Complete!'));
		process.exit();
	});

	videos.forEach(url => downloader.addURL(url));

	if (downloader.getURLS().length === 0) {
		console.log(`Hmm...there are no URLS to download...`);
		process.exit();
	}

	console.log(
		`${chalk.green.bold('Youtube Music Downloader')} will now attempt to ` +
		`download the following URLs:`
	);
	downloader.getURLS().forEach(url => console.log(`- ${chalk.cyan(url)}`));
	console.log();

	downloader.run();
	progressBar.init();
})();

program.catch(error => {
	console.log(error);
	process.exit();
});
