// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { RuntimeSoundTrack, SoundTrack } from "./classes/music";

contextBridge.exposeInMainWorld("electronAPI", {
	onUpdateQueues: (callback: ((queues: Map<string, SoundTrack[]>) => void)) => ipcRenderer.on("update-queues", (_e, q) => callback(q)),
	onUpdateStates: (callback: ((states: { downloading: string[] }) => void)) => ipcRenderer.on("update-states", (_e, s) => callback(s)),
	onUpdateOptions: (callback: ((options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => void)) => ipcRenderer.on("update-options", (_e, o) => callback(o)),
	onUpdatePaused: (callback: ((paused: boolean) => void)) => ipcRenderer.on("update-paused", (_e, p) => callback(p)),
	onUpdateVolume: (callback: ((volume: number) => void)) => ipcRenderer.on("update-volume", (_e, v) => callback(v)),
	onUpdateTime: (callback: ((time: number) => void)) => ipcRenderer.on("update-time", (_e, t) => callback(t)),
	onUpdateAddingTrack: (callback: (() => void)) => ipcRenderer.on("update-adding-track", (_e) => callback()),
	onUpdateAddedTrack: (callback: ((result?: RuntimeSoundTrack | number) => void)) => ipcRenderer.on("update-added-track", (_e, r) => callback(r)),
	requestQueues: () => ipcRenderer.send("request-queues"),
	requestQueueDownload: (queue: string) => ipcRenderer.send("request-queue-download", queue),
	requestStates: () => ipcRenderer.send("request-states"),
	requestPlay: (queue: string, id: string, seek?: number) => ipcRenderer.send("request-play", queue, id, seek),
	requestStop: () => ipcRenderer.send("request-stop"),
	requestChooseFile: () => ipcRenderer.send("request-choose-file"),
	requestDeleteQueues: (queues: string[]) => ipcRenderer.send("request-delete-queues", queues),
	requestDeleteTracks: (queue: string, indices: number[]) => ipcRenderer.send("request-delete-tracks", queue, indices),
	requestDuplicate: (queue: string, newQueue: string) => ipcRenderer.send("request-duplicate", queue, newQueue),
	requestNewQueue: (name: string) => ipcRenderer.send("request-new-queue", name),
	requestAddTrack: (queue: string, url: string) => ipcRenderer.send("request-add-track", queue, url),
	requestDisable: (queue: string, indices: number[]) => ipcRenderer.send("request-disable", queue, indices),
	requestReloadQueues: () => ipcRenderer.send("request-reload-queues"),
	returnChooseFile: (callback: ((paths: undefined | string[]) => void)) => ipcRenderer.on("return-choose-file", (_e, p) => callback(p)),
	setOptions: (options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => ipcRenderer.send("set-options", options),
	setPaused: (paused: boolean) => ipcRenderer.send("set-paused", paused),
	setVolume: (volume: number) => ipcRenderer.send("set-volume", volume),
	setLocalVolume: (volume: number) => ipcRenderer.send("set-local-volume", volume),
	setStartEnd: (start: number, end: number) => ipcRenderer.send("set-start-end", start, end),
	setTrackPos: (queue: string, currentPos: number, newPos: number) => ipcRenderer.send("set-track-pos", queue, currentPos, newPos),
});