import React from "react";
import { RuntimeSoundTrack, trackType } from "../classes/music";
import { WindowExtra } from "../classes/window";
import { List } from "react-movable";
import { getViewingTrack, setViewingTrack } from "../state";
import settingsSvg from "../../public/images/settings.svg";
import SettingsComponent from "./settings";
import informationSvg from "../../public/images/information.svg";
import InformationComponent from "./information";

export default class ListComponent extends React.Component {
	state: {
		queues: Map<string, RuntimeSoundTrack[]>,
		viewing: string | null,
		disable: boolean,
		rearrange: boolean,
		remove: boolean,
		toBeDeleted: (string | number)[],
		disabled: number[],
		waitingFiles: boolean,
		duplicate: boolean,
		paths: string[],
		newQueue: string,
		newUrl: string,
		showDisabled: boolean,
		showState: boolean,
		showHelp: boolean,
		showSettings: boolean
	};

	myRef = React.createRef<HTMLHeadingElement>();

	constructor(props: object) {
		super(props);
		this.state = {
			queues: new Map(),
			viewing: null,
			disable: false,
			rearrange: false,
			remove: false,
			toBeDeleted: [],
			disabled: [],
			waitingFiles: false,
			duplicate: false,
			paths: undefined,
			newQueue: "",
			newUrl: "",
			showDisabled: true,
			showState: false,
			showHelp: false,
			showSettings: false
		};

		(window as WindowExtra).electronAPI.onUpdateQueues(queues => {
			if (queues.has(this.state.viewing)) this.setState({ queues });
			else this.setState({ queues, viewing: null });
		});
		(window as WindowExtra).electronAPI.requestQueues();
		(window as WindowExtra).electronAPI.onUpdateStates(() => this.forceUpdate());
		(window as WindowExtra).electronAPI.returnChooseFile(paths => {
			if (paths) (window as WindowExtra).electronAPI.requestAddTrack(this.state.viewing, JSON.stringify(paths));
			this.setState({ waitingFiles: false });
		});
		(window as WindowExtra).electronAPI.onUpdateClientSettings(settings => {
			if (settings.showState !== undefined) this.setState({ showState: settings.showState });
			if (settings.showDisabled !== undefined) this.setState({ showDisabled: settings.showDisabled });
		});
		(window as WindowExtra).electronAPI.requestClientSettings();
	}

	changePos(currentPos: number, newPos: number) {
		(window as WindowExtra).electronAPI.setTrackPos(this.state.viewing, currentPos, newPos);
	}

	setViewing(name: string) {
		this.setState({ viewing: name, remove: false, toBeDeleted: [] });
	}

	resetViewing() {
		this.setState({ viewing: null, remove: false, toBeDeleted: [] });
	}

	requestQueueDownload(queue?: string) {
		(window as WindowExtra).electronAPI.requestQueueDownload(queue || this.state.viewing);
	}

	requestPlay(id: string) {
		(window as WindowExtra).electronAPI.requestPlay(this.state.viewing, id);
	}

	requestChooseFile() {
		(window as WindowExtra).electronAPI.requestChooseFile();
		this.setState({ waitingFiles: true, paths: undefined });
	}

	toggleRearrange() {
		const newState = !this.state.rearrange;
		this.setState({ rearrange: !this.state.rearrange });
		if (newState) this.setState({ disable: false, remove: false, toBeDeleted: [], disabled: []  });
	}

	toggleRemove() {
		const newState = !this.state.remove;
		if (!newState) {
			if (this.state.viewing) (window as WindowExtra).electronAPI.requestDeleteTracks(this.state.viewing, this.state.toBeDeleted as number[]);
			else (window as WindowExtra).electronAPI.requestDeleteQueues(this.state.toBeDeleted as string[]);
		} else this.setState({ disable: false, rearrange: false });
		this.setState({ remove: newState, toBeDeleted: [] });
	}

	toggleToBeDeleted(idOrIndex: string | number) {
		const tbd = this.state.toBeDeleted;
		if (tbd.includes(idOrIndex)) tbd.splice(tbd.indexOf(idOrIndex), 1);
		else tbd.push(idOrIndex);
		this.setState({ toBeDeleted: tbd });
	}

	toggleDuplicate() {
		this.setState({ duplicate: !this.state.duplicate });
	}

	requestDuplicate(queue: string) {
		if (!this.state.duplicate) return;
		(window as WindowExtra).electronAPI.requestDuplicate(queue, this.state.newQueue);
		this.setState({ duplicate: false, newQueue: "" });
	}

	setNewQueue(name: string) {
		this.setState({ newQueue: name });
	}

	queueNameKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Enter") {
			(window as WindowExtra).electronAPI.requestNewQueue(this.state.newQueue);
			this.setState({ newQueue: "" });
		}
	}

	setNewUrl(url: string) {
		this.setState({ newUrl: url });
	}

	urlKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
		if (!this.state.viewing) return;
		if (event.key === "Enter") {
			(window as WindowExtra).electronAPI.requestAddTrack(this.state.viewing, this.state.newUrl);
			this.setState({ newUrl: "" });
		}
	}

	toggleDisable() {
		if (!this.state.viewing) return;
		const newState = !this.state.disable;
		if (!newState) (window as WindowExtra).electronAPI.requestDisable(this.state.viewing, this.state.disabled);
		else this.setState({ rearrange: false, remove: false, toBeDeleted: [] });
		this.setState({ disable: newState, disabled: this.state.queues.get(this.state.viewing).map((t, ii) => Object.assign({ ii }, t)).filter(t => t.disabled).map(t => t.ii) });
	}

	toggleDisabled(index: number) {
		const tbd = this.state.disabled;
		if (tbd.includes(index)) tbd.splice(tbd.indexOf(index), 1);
		else tbd.push(index);
		this.setState({ disabled: tbd });
	}

	toggleShowDisabled() {
		(window as WindowExtra).electronAPI.setClientSettings({ showDisabled: !this.state.showDisabled });
	}

	removeDisabled() {
		if (this.state.viewing)
			(window as WindowExtra).electronAPI.requestDeleteTracks(this.state.viewing, this.state.queues.get(this.state.viewing).map((t, ii) => ({ ii, disabled: t.disabled })).filter(t => t.disabled).map(t => t.ii));
	}

	toggleHelp() {
		this.setState({ showHelp: !this.state.showHelp });
	}

	toggleSettings() {
		this.setState({ showSettings: !this.state.showSettings });
	}

	getTrackEntry(track: RuntimeSoundTrack, ii: number) {
		let addedText: string = undefined;
		if (this.state.showState) {
			if (this.state.toBeDeleted.includes(ii)) addedText = "Will be deleted";
			else if ((this.state.disable ? this.state.disabled.includes(ii) : track.disabled)) addedText = "Disabled";
			else if (track.playing) addedText = "Playing";
			if (getViewingTrack()?.track.id === track.id) {
				if (addedText) addedText += " / Viewing";
				else addedText = "Viewing";
			}
		}
		return <div
			key={track.id}
			className={"entry " + (track.playing ? "playing" : (track.downloaded ? "downloaded" : "")) + (this.state.toBeDeleted.includes(ii) ? " to-be-deleted" : "") + ((this.state.disable ? this.state.disabled.includes(ii) : track.disabled) ? " disabled" : "") + ((!this.state.showDisabled && track.disabled ? " hidden" : "")) + (getViewingTrack()?.track.id === track.id ? " viewing" : "")}
			style={track.downloading && !this.state.toBeDeleted.includes(ii) && (track.disabled || this.state.disabled.includes(ii)) ? { animationName: "downloading", animationIterationCount: "infinite", animationDuration: "2s" } : {}}
			onClick={() => {
				if (this.state.disable) this.toggleDisabled(ii);
				else if (this.state.remove) this.toggleToBeDeleted(ii);
				else this.requestPlay(track.id)
			}}
			onContextMenu={() => {
				const viewing = getViewingTrack();
				if (!viewing || viewing.track.id !== track.id) setViewingTrack({ queue: this.state.viewing, track });
				else setViewingTrack(undefined);
				window.dispatchEvent(new Event("update-viewing-track"));
				this.forceUpdate();
			}}
		>
			<h2>{track.title}</h2>
			<div className="flex v-center">
				<h3>#{ii + 1} / {trackType[track.type]}</h3>
				{[0, 3].includes(track.type) && <img src={track.thumbnail} />}
			</div>
			{addedText && <h3>{addedText}</h3>}
		</div>
	}

	render() {
		if (!this.state.viewing) {
			const entries: React.ReactNode[] = [];
			for (const [name, tracks] of this.state.queues.entries()) {
				let addedText: string = undefined;
				if (this.state.showState) {
					if (this.state.toBeDeleted.includes(name)) addedText = "Will be deleted";
					else if (tracks.some(t => t.playing)) addedText = "Playing";
				}
				entries.push(
					<div
						key={name}
						className={"entry" + (tracks.some(t => t.playing) ? " playing" : (tracks.every(t => t.downloaded) ? " downloaded" : "")) + (this.state.toBeDeleted.includes(name) ? " to-be-deleted" : "")}
						onClick={() => this.state.duplicate ? this.requestDuplicate(name) : (this.state.remove ? this.toggleToBeDeleted(name) : this.setViewing(name))}
						style={tracks.some(t => t.downloading) && !tracks.some(t => t.playing) && !this.state.toBeDeleted.includes(name) ? { animationName: "downloading", animationIterationCount: "infinite", animationDuration: "2s" } : {}}
					>
						<h2>{name}</h2>
						<h3>Tracks: {tracks.length}</h3>
						{addedText && <h3>{addedText}</h3>}
					</div>
				);
			}
			return <div className='flex-child blurry'>
				<div className="flex v-center">
					<img src={informationSvg} className="clickable" onClick={() => this.toggleHelp()} />
					<img src={settingsSvg} className="clickable" onClick={() => this.toggleSettings()} />
					<h1>Queue List</h1>
				</div>
				<div className="flex">
					<input type="text" className="add-track" style={{ flex: 3 }} placeholder="Name of new queue..." value={this.state.newQueue} onChange={e => this.setNewQueue(e.target.value)} onKeyUp={(event) => this.queueNameKeyUp(event)} />
					<div className={"add-track flex-option " + (this.state.duplicate ? "disabled" : "")} style={{ flex: 2 }} onClick={() => this.toggleDuplicate()}>{this.state.duplicate ? "Choose a queue" : "Duplicate"}</div>
				</div>
				<div className="flex center" style={{ marginBottom: ".5rem" }}>
					<div className={"flex-option red " + (!this.state.remove ? "disabled" : "")} onClick={() => this.toggleRemove()}>Remove</div>
				</div>
				{entries}
				{this.state.showHelp && <InformationComponent onClick={() => this.toggleHelp()} />}
				{this.state.showSettings && <div className="overlay flex">
					<div className="close-button" onClick={() => this.toggleSettings()}>x</div>
					<SettingsComponent />
				</div>}
			</div>
		} else {
			const downloading = this.state.queues.get(this.state.viewing).some(t => t.downloading);
			return <div className='flex-child blurry'>
				<div className="flex v-center">
					<img src={informationSvg} className="clickable" onClick={() => this.toggleHelp()} />
					<img src={settingsSvg} className="clickable" onClick={() => this.toggleSettings()} />
					<h1 className="clickable" onClick={() => this.resetViewing()}>{"<"} {this.state.viewing}</h1>
				</div>
				<div className="flex">
					<input type="text" className="add-track" style={{ flex: 3 }} placeholder="Soundtrack URL..." value={this.state.newUrl} onChange={e => this.setNewUrl(e.target.value)} onKeyUp={event => this.urlKeyUp(event)} />
					<div className={"add-track flex-option " + (this.state.waitingFiles ? "disabled" : "")} style={{ flex: 1 }} onClick={() => this.requestChooseFile()}>Local File(s)</div>
				</div>
				<div className="flex">
					<div className="flex-button" style={{ backgroundColor: downloading ? "#444444" : "#43b1fc" }} onClick={() => !downloading && this.requestQueueDownload()}>{!downloading ? "Download" : "Cancel"}</div>
					<div className="flex-button" style={{ backgroundColor: downloading ? "#444444" : "#2dccbf" }} onClick={() => !downloading && this.requestPlay(this.state.queues.get(this.state.viewing)[0].id)}>Play</div>
					<div className="flex-button" style={{ backgroundColor: downloading ? "#444444" : "#59cc32" }} onClick={() => {
						if (downloading) return;
						const tracks = this.state.queues.get(this.state.viewing);
						this.requestPlay(tracks[Math.floor(Math.random() * tracks.length)].id);
					}}>Play Random</div>
				</div>
				<div className="flex center">
					<div className={"flex-option " + (!this.state.showDisabled ? "disabled" : "")} onClick={() => this.toggleShowDisabled()}>Show Disabled</div>
					<div className={"flex-option red"} onClick={() => this.removeDisabled()}>Remove Disabled</div>
				</div>
				<div className="flex center" style={{ marginBottom: ".5rem" }}>
					<div className={"flex-option unimportant " + (!this.state.disable ? "disabled" : "")} onClick={() => this.toggleDisable()}>Disable</div>
					<div className={"flex-option " + (!this.state.rearrange ? "disabled" : "")} onClick={() => this.toggleRearrange()}>Rearrange</div>
					<div className={"flex-option red " + (!this.state.remove ? "disabled" : "")} onClick={() => this.toggleRemove()}>Remove</div>
				</div>
				{this.state.rearrange && <List
					values={this.state.queues.get(this.state.viewing)}
					onChange={({ oldIndex, newIndex }) => this.changePos(oldIndex, newIndex)}
					renderList={({ children, props }) => <ul className="hidden" {...props}>{children}</ul>}
					renderItem={({ value: track, props, index }) => <li className="hidden" {...props}>
						{this.getTrackEntry(track, index)}
					</li>}
				/>}
				{!this.state.rearrange && this.state.queues.get(this.state.viewing).map((t, ii) => this.getTrackEntry(t, ii))}
				{this.state.showHelp && <InformationComponent onClick={() => this.toggleHelp()} />}
				{this.state.showSettings && <div className="overlay flex">
					<div className="close-button" onClick={() => this.toggleSettings()}>x</div>
					<SettingsComponent />
				</div>}
			</div>
		}
	}
}