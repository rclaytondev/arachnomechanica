import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";

export class InputUtils {
	static pastKeys: { [ key: string ]: boolean } = {};
	static startedPressingKey(canvasIO: CanvasIO) {
		return Object.keys(canvasIO.keys).some(k => canvasIO.keys[k] && !InputUtils.pastKeys[k]);
	}
}
