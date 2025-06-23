import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData } from "../constants/GameData.mjs";

export class Spider {
	position: Vector;

	constructor(position: Vector) {
		this.position = position;
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		canvasIO.fillRegularPoly(this.position, SpiderData.SIZE / 2, 6);
	}

	update() {

	}
}
