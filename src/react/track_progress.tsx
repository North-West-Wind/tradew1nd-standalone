import Slider from "rc-slider";
import React from "react";
import "../../public/styles/slider.less";
import { WindowExtra } from "../classes/window";
import { RuntimeSoundTrack } from "../classes/music";
import { getPlaying, getQueues } from "../state";
import moment from "moment";
import "moment-duration-format";

export default class TrackProgressComponent extends React.Component {
	state: { track: RuntimeSoundTrack, time: number, changing: boolean };

	constructor(props: {}) {
		super(props);

		this.state = { track: null, time: 0, changing: false };
		(window as WindowExtra).electronAPI.onUpdateStates(states => {
			if (states.playing === undefined) return;
			const playing = states.playing;
			if (playing) {
				this.setState({ track: getQueues().get(playing.queue).find(t => t.id === playing.id) });
			} else this.setState({ track: null });
		});
		(window as WindowExtra).electronAPI.onUpdateTime(time => {
			if (!this.state.changing) this.setState({ time });
		});
	}

	seek(value: number) {
		this.setState({ time: value });
	}

	actualSeek(value: number) {
		const playing = getPlaying();
		if (!playing) return;
		(window as WindowExtra).electronAPI.requestPlay(playing.queue, playing.id, value);
		this.setState({ changing: false });
	}
	
	render() {
		if (!this.state.track) return;
		return <div className="progress flex center">
				<span className="progress-time">{moment.duration(this.state.time).format("HH:mm:ss", { trim: false })}</span>
				<Slider style={{ margin: "1rem" }} max={this.state.track.time * 1000} value={this.state.time} onBeforeChange={() => this.setState({ changing: true })} onChange={(v: number) => this.seek(v)} onAfterChange={(v: number) => this.actualSeek(v)} />
				<span className="progress-time">{moment.duration(this.state.track.time * 1000).format("HH:mm:ss", { trim: false })}</span>
		</div>
	}
}