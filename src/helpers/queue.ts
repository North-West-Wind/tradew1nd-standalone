import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { SoundTrack } from "../classes/music";
import { getQueuePath, getQueues } from "../state";

export function fixTrack(track: SoundTrack) {
	var changed = false;
	if (!track.id) {
		track.id = crypto.createHash("md5").update(`${track.title};${track.url}`).digest("hex");
		changed = true;
	}
	if (track.start && track.start > track.end) {
		track.start = 0;
		track.end = track.time;
		changed = true;
	}
	if (track.end > track.time * 1000) {
		track.end = track.time;
		changed = true;
	}
	return changed;
}

export function saveRuntimeToQueue(queue: string) {
	const tracks = getQueues().get(queue);
	if (!tracks) return;
	fs.writeFileSync(path.resolve(getQueuePath(), `${queue}.json`), JSON.stringify(tracks.map(t => ({
		id: t.id,
		title: t.title,
		url: t.url,
		type: t.type,
		time: t.time,
		volume: t.volume,
		thumbnail: t.thumbnail,
		start: t.start,
		end: t.end,
		disabled: t.disabled
	})), null, 2));
}