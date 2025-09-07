import { canvasIO, CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { PhysicsData, WorldData } from "../constants/GameData.mjs";
import { Tile, TileWithPosition, World } from "../world/World";

/* eslint @typescript-eslint/no-unused-vars: 0 */

type MoveOptions = {
	collides?: (object: { x: number, y: number, tile: Tile } | Entity) => boolean,
	onCollision?: (direction: Direction, collisions: (Entity | TileWithPosition)[]) => void,
	onMoveFail?: (direction: Direction, unpushables: (Entity | TileWithPosition)[]) => void,
	slideUpSlopes?: boolean,
	slideDownSlopes?: boolean,
	queryOnly?: boolean
};

export abstract class Entity {
	abstract display(canvasIO: CanvasIO, world: World): void;
	displayGlowEffect(canvasIO: CanvasIO) { }
	displayDebug(canvasIO: CanvasIO) { }

	abstract update(world: World, canvasIO: CanvasIO): void;
	damage(hurtbox: Rectangle, world: World, canvasIO: CanvasIO) {
		world.entities.removeEntity(this);
	}

	subpixel: Vector = new Vector(0, 0);
	abstract hitboxes(): Rectangle[];
	abstract boundingBox(): Rectangle;
	abstract translate(amount: Vector): void;



	move(amount: Vector, world: World, options: MoveOptions) {
		this.subpixel = this.subpixel.add(amount);
		for(const axis of ["x", "y"] as const) {
			while(this.subpixel[axis] < 0) {
				const direction = (axis === "x") ? "left" : "up";
				const moved = this.moveUnit(direction, world, options);
				this.subpixel[axis] ++;
				if(!moved) {
					this.subpixel[axis] = 0;
					break;
				}
			}
			while(this.subpixel[axis] >= 1) {
				const direction = (axis === "x") ? "right" : "down";
				const moved = this.moveUnit(direction, world, options);
				this.subpixel[axis] --;
				if(!moved) {
					this.subpixel[axis] = 0;
					break;
				}
			}
		}
	}
	moveUnit(direction: Direction, world: World, options: MoveOptions): boolean {
		if(Directions.isHorizontal(direction)) {
			const offsetY = this.slopeOffsetY(direction, world, options.slideUpSlopes, options.slideDownSlopes);
			if(offsetY !== 0) {
				const moved = this.moveDiagonal(direction, new Vector(Vector.unit(direction).x, offsetY), world, options);
				if(moved) { return true; }
			}
		}
		return this.moveOrthogonal(direction, world, options);
	}
	private moveDiagonal(originalDirection: "left" | "right", diagonal: Vector, world: World, options: MoveOptions): boolean {
		const collidingObjects = this.collidingObjects(diagonal, world, options.collides ?? (() => true));
		const translatedY = this.hitboxes().map(h => h.translate(new Vector(0, diagonal.y)));
		const pushables = collidingObjects.filter(
			o => this.canPush(o) && o.hitboxes().every(h => translatedY.every(h2 => !h.intersects(h2))),
		) as Entity[];
		if(pushables.length < collidingObjects.length) {
			return false;
		}
		for(const pushable of pushables) {
			pushable.moveUnit(originalDirection, world, { onMoveFail: () => {
				for(const collidingHitbox of this.collidingHitboxes(pushable, diagonal)) {
					pushable.damage(collidingHitbox, world, canvasIO!);
				}
			} });
		}
		if(collidingObjects.length !== 0) {
			options.onCollision?.(originalDirection, collidingObjects);
		}
		this.translate(diagonal);
		return true;
	}
	private moveOrthogonal(direction: Direction, world: World, options: MoveOptions): boolean {
		const collidingObjects = this.collidingObjects(Vector.unit(direction), world, options.collides ?? (() => true));
		if(collidingObjects.length !== 0) {
			options.onCollision?.(direction, collidingObjects);
		}
		const pushables = collidingObjects.filter(o => this.canPush(o));
		if(pushables.length < collidingObjects.length) {
			options.onMoveFail?.(direction, collidingObjects.filter(o => !this.canPush(o)));
			return false;
		}
		for(const pushable of pushables) {
			pushable.moveUnit(direction, world, { onMoveFail: () => {
				for(const collidingHitbox of this.collidingHitboxes(pushable, Vector.unit(direction))) {
					pushable.damage(collidingHitbox, world, canvasIO!);
				}
			} });
		}
		this.translate(Vector.unit(direction));
		return true;
	}
	slopeOffsetY(direction: "left" | "right", world: World, slideUpSlopes: boolean = false, slideDownSlopes: boolean = false) {
		if(slideUpSlopes && this.hitboxes().some(h => world.onSlope(h, `slope-floor-${direction}`))) {
			return -1;
		}

		const opposite = Directions.opposite[direction];
		if(slideDownSlopes && this.hitboxes().some(h => world.onSlope(h, `slope-floor-${opposite}`))) {
			return 1;
		}
		return 0;
	}
	collidingObjects(direction: Direction | Vector, world: World, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean) {
		if(!(direction instanceof Vector)) {
			direction = Vector.unit(direction);
		}
		const collidingPlatforms = (direction.y > 0) ? this.collidingPlatforms(world).filter(collides) : [];
		const newHitboxes = this.hitboxes().map(h => h.translate(direction));
		return [...collidingPlatforms, ...new Set(newHitboxes.flatMap(
			h => [...world.collidingTiles(h, collides), ...world.collidingEntities(h, collides)]),
		)];
	}
	collidingHitboxes(entity: Entity, offset: Vector) {
		return this.hitboxes().map(h => h.translate(offset)).filter(h => entity.hitboxes().some(h2 => h.intersects(h2)));
	}
	collidingPlatforms(world: World) {
		const hitboxes = this.hitboxes();
		const platforms: TileWithPosition[] = [];
		for(const hitbox of hitboxes.filter(h => h.bottom() % WorldData.TILE_SIZE === 0)) {
			const left = world.getTileX(hitbox.left());
			const right = world.getTileX(hitbox.right() - 1);
			for(let x = left; x <= right; x ++) {
				if(world.tiles.get(x, hitbox.bottom() / WorldData.TILE_SIZE) === "platform") {
					platforms.push({ x: x, y: hitbox.bottom() / WorldData.TILE_SIZE, tile: "platform" });
				}
			}
		}
		return platforms;
	}
	canPush(obj: Entity | TileWithPosition): obj is Entity {
		if(obj instanceof Entity) {
			return true; // TODO: add restrictions on what can push what
			// return PhysicsData.CAN_PUSH[this.entityType][obj.entityType];
		}
		return false;
	}
}
