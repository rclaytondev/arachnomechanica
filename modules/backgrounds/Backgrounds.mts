import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Background } from "./Background.mjs";

export class Backgrounds {
	backgroundsList: Background[];

	constructor(backgroundsList: Background[]) {
		this.backgroundsList = backgroundsList;
	}

	display(canvasIO: CanvasIO, cameraPosition: Vector) {
		for(const background of this.backgroundsList.sort((a, b) => a.zIndex - b.zIndex)) {
			background.display(canvasIO, cameraPosition);
		}
	}
}
