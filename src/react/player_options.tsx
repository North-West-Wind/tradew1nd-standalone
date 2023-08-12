import React from "react";
import { WindowExtra } from "../classes/window";

export default class PlayerOptionsComponent extends React.Component {
	state: { enabled: boolean, autoplay: boolean, random: boolean, loop: boolean, repeat: boolean };

	constructor(props: {}) {
		super(props);
		this.state = { enabled: false, autoplay: false, random: false, loop: false, repeat: false };
		(window as WindowExtra).electronAPI.onUpdateStates((states) => {
			if (states.playing === undefined) return;
			this.setState({ enabled: !!states.playing });
		});
		(window as WindowExtra).electronAPI.onUpdateOptions((options) => {
			const player: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean } = { };
			if (options.autoplay !== undefined) player.autoplay = options.autoplay;
			if (options.random !== undefined) player.random = options.random;
			if (options.loop !== undefined) player.loop = options.loop;
			if (options.repeat !== undefined) player.repeat = options.repeat;
			this.setState(player);
		});
	}

	toggleAutoplay() {
		const options: any = { autoplay: !this.state.autoplay };
		if (!options.autoplay && this.state.loop) options.loop = !this.state.loop;
		(window as WindowExtra).electronAPI.setOptions(options);
	}

	toggleRandom() {
		(window as WindowExtra).electronAPI.setOptions({ random: !this.state.random });
	}

	toggleLoop() {
		const options: any = { loop: !this.state.loop };
		if (options.loop && !this.state.autoplay) options.autoplay = !this.state.autoplay;
		(window as WindowExtra).electronAPI.setOptions(options);
	}

	toggleRepeat() {
		const options: any = { repeat: !this.state.repeat };
		if (options.repeat && this.state.loop) options.loop = !this.state.loop;
		(window as WindowExtra).electronAPI.setOptions(options);
	}

	render() {
		if (!this.state.enabled) return;
		return <div className="playing-options flex">
			<div className={"flex-option center" + (this.state.autoplay ? "" : " disabled")} onClick={() => this.toggleAutoplay()}>Autoplay</div>
			<div className={"flex-option center" + (this.state.random ? "" : " disabled")} onClick={() => this.toggleRandom()}>Random</div>
			<div className={"flex-option center" + (this.state.loop ? "" : " disabled")} onClick={() => this.toggleLoop()}>Loop</div>
			<div className={"flex-option center" + (this.state.repeat ? "" : " disabled")} onClick={() => this.toggleRepeat()}>Repeat</div>
			<div className={"flex-option center red"}>Stop</div>
		</div>
	}
}