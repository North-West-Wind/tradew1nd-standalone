export function clamp(val: number, min: number, max: number) {
	if (val < min) return min;
	if (val > max) return max;
	return val;
}

export function sleep(ms: number) {
	return new Promise<void>(res => setTimeout(res, ms));
}

export function isBetween(val: number, min: number, max: number) {
	return clamp(val, min, max) == val;
}

export function decodeHtmlEntity(str: string) { return str?.replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec)).replace(/&quot;/g, `"`).replace(/&amp;/g, `&`); }

export function humanDurationToNum(duration: string) {
	const splitted = duration.split(".");
	const rest = splitted[0];
	const splitted1 = rest.split(":").reverse();
	let sec = 0;
	for (let i = 0; i < splitted1.length; i++) {
			let parsed;
			if (isNaN(parsed = parseInt(splitted1[i]))) continue;
			sec += parsed * Math.pow(60, i);
	}
	return sec;
}