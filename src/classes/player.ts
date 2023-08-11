import { IAudioMetadata, parseFile, parseStream } from "music-metadata";
import { VolumeTransformer, opus } from "prism-media";
import Speaker from "speaker";
import { getDownloadPath } from "../state";
import Stream from "stream";
import * as fs from "fs";
import * as path from "path";
import EventEmitter from "events";
import { clamp, sleep } from "../helpers/misc";

type PlayerEvents = "play" | "finish";
type PlaybackEvents = "pause" | "paused" | "resume" | "resumed";

export declare interface TradeW1ndPlayer {
	on(event: PlayerEvents, listener: (id: string) => void): this;
	once(event: PlayerEvents, listener: (id: string) => void): this;
	on(event: PlaybackEvents, listener: () => void): this;
	once(event: PlaybackEvents, listener: () => void): this;
	on(event: string, listener: Function): this;
	once(event: string, listener: Function): this;
}

export class TradeW1ndPlayer extends EventEmitter {
	// Internal
	private stream?: Stream.Readable;
	private speaker?: Speaker;
	private volumeTransformer = new VolumeTransformer({ type: "s16le", volume: 1 });

	// Should change with setter
	playing = false;
	paused = false;
	togglingPause = false;
	volume = 0.5;

	// Can change without setter
	autoplay = true;
	random = false;
	loop = false;
	repeat = false;

	async playId(id: string) {
		const file = path.resolve(getDownloadPath(), id);
		if (!fs.existsSync(file)) throw new Error("Cannot find " + file);

		if (this.playing) await this.finish(id);

		const metadata = await parseFile(file);
		this.volumeTransformer.setVolumeLogarithmic(this.volume);
		this.stream = (await this.decodeStream(fs.createReadStream(file), metadata)).pipe(this.volumeTransformer);
    this.speaker = new Speaker({ sampleRate: metadata.format.sampleRate, channels: metadata.format.numberOfChannels });

		this.playing = true;
		this.emit("play", id);

		return await new Promise<void>((res, rej) => {
			this.stream.pipe(this.speaker)
				.on("finish", async () => {
					await this.finish(id);
					res();
				})
				.on("error", () => res()); // Ignore error. It's mostly fine.
		})
	}

	async decodeStream(stream: Stream.Readable, metadata: IAudioMetadata) {
		switch (metadata.format.container) {
			case "EBML/webm":
				return stream.pipe(new opus.WebmDemuxer()).pipe(new opus.Decoder({ rate: metadata.format.sampleRate, channels: metadata.format.numberOfChannels, frameSize: 1024 }));
			default:
				console.log(metadata.format.container);
				return stream;
		}
	}

	async finish(id?: string) {
		this.stream?.unpipe();
		if (this.speaker) {
			await new Promise<void>(res => {
				this.speaker.on("close", res);
				this.speaker.close(true);
			});
		}
		this.emit("finish", id);
	}

	async pause() {
		if (!this.playing || this.paused || this.togglingPause) return;
		this.togglingPause = true;
		this.emit("pause");
		while (this.volumeTransformer.volumeLogarithmic > 0) {
			this.volumeTransformer.setVolumeLogarithmic(clamp(this.volumeTransformer.volumeLogarithmic - 0.01, 0, Infinity));
			await sleep(1);
		}
		this.stream.unpipe();
		this.paused = true;
		this.togglingPause = false;
		this.emit("paused");
	}

	async resume() {
		if (!this.playing || !this.paused || this.togglingPause) return;
		this.togglingPause = true;
		this.emit("resume");
		while (this.volumeTransformer.volumeLogarithmic < this.volume) {
			this.volumeTransformer.setVolumeLogarithmic(clamp(this.volumeTransformer.volumeLogarithmic + 0.01, 0, this.volume));
			await sleep(1);
		}
		this.stream.pipe(this.speaker);
		this.paused = false;
		this.togglingPause = false;
		this.emit("resumed");
	}
}