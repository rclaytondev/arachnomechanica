import { CanvasIO, canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { World, Tile, TileWithPosition } from "../world/World.mjs";
import { Entity } from "./Entity.mjs";

/* eslint @typescript-eslint/no-unused-vars: 0 */

type MoveOptions = {
	collides?: (object: { x: number, y: number, tile: Tile } | Entity) => boolean,
	onCollision?: (direction: Direction, collisions: (Collideable | TileWithPosition)[]) => void,
	onMoveFail?: (direction: Direction, unpushables: (Collideable | TileWithPosition)[]) => void,
	slideUpSlopes?: boolean,
	slideDownSlopes?: boolean
};
type MoveUnitOptions = MoveOptions & {
	queryOnly?: boolean
};

export abstract class Collideable extends Entity {
	damage(hurtbox: Rectangle, world: World, canvasIO: CanvasIO) {
		world.entities.removeEntity(this);
	}

	subpixel: Vector = new Vector(0, 0);
	abstract hitboxes(): Rectangle[];
	abstract translate(amount: Vector): void;
	onCollision(collider: Collideable | TileWithPosition, direction: Direction, world: World, canvasIO: CanvasIO) { }



	move(amount: Vector, world: World, canvasIO: CanvasIO, options: MoveOptions) {
		this.subpixel = this.subpixel.add(amount);
		for(const axis of ["x", "y"] as const) {
			while(this.subpixel[axis] < 0) {
				const direction = (axis === "x") ? "left" : "up";
				const moved = this.moveUnit(direction, world, canvasIO, options);
				this.subpixel[axis] ++;
				if(!moved) {
					this.subpixel[axis] = 0;
					break;
				}
			}
			while(this.subpixel[axis] >= 1) {
				const direction = (axis === "x") ? "right" : "down";
				const moved = this.moveUnit(direction, world, canvasIO, options);
				this.subpixel[axis] --;
				if(!moved) {
					this.subpixel[axis] = 0;
					break;
				}
			}
		}
	}
	moveUnit(direction: Direction, world: World, canvasIO: CanvasIO, options: MoveUnitOptions): boolean {
		if(Directions.isHorizontal(direction)) {
			const offsetY = this.slopeOffsetY(direction, world, options.slideUpSlopes, options.slideDownSlopes);
			if(offsetY !== 0) {
				const moved = this.moveDiagonal(direction, new Vector(Vector.unit(direction).x, offsetY), world, canvasIO, options);
				if(moved) { return true; }
			}
		}
		return this.moveOrthogonal(direction, world, options, canvasIO);
	}
	private moveDiagonal(originalDirection: "left" | "right", diagonal: Vector, world: World, canvasIO: CanvasIO, options: MoveUnitOptions): boolean {
		const collidingObjects = this.collidingObjects(diagonal, world, options.collides ?? (() => true));
		const translatedY = this.hitboxes().map(h => h.translate(new Vector(0, diagonal.y)));
		const pushables = collidingObjects.filter(
			o => this.canPush(o) && o.hitboxes().every(h => translatedY.every(h2 => !h.intersects(h2))),
		) as Collideable[];
		if(!options.queryOnly) {
			for(const collideable of collidingObjects) {
				if(collideable instanceof Collideable) {
					collideable.onCollision(this, Directions.opposite[originalDirection], world, canvasIO);
				}
				this.onCollision(collideable, originalDirection, world, canvasIO);
			}
		}
		if(pushables.length < collidingObjects.length) {
			return false;
		}
		for(const pushable of pushables) {
			pushable.moveUnit(originalDirection, world, canvasIO, {
				onMoveFail: () => {
					for(const collidingHitbox of this.collidingHitboxes(pushable, diagonal)) {
						pushable.damage(collidingHitbox, world, canvasIO!);
					}
				},
				queryOnly: options.queryOnly,
			});
		}
		if(collidingObjects.length !== 0) {
			options.onCollision?.(originalDirection, collidingObjects);
		}
		if(!options.queryOnly) {
			this.translate(diagonal);
		}
		return true;
	}
	private moveOrthogonal(direction: Direction, world: World, options: MoveUnitOptions, canvasIO: CanvasIO): boolean {
		const collidingObjects = this.collidingObjects(Vector.unit(direction), world, options.collides ?? (() => true));
		if(collidingObjects.length !== 0) {
			options.onCollision?.(direction, collidingObjects);
		}
		const pushables = collidingObjects.filter(o => this.canPush(o));
		if(!options.queryOnly) {
			for(const collideable of collidingObjects) {
				if(collideable instanceof Collideable) {
					collideable.onCollision(this, Directions.opposite[direction], world, canvasIO);
				}
				this.onCollision(collideable, direction, world, canvasIO);
			}
		}
		if(pushables.length < collidingObjects.length) {
			options.onMoveFail?.(direction, collidingObjects.filter(o => !this.canPush(o)));
			return false;
		}
		for(const pushable of pushables) {
			pushable.moveUnit(direction, world, canvasIO, {
				onMoveFail: () => {
					for(const collidingHitbox of this.collidingHitboxes(pushable, Vector.unit(direction))) {
						pushable.damage(collidingHitbox, world, canvasIO!);
					}
				},
				queryOnly: options.queryOnly,
			});
		}
		if(!options.queryOnly) {
			this.translate(Vector.unit(direction));
		}
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
			h => [
				...world.collidingTiles(h, collides),
				...[...world.entities.collideablesIntersecting(h, collides)].filter(o => o !== this),
			]),
		)];
	}
	collidingHitboxes(entity: Collideable, offset: Vector) {
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
	canPush(obj: Collideable | TileWithPosition): obj is Collideable {
		if(obj instanceof Entity) {
			return false; // TODO: add restrictions on what can push what
			// return PhysicsData.CAN_PUSH[this.entityType][obj.entityType];
		}
		return false;
	}
	canMove(direction: Direction, world: World, canvasIO: CanvasIO) {
		return this.moveUnit(direction, world, canvasIO, { queryOnly: true });
	}
	intersects(entity: Collideable) {
		const hitboxes1 = this.hitboxes();
		const hitboxes2 = entity.hitboxes();
		return hitboxes1.some(h1 => hitboxes2.some(h2 => h1.intersects(h2)));
	}
}


export abstract class RectangularCollideable extends Collideable {
	hitbox: Rectangle;

	constructor(hitbox: Rectangle) {
		super();
		const corner = hitbox.getCorner("top-left");
		this.hitbox = new Rectangle(
			Math.floor(hitbox.x), Math.floor(hitbox.y),
			hitbox.width, hitbox.height,
		);
		this.subpixel = corner.subtract(corner.floor());
	}

	hitboxes() {
		return [this.hitbox];
	}
	boundingBox() {
		return this.hitbox;
	}
	translate(amount: Vector): void {
		this.hitbox.x += amount.x;
		this.hitbox.y += amount.y;
	}

	extend(amount: number, direction: Direction, world: World, canvasIO: CanvasIO, options: MoveUnitOptions) {
		if(amount < 0) {
			this.hitbox = this.hitbox.extend(direction, Math.floor(amount));
		}
		for(let i = 0; i < amount; i ++) {
			const moved = this.moveUnit(direction, world, canvasIO, options);
			if(moved) {
				this.hitbox = this.hitbox.extend(Directions.opposite[direction], 1);
			}
		}
	}
}


export class InvisibleRectangle extends RectangularCollideable {
	constructor(hitbox: Rectangle) {
		super(hitbox);
	}

	display() {}
	update() {}

	canPush(entity: Collideable | TileWithPosition): entity is Collideable {
		return entity instanceof Collideable;
	}
}
