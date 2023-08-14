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
	disabled?: boolean;
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
	id: string;
	downloading: boolean;
	downloaded: boolean;
	playing: boolean;
}