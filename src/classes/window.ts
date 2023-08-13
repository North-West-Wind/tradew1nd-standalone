import { RuntimeSoundTrack } from "./music"

export type ElectronBridge = {
	onUpdateQueues: (callback: ((queues: Map<string, RuntimeSoundTrack[]>) => void)) => void,
	onUpdateStates: (callback: ((states: { downloading?: string[], playing?: { queue: string, id: string } }) => void)) => void,
	onUpdateOptions: (callback: ((options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => void)) => void,
	onUpdatePaused: (callback: ((paused: boolean) => void)) => void,
	onUpdateVolume: (callback: ((volume: number) => void)) => void,
	onUpdateTime: (callback: ((time: number) => void)) => void,
	requestQueues: () => void,
	requestQueueDownload: (queue: string) => void,
	requestStates: () => void,
	requestPlay: (queue: string, id: string, seek?: number) => void,
	requestStop: () => void,
	setOptions: (options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => void,
	setPaused: (paused: boolean) => void,
	setVolume: (volume: number) => void,
	setLocalVolume: (volume: number) => void,
	setStartEnd: (start: number, end: number) => void,
	setTrackPos: (queue: string, currentPos: number, newPos: number) => void,
}

export type WindowExtra = Window & typeof globalThis & { electronAPI: ElectronBridge }