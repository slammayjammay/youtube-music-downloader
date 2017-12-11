const readline = require('readline');
const { readFileSync } = require('fs');
const { resolve: fsResolve } = require('path')
const chalk = require('chalk');
const Downloader = require('./Downloader');
const ProgressBar = require('./ProgressBar');

const OPTIONS = {
	maxDownloads: 10
};

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
	console.log(
		`${chalk.bold('NOTE:')} there can only be a maximum number of ` +
		`${chalk.bold(10)} downloads\nperformed.`
	);
	console.log('----------------------------------------------------------------');
	console.log();

	const option = await new Promise((resolve, reject) => {
		const prompt =
			`Press ${chalk.green.bold(1)} (one) to enter the YouTube URLs to download, or\n` +
			`Press ${chalk.green.bold(2)} (two) to enter the path of a text file containing YouTube URLs.\n` +
			'\n' +
			`${chalk.green('>')} `;

		rl.question(prompt, answer => {
			answer = answer.trim();

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

	// start downloader
	const downloader = new Downloader({ maxDownloads: OPTIONS.maxDownloads });
	downloader.on('URLParseError', url => {
		console.log(`Whoops! "${chalk.cyan(url)}" could not be parsed correctly. Skipping!`);
	});
	videos.forEach(url => downloader.addURL(url));

	if (downloader.getURLs().length === 0) {
		console.log(`Hmm...there are no URLS to download...`);
		process.exit();
	}

	// start progress bar
	const progressBar = new ProgressBar({ numBars: downloader.getIds().length });

	// keep track of finished videos
	const finishedVideos = {};
	downloader.getIds().forEach(id => finishedVideos[id] = null);

	// map youtube ids to urls
	const idMap = {};
	downloader.getURLs().forEach(url => idMap[downloader.getIdFromURL(url)] = url);

	downloader.on('error', (error, data) => {
		progressBar.error(data.videoId);
		finishedVideos[data.videoId] = 'fail';
	});
	downloader.on('progress', data => {
		progressBar.update(data.videoId, data.progress.percentage / 100);
	});
	downloader.on('finished', (err, data) => {
		finishedVideos[data.videoId] = 'success';
		progressBar.finish(data.videoId);

		const finished = Object.keys(finishedVideos).map(key => finishedVideos[key]);
		if (finished.every(val => !!val)) {
			console.log();
			console.log(chalk.bold('Complete!'));

			console.log(chalk.green.bold('Successful video downloads:'));
			Object.keys(finishedVideos).forEach(id => {
				const url = idMap[id];
				if (finishedVideos[id] === 'success') {
					console.log(`- ${chalk.cyan(url)}`);
				}
			});

			console.log();
			console.log(chalk.red.bold('Failed video downloads:'));
			Object.keys(finishedVideos).forEach(id => {
				const url = idMap[id];
				if (finishedVideos[id] === 'fail') {
					console.log(`- ${chalk.cyan(url)}`);
				}
			});
			process.exit();
		}
	});

	console.log();
	console.log(
		`${chalk.green.bold('Youtube Music Downloader')} will now attempt to ` +
		`download the following URLs:`
	);
	downloader.getURLs().forEach(url => console.log(`- ${chalk.cyan(url)}`));
	console.log();

	downloader.run();
	progressBar.init(downloader.getIds());
})();

program.catch(error => {
	console.log(error);
	process.exit();
});
