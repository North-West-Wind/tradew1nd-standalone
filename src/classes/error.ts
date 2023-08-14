export class StatusError extends Error {
	constructor(status: number) {
		super("Received HTTP Status: " + status);
	}
}

export class ActualError extends Error {
	isActualError = true;
}