const EventEmitter = require('events');
const { homedir } = require('os');
const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { join } = require('path');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');

const DEFAULT_OPTIONS = {
	maxDownloads: 1,
	downloadPath: `${homedir()}/Downloads`
};

const REGEX = /\?v=([^&]*)/;

class Downloader extends EventEmitter {
	static getIdFromURL(url) {
		return REGEX.exec(url)[1];
	}

	constructor(options = {}) {
		super();

		this.options = Object.assign({}, DEFAULT_OPTIONS, options);
		this.urls = [];

		this.yd = new YoutubeMp3Downloader({
			ffmpegPath: join(__dirname, './ffmpeg'),
			outputPath: this.options.downloadPath,
			youtubeVideoQuality: 'highest',
			queueParallelism: this.options.maxDownloads,
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
			this.emit('URLParseError', url);
		}
	}

	getURLs() {
		return this.urls;
	}

	getIds() {
		return this.urls.map(url => REGEX.exec(url)[1]);
	}

	isValidURL(url) {
		const regMatch = REGEX.exec(url);
		return !!regMatch;
	}

	run() {
		this.getIds().forEach(id => this.yd.download(id));
	}
}

module.exports = Downloader;
