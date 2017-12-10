const EventEmitter = require('events');
const chalk = require('chalk');
const {
	cursorLeft, cursorForward, cursorUp, cursorDown, eraseEndLine
} = require('ansi-escapes');

const DEFAULT_OPTIONS = {
	width: 50
};

class ProgressBar extends EventEmitter {
	constructor(options = {}) {
		super();

		this.options = Object.assign({}, DEFAULT_OPTIONS, options);
		this._barLeftOffset = 5;

		this['['] = chalk.bold.yellow('[');
		this['='] = chalk.bold.yellow('=');
		this[']'] = chalk.bold.yellow(']');
	}

	init() {
		console.log();
		process.stdout.write(cursorUp(1));
		this.draw();
		this.update(0);
	}

	draw() {
		process.stdout.write(cursorLeft);
		process.stdout.write(eraseEndLine);

		// make room for the percent at the beginning of line
		process.stdout.write(cursorForward(this._barLeftOffset));

		let progressBar = this['['];
		for (let i = 0; i < this.options.width; i++) {
			progressBar += ' ';
		}
		progressBar += this[']'];

		process.stdout.write(progressBar);
		process.stdout.write(cursorDown(1));
		process.stdout.write(cursorLeft);
	}

	update(percent) {
		process.stdout.write(cursorUp(1));
		process.stdout.write(cursorLeft);
		process.stdout.write(chalk.bold.yellow(`${Math.floor(percent * 100)}%`));

		// important to move back to the starting point -- the progress percentage
		// has variable width
		process.stdout.write(cursorLeft);
		process.stdout.write(cursorForward(this._barLeftOffset + 1));

		const endSpace = Math.floor(this.options.width * percent);
		let progressBar = '';

		for (let i = 0; i < endSpace; i++) {
			progressBar += this['='];
		}

		if (endSpace > this.options.width) {
			console.log('uh oh');
		}

		process.stdout.write(progressBar);
		process.stdout.write(cursorDown(1));
		process.stdout.write(cursorLeft);
	}
}

module.exports = ProgressBar;
