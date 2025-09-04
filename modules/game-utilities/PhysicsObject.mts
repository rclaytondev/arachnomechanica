import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity, Tile, TileWithPosition, World } from "../world/World.js";

type MoveOptions = {
	collides?: (object: { x: number, y: number, tile: Tile } | Entity) => boolean,
	onCollision?: (direction: Direction, collisions: (Entity | TileWithPosition)[]) => void
};

export class PhysicsObject {
	positionInt: Vector;
	remainder: Vector;
	dimensions: Rectangle;
	velocity: Vector = new Vector(0, 0);

	constructor(positionInt: Vector, dimensions: Rectangle) {
		this.positionInt = positionInt.floor();
		this.remainder = positionInt.subtract(this.positionInt);
		this.dimensions = dimensions;
	}

	applyGravity(amount: number) {
		this.velocity.y += amount;
	}

	move(amount: Vector, world: World, options: MoveOptions) {
		this.moveX(amount.x, options, world);
		this.moveY(amount.y, options, world);
	}
	moveX(amount: number, options: MoveOptions, world: World, slopeMode: "stop" | "push" | "slide" = "stop") {
		this.remainder.x += amount;
		while(this.remainder.x >= 1) {
			const moved = this.moveUnit("right", options, world, slopeMode);
			this.remainder.x --;
			if(!moved) {
				this.remainder.x = 0;
				break;
			}
		}
		while(this.remainder.x < 0) {
			const moved = this.moveUnit("left", options, world, slopeMode);
			this.remainder.x ++;
			if(!moved) {
				this.remainder.x = 0;
				break;
			}
		}
	}
	moveY(amount: number, options: MoveOptions, world: World) {
		this.remainder.y += amount;
		while(this.remainder.y >= 1) {
			const moved = this.moveUnit("down", options, world);
			this.remainder.y --;
			if(!moved) {
				this.remainder.y = 0;
				break;
			}
		}
		while(this.remainder.y < 0) {
			const moved = this.moveUnit("up", options, world);
			this.remainder.y ++;
			if(!moved) {
				this.remainder.y = 0;
				break;
			}
		}
	}
	moveUnit(direction: Direction, options: MoveOptions, world: World, slopeMode: "stop" | "push" | "slide" = "stop") {
		const offset = this.slopeOffset(direction, world, slopeMode);
		const collidingObjects = this.collidingObjects(offset, world, options.collides ?? (() => true));
		if(collidingObjects.length === 0) {
			this.positionInt = this.positionInt.add(offset);
			return true;
		}
		else if(this.canMove(Vector.unit(direction), world, options.collides ?? (() => true))) {
			this.positionInt = this.positionInt.add(Vector.unit(direction));
			return true;
		}
		else {
			options.onCollision?.(direction, collidingObjects);
			return false;
		}
	}
	slopeOffset(direction: Direction, world: World, slopeMode: "stop" | "push" | "slide") {
		const offset = Vector.unit(direction);
		if(slopeMode === "stop") { return offset; }

		if(
			Directions.isHorizontal(direction)
			&& (slopeMode === "push" || slopeMode === "slide")
			&& world.onSlope(this.hitbox(), `slope-floor-${direction}`)
		) {
			return offset.add(0, -1);
		}

		const opposite = Directions.opposite[direction];
		if(
			Directions.isHorizontal(opposite)
			&& slopeMode === "slide"
			&& world.onSlope(this.hitbox(), `slope-floor-${opposite}`)
		) {
			return offset.add(0, 1);
		}
		return offset;
	}
	collidingObjects(direction: Direction | Vector, world: World, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean) {
		if(!(direction instanceof Vector)) {
			direction = Vector.unit(direction);
		}
		if(direction.y > 0) {
			const collidingPlatform = this.isOnPlatform(world);
			if(collidingPlatform) { return [collidingPlatform]; }
		}

		const newHitbox = this.hitbox().translate(direction);
		return [...world.collidingTiles(newHitbox, collides), ...world.collidingEntities(newHitbox, collides)];
	}
	canMove(direction: Direction | Vector, world: World, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean) {
		return this.collidingObjects(direction, world, collides).length === 0;
	}
	isOnPlatform(world: World): TileWithPosition | null {
		const hitbox = this.hitbox();
		if(hitbox.bottom() % WorldData.TILE_SIZE !== 0) {
			return null;
		}
		const left = world.getTileX(hitbox.left());
		const right = world.getTileX(hitbox.right() - 1);
		for(let x = left; x <= right; x ++) {
			if(world.tiles.get(x, hitbox.bottom() / WorldData.TILE_SIZE) === "platform") {
				return { x: x, y: hitbox.bottom() / WorldData.TILE_SIZE, tile: "platform" };
			}
		}
		return null;
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
