import { IAudioMetadata, parseFile } from "music-metadata";
import { FFmpeg, VolumeTransformer } from "prism-media";
import Speaker from "speaker";
import { getDownloadPath } from "../state";
import Stream from "stream";
import * as fs from "fs";
import * as path from "path";
import EventEmitter from "events";
import { clamp, sleep } from "../helpers/misc";
import moment from "moment";
import "moment-duration-format";
import { RuntimeSoundTrack } from "./music";

type PlayerEvents = "play" | "finish";
type PlaybackEvents = "pause" | "paused" | "resume" | "resumed";

export declare interface TradeW1ndPlayer {
	on(event: PlayerEvents, listener: (id: string) => void): this;
	once(event: PlayerEvents, listener: (id: string) => void): this;
	on(event: PlaybackEvents, listener: () => void): this;
	once(event: PlaybackEvents, listener: () => void): this;
	on(event: "volume", listener: (volume: number) => void): this;
	once(event: "volume", listener: (volume: number) => void): this;
	on(event: "playback", listener: (time: number) => void): this;
	once(event: "playback", listener: (time: number) => void): this;
	on(event: string, listener: Function): this;
	once(event: string, listener: Function): this;
}

export class TradeW1ndPlayer extends EventEmitter {
	// Internal
	private stream?: Stream.Readable;
	private speaker?: Speaker;
	private volumeTransformer?: VolumeTransformer;
	private playbackTime = 0;
	private pausedTime = 0;
	private startTime = 0;
	private startPausedTime = 0;
	private metadata: IAudioMetadata;
	private updatePlayback = false;
	private interval: NodeJS.Timer;

	// Should change with setter
	playing = false;
	paused = false;
	togglingPause = false;
	volume = 1;
	localVolume = 1;

	// Can change without setter
	autoplay = true;
	random = false;
	loop = false;
	repeat = false;

	async playId(track: RuntimeSoundTrack, seek = 0) {
		const file = path.resolve(getDownloadPath(), track.id);
		if (!fs.existsSync(file)) throw new Error("Cannot find " + file);

		if (this.playing) await this.finish(track.id);

		this.metadata = await parseFile(file);
		if (this.metadata.format.duration && this.metadata.format.duration != track.time) track.time = this.metadata.format.duration;
		console.log("seek", seek);
		if ((seek / 1000) > this.metadata.format.duration) seek = 0;
		if (seek > track.time * 1000) return;
		if (!seek) seek = track.start || 0;
		this.localVolume = track.volume;
		this.volumeTransformer = new VolumeTransformer({ type: "s16le", volume: this.volume * this.localVolume });
		this.stream = this.decodeStream(fs.createReadStream(file, { highWaterMark: 1024 }), seek, track.end || 0).on("error", console.error).pipe(this.volumeTransformer);
    this.speaker = new Speaker({ sampleRate: this.metadata.format?.sampleRate || 44100, channels: this.metadata.format?.numberOfChannels || 2 });

		this.playing = true;
		this.emit("play", track.id);
		this.emit("resume");

		this.startTime = Date.now() - seek;
		this.interval = setInterval(() => {
			if (this.updatePlayback) {
				this.playbackTime = Date.now() - this.startTime - this.pausedTime;
				this.emit("playback", this.playbackTime);
			}
		}, 1);
		this.speaker
			.once("finish", () => this.finish(track.id))
			.on("error", console.error)
			.on("pipe", () => this.updatePlayback = true)
			.on("unpipe", () => this.updatePlayback = false);
		this.stream
			.on("error", console.error)
			.pipe(this.speaker);
	}

	decodeStream(stream: Stream.Readable, start: number, end: number) {
		const args = [
			'-analyzeduration', '0',
			'-loglevel', '0',
			'-f', 's16le',
			'-ar', `${this.metadata.format?.sampleRate || 44100}`,
			'-ac', `${this.metadata.format?.numberOfChannels || 2}`,
		];
		if (start > 0) args.push('-ss', moment.duration(start, "ms").format("HH:mm:ss.SSS"));
		if (end > 0) args.push("-t", moment.duration(end - start, "ms").format("HH:mm:ss.SSS"));
		const transcoder = new FFmpeg({ args });
		return stream.pipe(transcoder);
	}

	async finish(id?: string) {
		this.stream?.unpipe();
		if (this.speaker) 
			await new Promise<void>(res => {
				this.speaker.on("close", res);
				this.speaker.close(true);
			});
		this.stream?.destroy();
		this.volumeTransformer?.destroy();
		this.speaker = undefined;
		this.stream = undefined;
		this.volumeTransformer = undefined;
		clearInterval(this.interval);
		this.interval = undefined;
		this.playbackTime = this.startTime = this.pausedTime = this.startPausedTime = 0;
		this.playing = false;
		this.paused = false;
		this.togglingPause = false;
		this.emit("finish", id);
	}

	async pause() {
		if (!this.playing || this.paused || this.togglingPause) return;
		this.togglingPause = true;
		this.emit("pause");
		while (this.volumeTransformer.volumeLogarithmic > 0) {
			this.volumeTransformer.setVolumeLogarithmic(clamp(this.volumeTransformer.volumeLogarithmic - 0.02, 0, Infinity));
			await sleep(10);
			console.log(this.volumeTransformer.volumeLogarithmic);
		}
		this.stream.unpipe();
		this.startPausedTime = Date.now();
		this.paused = true;
		this.togglingPause = false;
		this.emit("paused");
	}

	async resume() {
		if (!this.playing || !this.paused || this.togglingPause) return;
		this.togglingPause = true;
		this.emit("resume");
		this.pausedTime += Date.now() - this.startPausedTime;
		this.stream.pipe(this.speaker);
		while (this.volumeTransformer.volumeLogarithmic < this.volume * this.localVolume) {
			this.volumeTransformer.setVolumeLogarithmic(clamp(this.volumeTransformer.volumeLogarithmic + 0.02, 0, this.volume * this.localVolume));
			await sleep(10);
			console.log(this.volumeTransformer.volumeLogarithmic);
		}
		this.paused = false;
		this.togglingPause = false;
		this.emit("resumed");
	}

	setVolume(volume: number, localVolume = 100) {
		this.volume = clamp(volume / 100, 0, 2);
		this.localVolume = clamp(localVolume / 100, 0, 2);
		this.volumeTransformer?.setVolumeLogarithmic(this.volume * this.localVolume);
		this.emit("volume", this.volume);
	}
}