import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Camera } from "../world/Camera.mjs";
import { Background } from "./Background.mjs";

export class Backgrounds {
	backgroundsList: Background[];

	constructor(backgroundsList: Background[]) {
		this.backgroundsList = backgroundsList;
	}

	display(canvasIO: CanvasIO, camera: Camera) {
		for(const background of this.backgroundsList.sort((a, b) => a.zIndex - b.zIndex)) {
			background.display(canvasIO, camera);
		}
	}

	update() {
		for(const background of this.backgroundsList) {
			background.update();
		}
	}
}
