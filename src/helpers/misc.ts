export function clamp(val: number, min: number, max: number) {
	if (val < min) return min;
	if (val > max) return max;
	return val;
}

export function sleep(ms: number) {
	return new Promise<void>(res => setTimeout(res, ms));
}