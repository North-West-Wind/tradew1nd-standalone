import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { SoundTrack } from "../classes/music";
import { getDownloadPath } from "../state";
import ytdl from "ytdl-core";
import fetch from "node-fetch";
import { StatusError } from "../classes/error";
import { SCDL } from "@vncsprd/soundcloud-downloader";
import { Readable } from "stream";
import { getMP3 } from "./musescore";
const scdl = new SCDL();

export function fixTrackId(track: SoundTrack) {
	if (!track.id)
		return track.id = crypto.createHash("md5").update(`${track.title};${track.url}`).digest("hex");
	return undefined;
}

export async function downloadTrack(track: SoundTrack) {
	fixTrackId(track);
	const writeStream = fs.createWriteStream(path.resolve(getDownloadPath(), track.id));
	switch (track.type) {
		// YouTube
		case 0:
		case 1:
			await new Promise((res, rej) => ytdl(track.url, { filter: "audioonly" }).pipe(writeStream).on("close", res).on("error", rej));
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