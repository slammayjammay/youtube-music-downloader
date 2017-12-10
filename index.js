const { resolve } = require('path');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');

const YD = new YoutubeMp3Downloader({
	ffmpegPath: '/usr/local/bin/ffmpeg',
	outputPath: resolve(`${__dirname}/attempts`),
	youtubeVideoQuality: 'highest',
	queueParallelism: 2,
	progressTimeout: 1000
});

const videos = [
	'https://www.youtube.com/watch?v=xiK2JlBpzvI&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi',
	'https://www.youtube.com/watch?v=eYejkNuTBeA&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi&index=2',
	'https://www.youtube.com/watch?v=BAVUPu7URbc&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi&index=3',
	'https://www.youtube.com/watch?v=sE7xyn28wjg&index=4&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi',
	'https://www.youtube.com/watch?v=l8kVjcnWocM&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi&index=5',
	'https://www.youtube.com/watch?v=6lcZ0redg1s&index=6&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi',
	'https://www.youtube.com/watch?v=S71_vIMQ0YY&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi&index=7',
	'https://www.youtube.com/watch?v=li-adM-qOwI&index=8&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi',
	'https://www.youtube.com/watch?v=1RbzzzyzPWA&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi&index=9',
	'https://www.youtube.com/watch?v=5HnF5T4Neuc&index=10&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi',
	'https://www.youtube.com/watch?v=LA9yYxnD_pM&index=11&list=PLiN-7mukU_RGHhJocYxBBNSpCnJgsHlxi'
];

const reg = /\?v=([^&]*)/;
const ids = videos.map(url => reg.exec(url)[1]);

console.log('Here we go!');

ids.forEach(id => YD.download(id));

YD.on('error', err => {
	console.log(err);
});

YD.on('progress', progress => {
	process.stdout.write('steady...steady now...');
});

YD.on('finished', (err, data) => {
	console.log(JSON.stringify(data));
	console.log();
	console.log('Finished.');
});
