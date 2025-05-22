import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity, Tile, World } from "../World.js";

export class PhysicsObject {
	positionInt: Vector;
	remainder: Vector;
	dimensions: Rectangle;
	velocity: Vector = new Vector(0, 0);
	collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true;

	constructor(positionInt: Vector, dimensions: Rectangle) {
		this.positionInt = positionInt;
		this.remainder = new Vector(0, 0);
		this.dimensions = dimensions;
	}

	applyGravity(amount: number) {
		this.velocity.y += amount;
	}

	move(amount: Vector, world: World, oncollision: (direction: Direction) => void = () => {}) {
		this.moveX(amount.x, oncollision, world);
		this.moveY(amount.y, oncollision, world);
	}
	moveX(amount: number, onCollision: (direction: Direction) => void, world: World) {
		this.remainder.x += amount;
		while(this.remainder.x >= 1) {
			const moved = this.moveUnit("right", onCollision, world);
			this.remainder.x --;
			if(!moved) {
				this.remainder.x = 0;
				break;
			}
		}
		while(this.remainder.x < 0) {
			const moved = this.moveUnit("left", onCollision, world);
			this.remainder.x ++;
			if(!moved) {
				this.remainder.x = 0;
				break;
			}
		}
	}
	moveY(amount: number, onCollision: (direction: Direction) => void, world: World) {
		this.remainder.y += amount;
		while(this.remainder.y >= 1) {
			const moved = this.moveUnit("down", onCollision, world);
			this.remainder.y --;
			if(!moved) {
				this.remainder.y = 0;
				break;
			}
		}
		while(this.remainder.y < 0) {
			const moved = this.moveUnit("up", onCollision, world);
			this.remainder.y ++;
			if(!moved) {
				this.remainder.y = 0;
				break;
			}
		}
	}
	moveUnit(direction: Direction, onCollision: (direction: Direction) => void, world: World) {
		if(!this.canMove(direction, world)) {
			onCollision(direction);
			return false;
		}
		else {
			this.positionInt = this.positionInt.add(Vector.unit(direction));
			return true;
		}
	}
	canMove(direction: Direction, world: World) {
		if(direction === "down" && this.isOnPlatform(world)) {
			return false;
		}

		const newHitbox = this.hitbox().translate(Vector.unit(direction));
		return !world.isInSolid(newHitbox, this.collides);
	}
	isOnPlatform(world: World) {
		const hitbox = this.hitbox();
		if(hitbox.bottom() % WorldData.TILE_SIZE !== 0) {
			return false;
		}
		const left = world.getTileX(hitbox.left());
		const right = world.getTileX(hitbox.right() - 1);
		for(let x = left; x <= right; x ++) {
			if(world.tiles.get(x, hitbox.bottom() / WorldData.TILE_SIZE) === "platform") {
				return true;
			}
		}
		return false;
	}

	hitbox() {
		return this.dimensions.translate(this.positionInt);
	}

	positionFloat() {
		return this.positionInt.add(this.remainder);
	}
	centerFloat() {
		return this.positionFloat().add(this.dimensions.width / 2, this.dimensions.height / 2);
	}
	setPosition(position: Vector) {
		this.positionInt = position.floor();
		this.remainder = position.subtract(this.positionInt);
	}
	setCenter(position: Vector) {
		this.setPosition(position.subtract(this.dimensions.width / 2, this.dimensions.height / 2));
	}
}
