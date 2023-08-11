import React from "react";
import TradeW1ndPlaceholderComponent from "./tradew1nd_placeholder";
import { WindowExtra } from "../classes/window";
import { getQueues } from "../state";
import { RuntimeSoundTrack } from "../classes/music";

export default class TrackInfoComponent extends React.Component {
	state: { track: RuntimeSoundTrack, paused: boolean };

	constructor(props: any) {
		super(props);

		this.state = { track: null, paused: false };
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
	}

	togglePause() {
		(window as WindowExtra).electronAPI.setPaused(!this.state.paused);
	}

	render() {
		return <div className="flex-child flex center blurry">
			{!this.state.track && <TradeW1ndPlaceholderComponent />}
			{
				this.state.track &&
				<div className="flex-child center">
					<img src={this.state.track.thumbnail} className={"thumbnail" + (this.state.paused ? " paused" : "")} onClick={() => this.togglePause()} /><br/>
					<h2>{this.state.track.title}</h2>
					<div>⏵</div>
				</div>
			}
		</div>
	}
}