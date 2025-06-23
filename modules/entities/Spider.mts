import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";

export class Spider {
	physicsObject: PhysicsObject;

	constructor(position: Vector) {
		this.physicsObject = new PhysicsObject(
			position.subtract(SpiderData.SIZE / 2, SpiderData.SIZE / 2).floor(),
			Rectangle.square(0, 0, SpiderData.SIZE)
		);
	}

	display(canvasIO: CanvasIO) {
		const position = this.physicsObject.hitbox().center();
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		canvasIO.fillRegularPoly(position, SpiderData.SIZE / 2, 6);
	}

	update() {

	}
}
