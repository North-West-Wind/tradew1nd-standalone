import { RuntimeSoundTrack } from "./music"

export type ElectronBridge = {
	onUpdateQueues: (callback: ((queues: Map<string, RuntimeSoundTrack[]>) => void)) => void,
	onUpdateStates: (callback: ((states: { downloading?: string[], playing?: { queue: string, id: string }, exporting?: { prog: number, max: number } }) => void)) => void,
	onUpdateOptions: (callback: ((options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => void)) => void,
	onUpdatePaused: (callback: ((paused: boolean) => void)) => void,
	onUpdateVolume: (callback: ((volume: number) => void)) => void,
	onUpdateTime: (callback: ((time: number) => void)) => void,
	onUpdateAddingTrack: (callback: (() => void)) => void,
	onUpdateAddedTrack: (callback: ((result?: RuntimeSoundTrack | number) => void)) => void,
	onUpdateClientSettings: (callback: ((settings: { showDisabled?: boolean, showState?: boolean, exitOnClose?: boolean }) => void)) => void,
	requestQueues: () => void,
	requestQueueDownload: (queue: string) => void,
	requestStates: () => void,
	requestPlay: (queue: string, id: string, seek?: number) => void,
	requestStop: () => void,
	requestChooseFile: () => void,
	requestDeleteQueues: (queues: string[]) => void,
	requestDeleteTracks: (queue: string, indices: number[]) => void,
	requestDuplicate: (queue: string, newQueue: string) => void,
	requestNewQueue: (name: string) => void,
	requestAddTrack: (queue: string, url: string) => void,
	requestDisable: (queue: string, indices: number[]) => void,
	requestReloadQueues: () => void,
	requestClientSettings: () => void,
	requestExportQueue: (queue: string, addDisabled: boolean) => void,
	returnChooseFile: (callback: ((paths: undefined | string[]) => void)) => void,
	setOptions: (options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => void,
	setPaused: (paused: boolean) => void,
	setVolume: (volume: number) => void,
	setLocalVolume: (volume: number) => void,
	setStartEnd: (start: number, end: number, anotherTrack?: { queue: string, id: string }) => void,
	setTrackPos: (queue: string, currentPos: number, newPos: number) => void,
	setClientSettings: (settings: { showDisabled?: boolean, showState?: boolean, exitOnClose?: boolean }) => void,
}

export type WindowExtra = Window & typeof globalThis & { electronAPI: ElectronBridge }