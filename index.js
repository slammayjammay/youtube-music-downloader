#!/usr/bin/env node

const readline = require('readline');
const { readFileSync } = require('fs');
const { resolve: fsResolve } = require('path')
const chalk = require('chalk');
const getYoutubePlaylistURLs = require('get-youtube-playlist-urls');
const Downloader = require('./Downloader');
const ProgressBar = require('./ProgressBar');

const OPTIONS = {
	maxDownloads: 3
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
	console.log();

	const option = await new Promise((resolve, reject) => {
		const prompt =
			`Press ${chalk.green.bold(1)} (one) to enter the YouTube URLs to download, or\n` +
			`Press ${chalk.green.bold(2)} (two) to enter a YouTube playlist URL to ` +
			`download all videos on the playlist, or\n` +
			`Press ${chalk.green.bold(3)} (three) to enter the path of a text file containing YouTube URLs.\n` +
			'\n' +
			`${chalk.green('>')} `;

		rl.question(prompt, answer => {
			answer = answer.trim();

			if (!['1', '2', '3'].includes(answer)) {
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
			rl.question(`Enter the YouTube playlist URL below.\n${chalk.green('>')} `, answer => {
				getYoutubePlaylistURLs(answer.trim())
					.then(urls => resolve(urls))
					.catch(error => {
						console.log(`${chalk.red.bold('Error:')} doesn't look like that points to a valid YouTube playlist.`);
						reject(error);
					});
			});
		});
	} else if (option === '3') {
		videos = await new Promise((resolve, reject) => {
			rl.question(`Please enter the file path to read from (relative or absolute).\n${chalk.green('>')} `, answer => {
				const filePath = fsResolve(answer.trim());

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

	const finishedVideos = {};

	// ugh....
	const idMap = {};
	videos.forEach(url => idMap[Downloader.getIdFromURL(url)] = url);

	// ffmpeg maxes out the CPU when converting, resulting in fans going bananas
	// for the entire duration of the download. if there are a ton of videos to
	// download, limit the number of simultaneous donwloads.
	const batchSize = videos.length > 20 ? OPTIONS.maxDownloads : 10;

	while (videos.length > 0) {
		if (videos.length > batchSize) {
			console.log('Downloading the next batch of videos...');
		}

		videoBatch = videos.splice(0, batchSize);

		const processedVideos = await beginDownloadProcess(videoBatch);
		Object.assign(finishedVideos, processedVideos);
	}

	console.log();
	console.log(chalk.bold('Complete!'));
	console.log();
	console.log(chalk.bold(chalk.bold.green('Download status:')));

	Object.keys(finishedVideos).forEach(id => {
		const url = idMap[id];

		if (finishedVideos[id] === 'success') {
			console.log(`- ${chalk.cyan(url)} --> ${chalk.bold.green('Success')}`);
		} else if (finishedVideos[id] === 'fail') {
			console.log(`- ${chalk.cyan(url)} --> ${chalk.bold.red('Fail')}`);
		}
	});

	process.exit()
})();

program.catch(error => {
	console.log(error);
	process.exit();
});

function beginDownloadProcess(videos) {
	return new Promise((resolve, reject) => {
		// create downloader
		const downloader = new Downloader({ maxDownloads: videos.length });
		downloader.on('URLParseError', url => {
			console.log(`Whoops! "${chalk.cyan(url)}" could not be parsed correctly. Skipping!`);
		});
		videoBatch.forEach(url => downloader.addURL(url));

		if (downloader.getURLs().length === 0) {
			console.log(`Hmm...there are no URLS to download...`);
			process.exit();
		}

		// create progress bar
		const progressBar = new ProgressBar({ numBars: downloader.getIds().length });

		// keep track of finished videos
		const finishedVideos = {};
		downloader.getIds().forEach(id => finishedVideos[id] = null);

		// error
		downloader.on('error', (error, data) => {
			progressBar.error(data.videoId);
			finishedVideos[data.videoId] = 'fail';
		});

		// progress
		downloader.on('progress', data => {
			progressBar.update(data.videoId, data.progress.percentage / 100);
		});

		// finished
		downloader.on('finished', (err, data) => {
			finishedVideos[data.videoId] = 'success';
			progressBar.finish(data.videoId);

			const finished = Object.keys(finishedVideos).map(key => finishedVideos[key]);

			if (finished.every(val => !!val)) {
				resolve(finishedVideos);
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
	});
}
