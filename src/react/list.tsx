import React from "react";
import { RuntimeSoundTrack, trackType } from "../classes/music";
import { WindowExtra } from "../classes/window";
import { getDownloading } from "../state";
import { sleep } from "../helpers/misc";
import { List } from "react-movable";

export default class ListComponent extends React.Component {
	state: { queues: Map<string, RuntimeSoundTrack[]>, viewing: string | null, rearrange: boolean };

	constructor(props: any) {
		super(props);
		this.state = { queues: new Map(), viewing: null, rearrange: false };

		(window as WindowExtra).electronAPI.onUpdateQueues(queues => {
			if (queues.has(this.state.viewing)) this.setState({ queues });
			else this.setState({ queues, viewing: null });
		});
		(window as WindowExtra).electronAPI.requestQueues();
		(window as WindowExtra).electronAPI.onUpdateStates(() => this.forceUpdate());
	}

	changePos(currentPos: number, newPos: number) {
		(window as WindowExtra).electronAPI.setTrackPos(this.state.viewing, currentPos, newPos);
	}

	setViewing(name: string) {
		this.setState({ viewing: name });
	}

	resetViewing() {
		this.setState({ viewing: null });
	}

	requestQueueDownload(queue?: string) {
		(window as WindowExtra).electronAPI.requestQueueDownload(queue || this.state.viewing);
	}

	requestPlay(id: string) {
		(window as WindowExtra).electronAPI.requestPlay(this.state.viewing, id);
	}

	async requestDownloadAndPlay() {
		const queue = this.state.viewing;
		this.requestPlay(this.state.queues.get(queue)[0].id);
		await sleep(3000);
		this.requestQueueDownload(queue);
	}

	toggleRearrange() {
		this.setState({ rearrange: !this.state.rearrange });
	}

	render() {
		if (!this.state.viewing) {
			const entries: React.ReactNode[] = [];
			for (const [name, tracks] of this.state.queues.entries()) {
				entries.push(<div key={name} className={"entry " + (tracks.some(t => t.playing) ? "playing" : (tracks.every(t => t.downloaded) ? "downloaded" : ""))} onClick={() => this.setViewing(name)} style={tracks.some(t => t.downloading) ? { animationName: "downloading", animationIterationCount: "infinite", animationDuration: "2s" } : {}}>
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
					<h3>{trackType[track.type]}</h3>
				</div>)
			}
			const downloading = getDownloading().includes(this.state.viewing);
			return <div className='flex-child blurry'>
				<h1 className="clickable" onClick={() => this.resetViewing()}>{"<"} {this.state.viewing}</h1>
				<div className="flex">
					<div className="flex-button" style={{ backgroundColor: downloading ? "#eb0400" : "#43b1fc" }} onClick={() => this.requestQueueDownload()}>{!downloading ? "Download" : "Cancel"}</div>
					<div className="flex-button" style={{ flex: 2, backgroundColor: downloading ? "#444444" : "#59cc32" }} onClick={() => this.requestDownloadAndPlay()}>Download and Play</div>
				</div>
				<div className="flex">
					<input type="text" className="add-track" placeholder="Soundtrack URL..." />
				</div>
				<div className="flex center">
					<div className={"flex-option " + (!this.state.rearrange ? "disabled" : "")} onClick={() => this.toggleRearrange()}>Rearrange</div>
				</div>
				{this.state.rearrange && <List
					values={this.state.queues.get(this.state.viewing)}
					onChange={({ oldIndex, newIndex }) => this.changePos(oldIndex, newIndex)}
					renderList={({ children, props }) => <ul className="hidden" {...props}>{children}</ul>}
					renderItem={({ value: track, props }) => <li className="hidden" {...props}>
						<div key={track.id} className={"entry " + (track.playing ? "playing" : (track.downloaded ? "downloaded" : ""))} style={track.downloading ? { animationName: "downloading", animationIterationCount: "infinite", animationDuration: "2s" } : {}} onClick={() => this.requestPlay(track.id)}>
							<h2>{track.title}</h2>
							<h3>{trackType[track.type]}</h3>
						</div>
					</li>}
				/>}
				{!this.state.rearrange && entries}
			</div>
		}
	}
}