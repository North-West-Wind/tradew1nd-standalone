export type SoundTrack = {
	id?: string;
	title: string;
	url: string;
	type: number;
	time: number;
	volume: number;
	thumbnail: string;
	start?: number;
	end?: number;
}

export const trackType = [
	"YouTube",
	"Spotify",
	"URL",
	"SoundCloud",
	"Google Drive",
	"Musescore",
	"File"
];

export type RuntimeSoundTrack = SoundTrack & {
	downloading: boolean;
	downloaded: boolean;
	playing: boolean;
}