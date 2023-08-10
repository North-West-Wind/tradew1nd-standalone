import React from "react";
import { RuntimeSoundTrack, trackType } from "../classes/music";
import { WindowExtra } from "../classes/window";
import { getDownloading, getPlaying } from "../state";

export default class ListComponent extends React.Component {
	state: { queues: Map<string, RuntimeSoundTrack[]>, viewing: string | null };

	constructor(props: any) {
		super(props);
		this.state = { queues: new Map(), viewing: null };

		(window as WindowExtra).electronAPI.onUpdateQueues(queues => {
			if (queues.has(this.state.viewing)) this.setState({ queues });
			else this.setState({ queues, viewing: null });
		});
		(window as WindowExtra).electronAPI.requestQueues();
		(window as WindowExtra).electronAPI.onUpdateStates(() => this.forceUpdate());
	}

	setViewing(name: string) {
		this.setState({ viewing: name });
	}

	resetViewing() {
		this.setState({ viewing: null });
	}

	requestQueueDownload() {
		(window as WindowExtra).electronAPI.requestQueueDownload(this.state.viewing);
	}

	requestPlay(id: string) {
		(window as WindowExtra).electronAPI.requestPlay(this.state.viewing, id);
	}

	render() {
		if (!this.state.viewing) {
			const entries: React.ReactNode[] = [];
			for (const [name, tracks] of this.state.queues.entries()) {
				entries.push(<div key={name} className={"entry " + (getPlaying()?.queue === name ? "playing" : "")} onClick={() => this.setViewing(name)} style={getDownloading().includes(name) ? { animationName: "downloading", animationIterationCount: "infinite", animationDuration: "2s" } : {}}>
					<h2>{name}</h2>
					<h3>Tracks: {tracks.length}</h3>
				</div>)
			}
			return <div className='flex-child blurry'>
				<h1>Queue List</h1>
				{entries}
			</div>
		} else {
			const entries: React.ReactNode[] = [];
			for (const track of this.state.queues.get(this.state.viewing)!) {
				entries.push(<div key={track.id} className={"entry " + (track.playing ? "playing" : (track.downloaded ? "downloaded" : ""))} style={track.downloading ? { animationName: "downloading", animationIterationCount: "infinite", animationDuration: "2s" } : {}} onClick={() => this.requestPlay(track.id)}>
					<h2>{track.title}</h2>
					<h3>{track.url}</h3>
					<h3>{trackType[track.type]}</h3>
				</div>)
			}
			const downloading = getDownloading().includes(this.state.viewing);
			return <div className='flex-child blurry'>
				<h1 className="clickable" onClick={() => this.resetViewing()}>{"<"} {this.state.viewing}</h1>
				<div className="flex">
					<div className="flex-button" style={{ backgroundColor: downloading ? "#eb0400" : "#43b1fc" }} onClick={() => this.requestQueueDownload()}>{!downloading ? "Download" : "Cancel"}</div>
					<div className="flex-button" style={{ flex: 2, backgroundColor: downloading ? "#444444" : "#59cc32" }}>Download and Play</div>
				</div>
				{entries}
			</div>
		}
	}
}