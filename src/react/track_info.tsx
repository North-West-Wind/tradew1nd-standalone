import React from "react";
import TradeW1ndPlaceholderComponent from "./tradew1nd_placeholder";
import { WindowExtra } from "../classes/window";
import { getPlaying, getQueues } from "../state";
import { RuntimeSoundTrack } from "../classes/music";
import Slider from "rc-slider";
import "../../public/styles/slider.less";
import moment from "moment";

export default class TrackInfoComponent extends React.Component {
	state: { track: RuntimeSoundTrack, paused: boolean, volume: number };

	constructor(props: any) {
		super(props);

		this.state = { track: null, paused: false, volume: 1 };
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
	}

	togglePause() {
		console.log("next paused state", !this.state.paused);
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
		(window as WindowExtra).electronAPI.setStartEnd(start, end);
	}

	render() {
		return <div className="flex-child flex center blurry">
			{!this.state.track && <TradeW1ndPlaceholderComponent />}
			{
				this.state.track &&
				<div className="flex-child center">
					<img src={this.state.track.thumbnail} className={"thumbnail" + (this.state.paused ? " paused" : "")} onClick={() => this.togglePause()} /><br/>
					<h2>{this.state.track.title}</h2>
					<div>
						<span style={{ float: "left" }}>Play from {moment.utc(this.state.track.start || 0).format("HH:mm:ss.SSS")} to {moment.utc(this.state.track.end || this.state.track.time * 1000).format("HH:mm:ss.SSS")}</span>
						<Slider range allowCross={false} max={this.state.track.time * 1000} value={[this.state.track.start || 0, this.state.track.end || this.state.track.time * 1000]} style={{ float: "right" }} onChange={(t: number[]) => this.setStartEnd(t[0], t[1])} onAfterChange={(t: number[]) => this.actualSetStartEnd(t[0], t[1])} />
					</div>
					<div>
						<span style={{ float: "left" }}>Global: {Math.round(this.state.volume * 100)}%</span>
						<Slider max={200} defaultValue={Math.round(this.state.volume * 100)} style={{ float: "right" }} onChange={(v: number) => this.setVolume(v)} />
					</div>
					<div>
						<span style={{ float: "left" }}>File: {Math.round(this.state.track.volume * 100)}%</span>
						<Slider max={200} defaultValue={Math.round(this.state.track.volume * 100)} style={{ float: "right" }} onChange={(v: number) => this.setLocalVolume(v)} />
					</div>
				</div>
			}
		</div>
	}
}