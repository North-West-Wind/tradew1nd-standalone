export class StatusError extends Error {
	constructor(status: number) {
		super("Received HTTP Status: " + status);
	}
}