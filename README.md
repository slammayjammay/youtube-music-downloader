# `youtube-music-downloader`
> Given a YouTube URL, downloads and coverts to an mp3 file.

This is mostly a fun wrapper for `youtube-mp3-downloader`, which takes care of the actual logic needed to download and convert YouTube videos. It can read URLs given via `stdin` or a text file. Then it will download a `.mp3` file in the `$HOME/Downloads` folder.

```sh
$ npm install -g https://github.com/slammayjammay/youtube-music-downloader
```

## Requirements
- macOS
- node 8!
- npm

Installing this will create an executable file accessible by running `$ youtube-music-downloader`. It's interactive and doesn't take any options.

Here is the full prompt:
```
Hello and welcome to YouTube Music Downloader!

Youtube Music Downloader can download YouTube videos as .mp3
files! You can provide the Youtube URL(s) here on the command
line or enter them in a text file that Youtube Music Downloader
will read.

----------------------------------------------------------------
NOTE: a maximum of 3 downloads can be performed at any given time.
----------------------------------------------------------------

Press 1 (one) to enter the YouTube URLs to download, or
Press 2 (two) to enter a YouTube playlist URL to download all videos on the playlist, or
Press 3 (three) to enter the path of a text file containing YouTube URLs.

>
```
