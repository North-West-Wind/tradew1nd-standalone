import { IAudioMetadata, parseFile } from "music-metadata";
import { FFmpeg, VolumeTransformer } from "prism-media";
import Speaker from "speaker";
import { getDownloadPath } from "../state";
import Stream from "stream";
import * as fs from "fs";
import * as path from "path";
import EventEmitter from "events";
import { clamp } from "../helpers/misc";
import moment from "moment";
import "moment-duration-format";
import { RuntimeSoundTrack } from "./music";
import Throttle from "throttle";

type PlayerEvents = "play" | "finish";
type PlaybackEvents = "pause" | "paused" | "resume" | "resumed";

export declare interface TradeW1ndPlayer {
	on(event: PlayerEvents, listener: (id: string) => void): this;
	on(event: PlaybackEvents, listener: () => void): this;
	on(event: "volume", listener: (volume: number) => void): this;
	on(event: "playback", listener: (time: number) => void): this;
	on(event: "error", listener: (error: Error) => void): this;
	on(event: string, listener: () => void): this;
	once(event: PlayerEvents, listener: (id: string) => void): this;
	once(event: PlaybackEvents, listener: () => void): this;
	once(event: "volume", listener: (volume: number) => void): this;
	once(event: "playback", listener: (time: number) => void): this;
	once(event: "error", listener: (error: Error) => void): this;
	once(event: string, listener: () => void): this;
}

export class TradeW1ndPlayer extends EventEmitter {
	static readonly BITRATE = 192000;

	// Internal
	private stream?: VolumeTransformer;
	private speaker?: Speaker;
	private throttle?: Throttle;
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

	constructor() {
		super();
		this.on("error", () => this.emit("finish"));
	}

	async playId(track: RuntimeSoundTrack, seek = 0) {
		const file = path.resolve(getDownloadPath(), track.id);
		if (!fs.existsSync(file)) return this.emit("error", new Error("Cannot find " + file));

		console.log("Playing from", file);

		this.metadata = await parseFile(file);
		if (this.metadata.format.duration && this.metadata.format.duration != track.time) track.time = this.metadata.format.duration;
		if ((seek / 1000) > this.metadata.format.duration) seek = 0;
		if (seek > track.time * 1000) return;
		if (!seek) seek = track.start || 0;
		this.localVolume = track.volume;
		this.stream = this.decodeStream(fs.createReadStream(file), seek, track.end || 0).on("error", err => console.error("Transcoder error", err)).pipe(new VolumeTransformer({ type: "s16le", volume: 1 }));
		this.stream.setVolumeLogarithmic(this.volume * this.localVolume);
		this.throttle = new Throttle({ bps: TradeW1ndPlayer.BITRATE });
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
			.on("error", err => console.error("Speaker error", err));
		this.throttle
			.on("pipe", () => this.updatePlayback = true)
			.on("unpipe", () => this.updatePlayback = false)
			.on("error", err => console.error("Throttle error", err))
			.pipe(this.speaker);
		this.stream
			.on("error", err => console.error("Volume error", err))
			.pipe(this.throttle);
	}

	decodeStream(stream: Stream.Readable, start: number, end: number) {
		const args = [
			'-analyzeduration', '0',
			'-loglevel', '0',
			'-f', 's16le',
			'-ar', `${this.metadata.format?.sampleRate || 44100}`,
			'-ac', `${this.metadata.format?.numberOfChannels || 2}`,
			'-b:a', TradeW1ndPlayer.BITRATE * 0.001 + 'k'
		];
		if (start > 0) args.push('-ss', moment.duration(start, "ms").format("HH:mm:ss.SSS"));
		if (end > 0) args.push("-t", moment.duration(end - start, "ms").format("HH:mm:ss.SSS"));
		const transcoder = new FFmpeg({ args });
		return stream.on("error", err => console.error("Readable error", err)).pipe(transcoder);
	}

	async finish(id?: string) {
		this.stream?.unpipe();
		if (this.speaker) 
			await new Promise<void>(res => {
				this.speaker.on("close", res);
				this.speaker.close(true);
			});
		this.throttle?.end();
		this.stream?.end();
		this.stream = undefined;
		this.throttle = undefined;
		this.speaker = undefined;
		clearInterval(this.interval);
		this.interval = undefined;
		this.playbackTime = this.startTime = this.pausedTime = this.startPausedTime = 0;
		this.paused = false;
		this.togglingPause = false;
		if (this.playing) {
			this.playing = false;
			this.emit("finish", id);
		}
	}

	pause() {
		if (!this.playing || this.paused || this.togglingPause) return;
		//this.togglingPause = true;
		this.emit("pause");
		/*while (this.stream.volumeLogarithmic > 0) {
			this.stream.setVolumeLogarithmic(clamp(this.stream.volumeLogarithmic - 0.02, 0, Infinity));
			await sleep(10);
		}*/
		this.stream.unpipe();
		this.startPausedTime = Date.now();
		this.paused = true;
		//this.togglingPause = false;
		//this.emit("paused");
	}

	resume() {
		if (!this.playing || !this.paused || this.togglingPause) return;
		//this.togglingPause = true;
		this.emit("resume");
		this.pausedTime += Date.now() - this.startPausedTime;
		this.stream.pipe(this.throttle);
		/*while (this.stream.volumeLogarithmic < this.volume * this.localVolume) {
			this.stream.setVolumeLogarithmic(clamp(this.stream.volumeLogarithmic + 0.02, 0, this.volume * this.localVolume));
			await sleep(10);
		}*/
		this.paused = false;
		//this.togglingPause = false;
		//this.emit("resumed");
	}

	setVolume(volume: number, localVolume = 100) {
		this.volume = clamp(volume / 100, 0, 2);
		this.localVolume = clamp(localVolume / 100, 0, 4);
		this.stream?.setVolumeLogarithmic(this.volume * this.localVolume);
		this.emit("volume", this.volume);
	}
}