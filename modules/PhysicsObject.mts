import { Direction } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { World } from "./World.js";

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
			this.moveUnit("right", onCollision, world);
			this.remainder.x --;
		}
		while(this.remainder.x < 0) {
			this.moveUnit("left", onCollision, world);
			this.remainder.x ++;
		}
	}
	moveY(amount: number, onCollision: () => void, world: World) {
		this.remainder.y += amount;
		while(this.remainder.y >= 1) {
			this.moveUnit("down", onCollision, world);
			this.remainder.y --;
		}
		while(this.remainder.y < 0) {
			this.moveUnit("up", onCollision, world);
			this.remainder.y ++;
		}
	}
	moveUnit(direction: Direction, onCollision: () => void, world: World) {
		if(!this.canMove(direction, world)) {
			onCollision();
		}
		else {
			this.positionInt = this.positionInt.add(Vector.unit(direction));
		}
	}
	canMove(direction: Direction, world: World) {
		if(direction === "down" && this.isOnPlatform(world)) {
			return false;
		}

		const newBoundingBox = this.boundingBox().translate(Vector.unit(direction));
		return !world.isInSolid(newBoundingBox);
	}
	isOnPlatform(world: World) {
		const boundingBox = this.boundingBox();
		if(boundingBox.bottom() % World.TILE_SIZE !== 0) {
			return false;
		}
		const left = world.getTileX(boundingBox.left());
		const right = world.getTileX(boundingBox.right() - 1);
		for(let x = left; x <= right; x ++) {
			if(world.tiles.get(x, boundingBox.bottom() / World.TILE_SIZE) === "platform") {
				return true;
			}
		}
		return false;
	}

	boundingBox() {
		return this.dimensions.translate(this.positionInt);
	}

	update(world: World) {
		this.moveX(this.velocity.x, () => { this.velocity.x = 0; }, world);
		this.moveY(this.velocity.y, () => { this.velocity.y = 0; }, world);
	}
}
