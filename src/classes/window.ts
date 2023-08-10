import { SoundTrack } from "./music"

export type ElectronBridge = {
	onUpdateQueues: (callback: ((queues: Map<string, SoundTrack[]>) => void)) => void,
	onUpdateStates: (callback: ((states: { downloading?: string[], playing?: { queue: string, id: string } }) => void)) => void,
	requestQueues: () => void,
	requestQueueDownload: (queue: string) => void,
	requestStates: () => void,
	requestPlay: (queue: string, id: string) => void,
}

export type WindowExtra = Window & typeof globalThis & { electronAPI: ElectronBridge }