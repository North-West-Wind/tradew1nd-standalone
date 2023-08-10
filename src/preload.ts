// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { SoundTrack } from "./classes/music";

contextBridge.exposeInMainWorld("electronAPI", {
	onUpdateQueues: (callback: ((queues: Map<string, SoundTrack[]>) => {})) => ipcRenderer.on("update-queues", (_e, q) => callback(q)),
	onUpdateStates: (callback: ((states: { downloading: string[] }) => {})) => ipcRenderer.on("update-states", (_e, s) => callback(s)),
	requestQueues: () => ipcRenderer.send("request-queues"),
	requestQueueDownload: (queue: string) => ipcRenderer.send("request-queue-download", queue),
	requestStates: () => ipcRenderer.send("request-states"),
	requestPlay: (queue: string, id: string) => ipcRenderer.send("request-play", queue, id)
});