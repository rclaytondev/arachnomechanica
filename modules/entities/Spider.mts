import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { Entity, TileWithPosition, World } from "../World";

export class Spider {
	physicsObject: PhysicsObject;
	attachment: Direction | Diagonal | null = null;
	movement: "clockwise" | "counterclockwise" = "clockwise";

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

	update(world: World) {
		this.move(SpiderData.SPEED, world);
	}
	move(amount: number, world: World) {
		const forward = this.forwardDirection();
		if(forward === null) { return; }
		this.physicsObject.move(
			Vector.unit(forward).multiply(amount),
			world,
			(dir, objects) => this.onCollision(dir, objects)
		);
	}
	onCollision(direction: Direction, collisions: (Entity | TileWithPosition)[]) {
		if(collisions.some(c => "tile" in c)) {
			this.attachment = this.movement === "clockwise" ? Directions.rotateCounterclockwise[this.attachment!] : Directions.rotateClockwise[this.attachment!];
		}
	}

	outwardNormalDirection() {
		if(this.attachment === null) { return null; }
		return Directions.opposite[this.attachment];
	}
	forwardDirection() {
		const outwardNormal = this.outwardNormalDirection();
		if(outwardNormal === null) { return null; }
		return this.movement === "clockwise" ? Directions.rotateClockwise[outwardNormal] : Directions.rotateCounterclockwise[outwardNormal];
	}
}
