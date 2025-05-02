import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { PhysicsObject } from "./PhysicsObject.mjs";
import { World } from "./World.js";

export class Player {
	static COLOR = "rgb(0, 128, 0)"; // temporary

	static GRAVITY = 0.5;
	static HORIZONTAL_ACCELERATION = 0.5;

	physicsObject: PhysicsObject = new PhysicsObject(
		new Vector(0, 0), 
		new Rectangle(0, 0, World.TILE_SIZE * 0.9, World.TILE_SIZE * 0.9)
	);

	constructor() {
		
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = Player.COLOR;
		canvasIO.fillRect(this.physicsObject.boundingBox());
	}

	update(world: World, canvasIO: CanvasIO) {
		this.checkInputs(canvasIO);
		this.physicsObject.velocity = this.physicsObject.velocity.add(new Vector(0, Player.GRAVITY));
		this.physicsObject.update(world);
	}
	checkInputs(canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowRight && !canvasIO.keys.ArrowLeft) {
			this.physicsObject.velocity.x += Player.HORIZONTAL_ACCELERATION;
		}
		if(canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) {
			this.physicsObject.velocity.x -= Player.HORIZONTAL_ACCELERATION;
		}
	}
}
