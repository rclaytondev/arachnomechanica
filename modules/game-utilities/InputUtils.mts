import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Debug } from "./Debug.mjs";

export class InputUtils {
	static pastKeys: { [ key: string ]: boolean } = {};
	static startedPressingKey(canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		return Object.keys(input).some(k => input[k] && !InputUtils.pastKeys[k]);
	}
}
