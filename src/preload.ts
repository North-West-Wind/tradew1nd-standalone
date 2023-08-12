// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { SoundTrack } from "./classes/music";

contextBridge.exposeInMainWorld("electronAPI", {
	onUpdateQueues: (callback: ((queues: Map<string, SoundTrack[]>) => {})) => ipcRenderer.on("update-queues", (_e, q) => callback(q)),
	onUpdateStates: (callback: ((states: { downloading: string[] }) => {})) => ipcRenderer.on("update-states", (_e, s) => callback(s)),
	onUpdateOptions: (callback: ((options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => {})) => ipcRenderer.on("update-options", (_e, o) => callback(o)),
	onUpdatePaused: (callback: ((paused: boolean) => {})) => ipcRenderer.on("update-paused", (_e, p) => callback(p)),
	onUpdateVolume: (callback: ((volume: number) => {})) => ipcRenderer.on("update-volume", (_e, v) => callback(v)),
	onUpdateTime: (callback: ((time: number) => {})) => ipcRenderer.on("update-time", (_e, t) => callback(t)),
	requestQueues: () => ipcRenderer.send("request-queues"),
	requestQueueDownload: (queue: string) => ipcRenderer.send("request-queue-download", queue),
	requestStates: () => ipcRenderer.send("request-states"),
	requestPlay: (queue: string, id: string, seek?: number) => ipcRenderer.send("request-play", queue, id, seek),
	setOptions: (options: { autoplay?: boolean, random?: boolean, loop?: boolean, repeat?: boolean }) => ipcRenderer.send("set-options", options),
	setPaused: (paused: boolean) => ipcRenderer.send("set-paused", paused),
	setVolume: (volume: number) => ipcRenderer.send("set-volume", volume),
	setLocalVolume: (volume: number) => ipcRenderer.send("set-local-volume", volume),
	setStartEnd: (start: number, end: number) => ipcRenderer.send("set-start-end", start, end),
});