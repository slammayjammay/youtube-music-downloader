const EventEmitter = require('events');
const chalk = require('chalk');
const {
	cursorLeft, cursorForward, cursorUp, cursorDown, eraseEndLine
} = require('ansi-escapes');

const DEFAULT_OPTIONS = {
	width: 50,
	numBars: 1
};

class ProgressBar extends EventEmitter {
	constructor(options = {}) {
		super();

		this.options = Object.assign({}, DEFAULT_OPTIONS, options);
		this._barLeftOffset = 5;

		this['['] = chalk.bold.yellow('[');
		this['='] = chalk.bold.yellow('=');
		this[']'] = chalk.bold.yellow(']');

		this._videoCounter = 0;
		this._videoIds = {};
	}

	_storeVideoId(id) {
		this._videoIds[id] = { idx: this._videoCounter };
		this._videoCounter += 1;
	}

	videos() {
		return Object.keys(this._videoIds).map(key => this._videoIds[key]);
	}

	/**
	 * @param {array} ids - Array of video ids.
	 */
	init(ids) {
		ids.forEach(id => {
			if (!this._videoIds[id]) {
				this._storeVideoId(id);
			}
		});

		// "allocate" the space necessary for the bars
		ids.forEach(id => console.log());

		// jump to the correct line for this progress bar
		process.stdout.write(cursorUp(this.options.numBars));

		this.videos().forEach(id => {
			this.drawInitialBar();
			process.stdout.write(cursorDown(1));
		});
		process.stdout.write(cursorLeft);
	}

	/**
	 * @param {string} videoId - The line that contains the progress bar of the id.
	 * @param {function} callback - The callback to execute on the desired line.
	 */
	jumpToLineOfVideoId(videoId, callback) {
		// jump to the correct line for this progress bar
		const distanceToLine = this.options.numBars - this._videoIds[videoId].idx;
		process.stdout.write(cursorUp(distanceToLine));

		callback();

		// jump back down below all progress bars
		process.stdout.write(cursorDown(distanceToLine));
		process.stdout.write(cursorLeft);
	}

	drawInitialBar() {
		process.stdout.write(cursorLeft);
		process.stdout.write(eraseEndLine);

		// make room for the percent at the beginning of line
		process.stdout.write(chalk.bold.yellow('0%'));
		process.stdout.write(cursorLeft);
		process.stdout.write(cursorForward(this._barLeftOffset));

		let progressBar = this['['];
		for (let i = 0; i < this.options.width; i++) {
			progressBar += ' ';
		}
		progressBar += this[']'];

		process.stdout.write(progressBar);
	}

	/**
	 * @param {number} percent - A value between 0 and 1.
	 */
	drawProgress(percent) {
		// write the percent
		process.stdout.write(cursorLeft);
		process.stdout.write(chalk.bold.yellow(`${Math.floor(percent * 100)}%`));

		// important to move back to the starting point -- the progress percentage
		// has variable width
		process.stdout.write(cursorLeft);
		process.stdout.write(cursorForward(this._barLeftOffset + 1));

		// write correct number of progress characters
		const endSpace = Math.floor(this.options.width * percent);
		let progressBar = '';
		for (let i = 0; i < endSpace; i++) {
			progressBar += this['='];
		}
		process.stdout.write(progressBar);
	}

	/**
	 * @param {string} videoId - The id of the video being downloaded.
	 * @param {number} percent - A value between 0 and 1.
	 */
	update(videoId, percent) {
		this.jumpToLineOfVideoId(videoId, () => {
			this.drawProgress(percent);
		});
	}

	finish(videoId) {
		this.jumpToLineOfVideoId(videoId, () => {
			this.drawProgress(1);
			process.stdout.write(cursorForward(1));
			process.stdout.write(` ${chalk.green.bold('✓')}`);
		});
	}

	error(videoId) {
		this.jumpToLineOfVideoId(videoId, () => {
			const toEndOfLine = this._barLeftOffset + this.options.width + 3;
			process.stdout.write(cursorForward(toEndOfLine));
			process.stdout.write(chalk.red.bold('✗'));
		});
	}
}

module.exports = ProgressBar;
