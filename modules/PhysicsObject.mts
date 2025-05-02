import { Direction } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { World } from "./World";

export class PhysicsObject {
	positionInt: Vector;
	remainder: Vector;
	dimensions: Rectangle;
	velocity: Vector = new Vector(0, 0);

	constructor(positionInt: Vector, dimensions: Rectangle) {
		this.positionInt = positionInt;
		this.remainder = new Vector(0, 0);
		this.dimensions = dimensions;
	}

	move(amount: Vector, world: World) {
		this.moveX(amount.x, () => {}, world);
		this.moveY(amount.y, () => {}, world);
	}
	moveX(amount: number, onCollision: () => void, world: World) {
		this.remainder.x += amount;
		while(this.remainder.x >= 1) {
			this.moveUnit("right", () => {}, world);
			this.remainder.x --;
		}
		while(this.remainder.x < 0) {
			this.moveUnit("left", () => {}, world);
			this.remainder.x ++;
		}
	}
	moveY(amount: number, onCollision: () => void, world: World) {
		this.remainder.y += amount;
		while(this.remainder.y >= 1) {
			this.moveUnit("down", () => {}, world);
			this.remainder.y --;
		}
		while(this.remainder.y < 0) {
			this.moveUnit("up", () => {}, world);
			this.remainder.y ++;
		}
	}
	moveUnit(direction: Direction, onCollision: () => void, world: World) {
		const newBoundingBox = this.boundingBox().translate(Vector.unit(direction));
		if(world.isInSolid(newBoundingBox)) {
			onCollision();
		}
		else {
			this.positionInt = this.positionInt.add(Vector.unit(direction));
		}
	}

	boundingBox() {
		return this.dimensions.translate(this.positionInt);
	}

	update(world: World) {
		this.move(this.velocity, world);
	}
}
