import { BrowserWindow } from "electron";
import { RuntimeSoundTrack } from "./classes/music";
import { Browser } from "puppeteer-core";

var dataPath: string;
export function getDataPath() { return dataPath; }
export function setDataPath(p: string) { return dataPath = p; }

var queuePath: string;
export function getQueuePath() { return queuePath; }
export function setQueuePath(p: string) { return queuePath = p; }

var downloadPath: string;
export function getDownloadPath() { return downloadPath; }
export function setDownloadPath(p: string) { return downloadPath = p; }

var queues = new Map<string, RuntimeSoundTrack[]>();
export function getQueues() { return queues; }
export function setQueues(q: Map<string, RuntimeSoundTrack[]>) { return queues = q; }
export function addQueues(...q: { name: string, tracks: RuntimeSoundTrack[] }[]) {
	for (const queue of q)
		queues.set(queue.name, queue.tracks);
	return queues;
}
export function setQueue(n: string, q: RuntimeSoundTrack[]) { return queues.set(n, q); }
export function delQueue(n: string) { return queues.delete(n); }
export function clearQueues() { queues.clear(); }

// Main-side only
var mainWindow: BrowserWindow;
export function getMainWindow() { return mainWindow; }
export function setMainWindow(w: BrowserWindow) { return mainWindow = w; }

var browser: Browser;
export function getBrowser() { return browser; }
export function setBrowser(b: Browser) { return browser = b; }

// Main-renderer sync
var downloading: string[] = [];
export function getDownloading() { return downloading; }
export function setDownloading(d: string[]) { return downloading = d; }

var playing: { queue: string, id: string };
export function getPlaying() { return playing; }
export function setPlaying(p: { queue: string, id: string }) { return playing = p; }

var adding: string | RuntimeSoundTrack | number | undefined;
export function getAdding() { return adding; }
export function setAdding(a: string | RuntimeSoundTrack | number | undefined) { return adding = a; }

// Renderer only
var viewingTrack: RuntimeSoundTrack;
export function getViewingTrack() { return viewingTrack; }
export function setViewingTrack(t: RuntimeSoundTrack) { return viewingTrack = t; }