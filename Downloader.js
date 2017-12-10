const EventEmitter = require('events');
const { homedir } = require('os');
const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');

class Downloader extends EventEmitter {
	constructor() {
		super();

		this.urls = [];
		this.regex = /\?v=([^&]*)/;

		this.yd = new YoutubeMp3Downloader({
			ffmpegPath: '/usr/local/bin/ffmpeg', // TODO: add local copy
			outputPath: `${homedir()}/Downloads`,
			youtubeVideoQuality: 'highest',
			queueParallelism: 1, // TODO: this is the max number of downloads?
			progressTimeout: 300
		});

		this.yd.on('error', (...args) => this.emit('error', ...args));
		this.yd.on('progress', (...args) => this.emit('progress', ...args));
		this.yd.on('finished', (...args) => this.emit('finished', ...args));
	}

	addURL(url) {
		if (this.isValidURL(url)) {
			this.urls.push(url);
		} else {
			this.emit('invalidId', url);
		}
	}

	getURLS() {
		return this.urls;
	}

	isValidURL(url) {
		const regMatch = this.regex.exec(url);
		return !!regMatch;
	}

	run() {
		this.urls.forEach(url => {
			const id = this.regex.exec(url)[1];
			this.yd.download(id);
		});
	}
}

module.exports = Downloader;
