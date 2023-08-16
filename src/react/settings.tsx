import React from "react";
import { WindowExtra } from "../classes/window";

export default class SettingsComponent extends React.Component {
	state: { autoplay: boolean, random: boolean, loop: boolean, repeat: boolean, volume: number, showState: boolean };

	constructor(props: object) {
		super(props);

		this.state = { autoplay: false, random: false, loop: false, repeat: false, volume: 1, showState: false };
		(window as WindowExtra).electronAPI.onUpdateVolume(volume => {
			this.setState({ volume });
		});
		(window as WindowExtra).electronAPI.onUpdateOptions((options) => {
			const player: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean } = { };
			if (options.autoplay !== undefined) player.autoplay = options.autoplay;
			if (options.random !== undefined) player.random = options.random;
			if (options.loop !== undefined) player.loop = options.loop;
			if (options.repeat !== undefined) player.repeat = options.repeat;
			this.setState(player);
		});
		(window as WindowExtra).electronAPI.requestStates();
		(window as WindowExtra).electronAPI.onUpdateClientSettings(settings => {
			if (settings.showState !== undefined) this.setState({ showState: settings.showState });
		});
		(window as WindowExtra).electronAPI.requestClientSettings();
	}

	toggleAutoplay() {
		const options: { autoplay: boolean, loop?: boolean } = { autoplay: !this.state.autoplay };
		if (!options.autoplay && this.state.loop) options.loop = !this.state.loop;
		(window as WindowExtra).electronAPI.setOptions(options);
	}

	toggleRandom() {
		(window as WindowExtra).electronAPI.setOptions({ random: !this.state.random });
	}

	toggleLoop() {
		const options: { loop: boolean, autoplay?: boolean } = { loop: !this.state.loop };
		if (options.loop && !this.state.autoplay) options.autoplay = !this.state.autoplay;
		(window as WindowExtra).electronAPI.setOptions(options);
	}

	toggleRepeat() {
		const options: { repeat: boolean, loop?: boolean } = { repeat: !this.state.repeat };
		if (options.repeat && this.state.loop) options.loop = !this.state.loop;
		(window as WindowExtra).electronAPI.setOptions(options);
	}

	setVolume(volume: string) {
		const parsed = parseInt(volume);
		if (isNaN(parsed)) return;
		this.setState({ volume: parsed / 100 });
	}

	actualSetVolume(volume: string) {
		const parsed = parseInt(volume);
		if (isNaN(parsed)) return;
		(window as WindowExtra).electronAPI.setVolume(parsed);
	}

	toggleShowState() {
		(window as WindowExtra).electronAPI.setClientSettings({ showState: !this.state.showState });
	}

	render() {
		return <div className="in-overlay settings">
			<h1>Player Options</h1>
			<div className="flex v-center">
				<input type="checkbox" checked={this.state.autoplay} onChange={() => this.toggleAutoplay()} /><label>Autoplay</label>
			</div>
			<div className="flex v-center">
				<input type="checkbox" checked={this.state.random} onChange={() => this.toggleRandom()} /><label>Random</label>
			</div>
			<div className="flex v-center">
				<input type="checkbox" checked={this.state.loop} onChange={() => this.toggleLoop()} /><label>Loop</label>
			</div>
			<div className="flex v-center">
				<input type="checkbox" checked={this.state.repeat} onChange={() => this.toggleRepeat()} /><label>Repeat</label>
			</div>
			<div className="flex v-center">
			<label>Volume: </label><input type="text" value={Math.round(this.state.volume * 100)} onKeyUp={e => e.key === "Enter" && this.actualSetVolume(e.currentTarget.value)} onChange={e => this.setVolume(e.target.value)} />
			</div>
			<h1>Accessibility</h1>
			<div className="flex v-center">
				<input type="checkbox" checked={this.state.showState} onChange={() => this.toggleShowState()} /><label>Show queue/track state</label>
			</div>
		</div>
	}
}