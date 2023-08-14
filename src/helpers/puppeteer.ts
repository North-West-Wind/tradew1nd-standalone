import pie from "puppeteer-in-electron";
import { getBrowser } from '../state';
import { BrowserWindow } from "electron";
import { Page } from "puppeteer-core";
let subWin: BrowserWindow, timeout: NodeJS.Timeout;

function getSubWindow() {
	if (!subWin) subWin = new BrowserWindow({ show: false });
	return subWin;
}

export async function run(cb: (page: Page) => any) {
	try {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		const page = await pie.getPage(getBrowser(), getSubWindow());
		const result = await cb(page);
		timeout = setTimeout(() => {
				subWin.close();
				subWin = undefined;
		}, 10000);
		return result;
	} catch (err) {
		return err;
	}
}