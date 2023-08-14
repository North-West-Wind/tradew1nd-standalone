import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import Stream from "stream";
import { RuntimeSoundTrack, SoundTrack } from "../classes/music";
import { getDownloadPath, getPlaying, getQueues } from "../state";
import ytdl from "ytdl-core";
import fetch from "node-fetch";
import { ActualError, StatusError } from "../classes/error";
import { SCDL } from "@vncsprd/soundcloud-downloader";
import { Readable } from "stream";
import { getMP3 } from "./musescore";
import { fixTrack } from "./queue";
import ytpl from "ytpl";
import { decodeHtmlEntity, humanDurationToNum } from "./misc";
import { validGDDLURL, validGDFolderURL, validGDURL, validMSSetURL, validMSURL, validSCURL, validURL, validYTPlaylistURL, validYTURL } from "./validator";
import { parseFile, parseStream } from "music-metadata";
import { museSet, muse } from "musescore-metadata";
const scdl = new SCDL();

export async function downloadTrack(track: SoundTrack) {
	fixTrack(track);
	const writeStream = fs.createWriteStream(path.resolve(getDownloadPath(), track.id));
	switch (track.type) {
		// YouTube
		case 0:
		case 1:
			await new Promise((res, rej) => ytdl(track.url, { filter: "audioonly" }).on("error", rej).pipe(writeStream).on("close", res).on("error", rej));
			break;
		// URL / Google Drive
		case 2:
		case 4:
			const response = await fetch(track.url);
			if (!response.ok) throw new StatusError(response.status);
			await new Promise((res, rej) => response.body.pipe(writeStream).on("close", res).on("error", rej));
			break;
		// SoundCloud
		case 3:
			await new Promise(async (res, rej) => (<Readable>await scdl.download(track.url)).pipe(writeStream).on("close", res).on("error", rej));
			break;
		// Musescore
		case 5:
			const c = await getMP3(track.url);
			if (c.error) throw new Error(c.message);
			if (c.url.startsWith("https://www.youtube.com/embed/")) {
				const ytid = c.url.split("/").slice(-1)[0].split("?")[0];
				await new Promise((res, rej) => ytdl(`https://www.youtube.com/watch?v=${ytid}`, { filter: "audioonly" }).pipe(writeStream).on("close", res).on("error", rej));
			} else {
				const response = await fetch(c.url);
				if (!response.ok) throw new StatusError(response.status);
				await new Promise((res, rej) => response.body.pipe(writeStream).on("close", res).on("error", rej));
			}
			break;
	}
}

export async function addTrack(queue: string, url: string) {
	var urls: string[];
	try {
		// Check if it's JSON
		const data = JSON.parse(url);
		if (!Array.isArray(data)) throw new ActualError("Not an array");
		if (!data.length) throw new ActualError("Empty array");
		urls = data;
	} catch (err) {
		if (err instanceof ActualError) throw err;
		urls = [url];
	}
	if (urls.length == 1) return await addSingleTrack(queue, urls[0]);
	var counter = 0;
	for (const path of urls)
		if (!!(await addSingleTrack(queue, path)))
			counter++;
	return counter;

}

async function addSingleTrack(queue: string, url: string): Promise<SoundTrack | undefined> {
	if (/^https?:\/\//.test(url)) return <SoundTrack>await addURLTrack(queue, url);
	const result = await addFile(url);
	if (!result) throw new Error("Something went wrong while adding track " + url);
	fixTrack(result[0]);
	fs.cpSync(url, path.resolve(getDownloadPath(), result[0].id));
	const rtTrack = <RuntimeSoundTrack> result[0];
	rtTrack.downloaded = true;
	getQueues().get(queue)?.push(rtTrack);
	return rtTrack;
}

async function addURLTrack(queue: string, url: string): Promise<SoundTrack | number> {
	var result: SoundTrack[] | undefined;
	if (validYTPlaylistURL(url)) result = await addYTPlaylist(url);
	else if (validYTURL(url)) result = await addYTURL(url);
	else if (validSCURL(url)) result = await addSCURL(url);
	else if (validMSSetURL(url)) result = await addMSSetURL(url);
	else if (validMSURL(url)) result = await addMSURL(url);
	else if (validURL(url)) result = await addURL(url);
	if (!result) return 0;
	const downloaded = fs.readdirSync(getDownloadPath());
	for (const track of result) {
		fixTrack(track);
		const rtTrack = <RuntimeSoundTrack> track;
		if (downloaded.find(d => d === track.id)) rtTrack.downloaded = true;
		getQueues().get(queue)?.push(rtTrack);
	}
	if (result.length > 1) return result.length;
	else return result[0];
}

async function addYTPlaylist(link: string) {
	try {
		var playlistInfo = await ytpl(link, { limit: Infinity });
	} catch (err) {
		console.error(err);
		return undefined;
	}
	const videos = playlistInfo.items.filter(x => x && !x.isLive);
	const songs: SoundTrack[] = [];
	for (const video of videos) songs.push({
		title: video.title,
		url: video.shortUrl,
		type: 0,
		time: video.durationSec,
		thumbnail: video.bestThumbnail.url,
		volume: 1
	});
	return songs;
}
async function addYTURL(link: string, type = 0) {
	try {
		var songInfo = await ytdl.getInfo(link);
	} catch (err) {
		console.error(err);
		return undefined;
	}
	const length = parseInt(songInfo.videoDetails.lengthSeconds);
	const thumbnails = songInfo.videoDetails.thumbnails;
	let thumbUrl = thumbnails[thumbnails.length - 1].url;
	let maxWidth = 0;
	for (const thumbnail of thumbnails) {
		if (thumbnail.width > maxWidth) {
			maxWidth = thumbnail.width;
			thumbUrl = thumbnail.url;
		}
	}
	const song: SoundTrack = {
		title: decodeHtmlEntity(songInfo.videoDetails.title),
		url: songInfo.videoDetails.video_url,
		type: type,
		time: length,
		thumbnail: thumbUrl,
		volume: 1
	};
	return [song];
}
async function addSCURL(link: string) {
	const res = await fetch(`https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(link)}&client_id=${await scdl.getClientID()}`);
	if (!res.ok) return undefined;
	const data = <any>await res.json();
	if (data.kind == "user") return undefined;
	const songs: SoundTrack[] = [];
	if (data.kind == "playlist") {
		for (const track of data.tracks) {
			songs.push({
				title: track.title,
				type: 3,
				id: track.id,
				time: track.duration / 1000,
				thumbnail: track.artwork_url,
				url: track.permalink_url,
				volume: 1
			});
		}
	} else {
		songs.push({
			title: data.title,
			type: 3,
			id: data.id,
			time: data.duration / 1000,
			thumbnail: data.artwork_url,
			url: data.permalink_url,
			volume: 1
		});
	}
	return songs;
}
async function addMSSetURL(link: string) {
	try {
		var data = await museSet(link, { all: true });
	} catch (err: any) {
		return undefined;
	}
	return <SoundTrack[]> data.scores.map(score => ({ title: score.title, url: score.url, type: 5, time: humanDurationToNum(score.duration), volume: 1, thumbnail: "http://s.musescore.org/about/images/musescore-mu-logo-bluebg-xl.png" }));
}
async function addMSURL(link: string) {
	try {
		var data = await muse(link);
	} catch (err: any) {
		return undefined;
	}
	const song: SoundTrack = {
		title: data.title,
		url: data.url,
		type: 5,
		time: humanDurationToNum(data.duration),
		volume: 1,
		thumbnail: "http://s.musescore.org/about/images/musescore-mu-logo-bluebg-xl.png"
	};
	return [song];
}
async function addURL(link: string) {
	let title = link.split("/").slice(-1)[0].split(".").slice(0, -1).join(".").replace(/_/g, " ");
	try {
		var stream = <Stream.Readable>await fetch(link).then(res => res.body);
		var metadata = await parseStream(stream, {}, { duration: true });
		if (metadata.format.trackInfo && metadata.format.trackInfo[0]?.name) title = metadata.format.trackInfo[0].name;
	} catch (err: any) {
		return undefined;
	}
	if (!metadata || !stream) return undefined;
	const song: SoundTrack = {
		title: title,
		url: link,
		type: 2,
		time: metadata.format.duration,
		volume: 1,
		thumbnail: "https://www.dropbox.com/s/ms27gzjcz4c3h3z/audio-x-generic.svg?dl=1"
	};
	return [song];
}
async function addFile(url: string) {
	if (!fs.existsSync(url)) return undefined;
	let title = path.basename(url);
	try {
		var stream = fs.createReadStream(url);
		var metadata = await parseFile(url, { duration: true });
		if (metadata.format.trackInfo && metadata.format.trackInfo[0]?.name) title = metadata.format.trackInfo[0].name;
	} catch (err: any) {
		return undefined;
	}
	if (!metadata || !stream) return undefined;
	const song: SoundTrack = {
		title: title,
		url: url,
		type: 6,
		time: metadata.format.duration,
		volume: 1,
		thumbnail: "https://www.dropbox.com/s/ms27gzjcz4c3h3z/audio-x-generic.svg?dl=1"
	};
	return [song];
}