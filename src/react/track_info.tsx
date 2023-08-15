import React from "react";
import TradeW1ndPlaceholderComponent from "./tradew1nd_placeholder";
import { WindowExtra } from "../classes/window";
import { getPlaying, getQueues, getViewingTrack } from "../state";
import { RuntimeSoundTrack } from "../classes/music";
import Slider from "rc-slider";
import "../../public/styles/slider.less";
import moment from "moment";
import "moment-duration-format";

export default class TrackInfoComponent extends React.Component {
	state: { track: RuntimeSoundTrack, paused: boolean, volume: number, addedInfo: RuntimeSoundTrack | number, timeout: NodeJS.Timeout, anotherTrack: { queue: string, track: RuntimeSoundTrack } };

	constructor(props: object) {
		super(props);

		this.state = { track: null, paused: false, volume: 1, addedInfo: undefined, timeout: undefined, anotherTrack: undefined };
		(window as WindowExtra).electronAPI.onUpdateQueues((queues) => {
			const playing = getPlaying();
			if (playing) {
				this.setState({ track: queues.get(playing.queue).find(t => t.id === playing.id) });
			} else this.setState({ track: null });
		});
		(window as WindowExtra).electronAPI.onUpdateStates((states) => {
			if (states.playing === undefined) return;
			const playing = states.playing;
			if (playing) {
				this.setState({ track: getQueues().get(playing.queue).find(t => t.id === playing.id) });
			} else this.setState({ track: null });
		});
		(window as WindowExtra).electronAPI.onUpdatePaused(paused => {
			this.setState({ paused });
		});
		(window as WindowExtra).electronAPI.onUpdateVolume(volume => {
			this.setState({ volume });
		});
		(window as WindowExtra).electronAPI.onUpdateAddedTrack(result => {
			if (this.state.timeout) clearTimeout(this.state.timeout);
			this.setState({ addedInfo: result, timeout: setTimeout(() => this.setState({ addedInfo: undefined, timeout: undefined }), 5000) });
		});
		window.addEventListener("update-viewing-track", () => {
			this.setState({ anotherTrack: getViewingTrack() });
		});
	}

	togglePause() {
		(window as WindowExtra).electronAPI.setPaused(!this.state.paused);
	}

	setVolume(volume: number) {
		(window as WindowExtra).electronAPI.setVolume(volume);
	}

	setLocalVolume(volume: number) {
		(window as WindowExtra).electronAPI.setLocalVolume(volume);
	}

	setStartEnd(start: number, end: number) {
		const track = this.state.track;
		track.start = start;
		track.end = end;
		this.setState({ track });
	}

	actualSetStartEnd(start: number, end: number) {
		(window as WindowExtra).electronAPI.setStartEnd(start, end, this.state.anotherTrack ? { queue: this.state.anotherTrack.queue, id: this.state.anotherTrack.track.id } : undefined);
	}

	render() {
		if (this.state.addedInfo) return <div className="flex-child flex center blurry">
			<div className="flex-child center">
				<h2>Added</h2>
				{
					typeof this.state.addedInfo === "number" ?
					<h3>{this.state.addedInfo} tracks</h3> :
					<>
						<img src={this.state.addedInfo.thumbnail} className="thumbnail" onError={(e) => e.currentTarget.parentNode.removeChild(e.currentTarget)} /><br />
						<h2>{this.state.addedInfo.title}</h2>
						<h3><a href={this.state.addedInfo.url}>{this.state.addedInfo.url}</a></h3>
					</>
				}
			</div>
		</div>
		else if (this.state.anotherTrack) return <div className="flex-child flex center blurry">
			<div className="flex-child center">
				<h1>Previewing Settings</h1>
				<img src={this.state.anotherTrack.track.thumbnail} className="thumbnail" onError={(e) => e.currentTarget.parentNode.removeChild(e.currentTarget)} /><br />
				<h2>{this.state.anotherTrack.track.title}</h2>
				<h3><a href={this.state.anotherTrack.track.url}>{this.state.anotherTrack.track.url}</a></h3>
				<div>
					<span style={{ float: "left" }}>Play from {moment.duration(this.state.anotherTrack.track.start || 0, "ms").format("HH:mm:ss.SSS", { trim: false })} to {moment.duration(this.state.anotherTrack.track.end || this.state.anotherTrack.track.time * 1000, "ms").format("HH:mm:ss.SSS", { trim: false })}</span>
					<Slider range allowCross={false} max={this.state.anotherTrack.track.time * 1000} value={[this.state.anotherTrack.track.start || 0, this.state.anotherTrack.track.end || this.state.anotherTrack.track.time * 1000]} style={{ float: "right" }} onChange={(t: number[]) => this.setStartEnd(t[0], t[1])} onAfterChange={(t: number[]) => this.actualSetStartEnd(t[0], t[1])} />
				</div>
				<div>
					<span style={{ float: "left" }}>File: {Math.round(this.state.anotherTrack.track.volume * 100)}%</span>
					<Slider max={400} value={Math.round(this.state.anotherTrack.track.volume * 100)} style={{ float: "right" }} onChange={(v: number) => this.setLocalVolume(v)} />
				</div>
			</div>
		</div>
		else if (this.state.track) return <div className="flex-child flex center blurry">
			<div className="flex-child center">
				<img src={this.state.track.thumbnail} className={"thumbnail" + (this.state.paused ? " paused" : "")} onClick={() => this.togglePause()} /><br />
				<h2>{this.state.track.title}</h2>
				<h3><a href={this.state.track.url}>{this.state.track.url}</a></h3>
				<div>
					<span style={{ float: "left" }}>Play from {moment.duration(this.state.track.start || 0, "ms").format("HH:mm:ss.SSS", { trim: false })} to {moment.duration(this.state.track.end || this.state.track.time * 1000, "ms").format("HH:mm:ss.SSS", { trim: false })}</span>
					<Slider range allowCross={false} max={this.state.track.time * 1000} value={[this.state.track.start || 0, this.state.track.end || this.state.track.time * 1000]} style={{ float: "right" }} onChange={(t: number[]) => this.setStartEnd(t[0], t[1])} onAfterChange={(t: number[]) => this.actualSetStartEnd(t[0], t[1])} />
				</div>
				<div>
					<span style={{ float: "left" }}>Global: {Math.round(this.state.volume * 100)}%</span>
					<Slider max={200} value={Math.round(this.state.volume * 100)} style={{ float: "right" }} onChange={(v: number) => this.setVolume(v)} />
				</div>
				<div>
					<span style={{ float: "left" }}>File: {Math.round(this.state.track.volume * 100)}%</span>
					<Slider max={400} value={Math.round(this.state.track.volume * 100)} style={{ float: "right" }} onChange={(v: number) => this.setLocalVolume(v)} />
				</div>
			</div>
		</div>
		else return <div className="flex-child flex center blurry">
			<TradeW1ndPlaceholderComponent />
		</div>
	}
}