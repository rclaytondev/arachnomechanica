import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { HashSet } from "../../../utils-ts/modules/HashSet.mjs";
import { DEBUG_SETTINGS } from "../../constants/DebugSettings.mjs";
import { TileWithPosition } from "../../world/World.mjs";
import { DeathParticle } from "../DeathParticle.mjs";
import { Entity } from "../Entity.mjs";

import { CollisionEvent } from "./CollisionEvent.mjs";


export type MoveOptions = {
	collides?: (object: Collideable | TileWithPosition) => boolean,
	onCollision?: (collision: CollisionEvent) => void,
	moveRiders?: boolean,
	canMoveRider?: (object: Collideable) => boolean,
};
export type MoveUnitOptions = MoveOptions & {
	queryOnly?: boolean,
	movedObjects: Set<Collideable>,
};

export abstract class Collideable extends Entity {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	destroy(hurtbox: Rectangle) {
		this.world.entities.delete(this);
		const particle = DeathParticle.fromEntity(this);
		this.world.particles.add(particle, this.world);
	}
	damage(hurtbox: Rectangle) {
		this.destroy(hurtbox);
	}

	subpixel: Vector = new Vector(0, 0);
	abstract hitboxes(): Rectangle[];
	abstract translate(amount: Vector): void;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onCollision(collision: CollisionEvent) { }
	slideUpSlopes: boolean = true;
	slideDownSlopes: boolean = true;
	tangible: boolean = true;
	damageable: boolean = true;



	move(amount: Vector, options: MoveOptions) {
		this.subpixel = this.subpixel.add(amount);
		for(const axis of ["x", "y"] as const) {
			while(this.subpixel[axis] < 0) {
				const direction = (axis === "x") ? "left" : "up";
				const moved = this.moveUnit(direction, { ...options, movedObjects: new Set() });
				this.subpixel[axis] ++;
				if(!moved) {
					this.subpixel[axis] = 0;
					break;
				}
			}
			while(this.subpixel[axis] >= 1) {
				const direction = (axis === "x") ? "right" : "down";
				const moved = this.moveUnit(direction, { ...options, movedObjects: new Set() });
				this.subpixel[axis] --;
				if(!moved) {
					this.subpixel[axis] = 0;
					break;
				}
			}
		}
	}
	moveUnit(direction: Direction, options: MoveUnitOptions): boolean {
		if(Directions.isHorizontal(direction)) {
			const offsetY = this.slopeOffsetY(direction, this.slideUpSlopes, this.slideDownSlopes);
			if(offsetY === 1) {
				const moved = this.moveWithoutSlopes(direction, options);
				if(moved) {
					if(!options.queryOnly) {
						this.translateIfUnobstructed("down", options.collides ?? (() => true));
					}
					return true;
				}
			}
			else if(offsetY === -1) {
				const translated = this.translateIfUnobstructed("up", options.collides ?? (() => true));
				if(!translated) { return false; }
				const moved = this.moveWithoutSlopes(direction, options);
				if(!moved) {
					this.translateIfUnobstructed("down", options.collides ?? (() => true));
					return false;
				}
				if(options.queryOnly) {
					this.translateIfUnobstructed("down", options.collides ?? (() => true));
				}
				return true;
			}
		}
		return this.moveWithoutSlopes(direction, options);
	}
	private moveWithoutSlopes(direction: Direction, options: MoveUnitOptions): boolean {
		const collidingObjects = this.collidingObjects(direction, options.collides ?? (() => true));
		const unpushables = collidingObjects.filter(o => !(o instanceof Collideable) || (!this.canPush(o) && o.tangible));
		if(unpushables.length > 0) {
			if(!options.queryOnly) {
				this.callCollisionHandlers(direction, unpushables, false, options.onCollision ?? (() => {}));
			}
			return false;
		}

		const immovableUncrushables = (collidingObjects as Collideable[]).filter(c => !this.canCrush(c) && c.tangible && !c.canMove(direction));
		if(immovableUncrushables.length > 0) {
			if(!options.queryOnly) {
				this.callCollisionHandlers(direction, immovableUncrushables, false, options.onCollision ?? (() => {}));
			}
			return false;
		}

		if(this.tangible) {
			for(const pushable of collidingObjects as Collideable[]) {
				if(!options.movedObjects.has(pushable)) {
					pushable.moveUnit(direction, {
						onCollision: (collision: CollisionEvent) => {
							if(pushable.tangible && !collision.moveSuccessful) {
								for(const collidingHitbox of this.collidingHitboxes(pushable, Vector.unit(direction))) {
									pushable.destroy(collidingHitbox);
								}
							}
						},
						queryOnly: options.queryOnly,
						movedObjects: options.movedObjects,
					});
				}
			}
		}
		if(!options.queryOnly && !options.movedObjects.has(this)) {
			options.movedObjects.add(this);
			this.callCollisionHandlers(direction, collidingObjects, true, options.onCollision ?? (() => {}));
			this.translate(Vector.unit(direction));
			if(options.moveRiders ?? true) {
				this.moveRiders(direction, options);
			}
		}
		return true;
	}
	callCollisionHandlers(direction: Direction, objects: (Collideable | TileWithPosition)[], moveSuccessful: boolean, onCollision: (collision: CollisionEvent) => void) {
		for(const collidingObject of objects) {
			const collision = new CollisionEvent(this, collidingObject, direction, moveSuccessful);
			if(!(collidingObject instanceof Collideable) || collidingObject.tangible) {
				this.onCollision(collision);
				onCollision(collision);
			}
			if(collidingObject instanceof Collideable && this.tangible) {
				collidingObject.onCollision(collision);
			}
		}
	}
	slopeOffsetY(direction: "left" | "right", slideUpSlopes: boolean = false, slideDownSlopes: boolean = false) {
		const opposite = Directions.opposite[direction];
		if(slideUpSlopes && this.hitboxes().some(h => this.world.onSlope(h, `up-${opposite}`, "up"))) {
			return -1;
		}

		if(slideDownSlopes && this.hitboxes().some(h => this.world.onSlope(h, `up-${direction}`, "down"))) {
			return 1;
		}
		return 0;
	}
	collidingObjects(direction: Direction, collides: (object: Collideable | TileWithPosition) => boolean) {
		const hitboxes = this.hitboxes();
		const newHitboxes = hitboxes.map(h => h.translate(Vector.unit(direction)));
		const tiles = this.world.tiles.blockingMovement(this, direction, hitboxes, newHitboxes).filter(collides);
		const entities = newHitboxes.flatMap(h => [...this.world.entities.collideablesIntersecting(h, collides)]).filter(o => o !== this);
		return [...tiles, ...new Set(entities)];
	}
	collidingHitboxes(entity: Collideable, offset: Vector) {
		return this.hitboxes().map(h => h.translate(offset)).filter(h => entity.hitboxes().some(h2 => h.intersects(h2)));
	}
	canPush(_obj: Collideable) {
		return false;
	}
	canCrush(obj: Collideable) {
		return this.canPush(obj);
	}
	canMove(direction: Direction) {
		return this.moveUnit(direction, { queryOnly: true, movedObjects: new Set() });
	}
	intersects(entity: Collideable) {
		return this.intersectsRects(entity.hitboxes());
	}
	intersectsRects(rectangles: Rectangle[]) {
		return this.hitboxes().some(h => rectangles.some(r => h.interiorIntersects(r)));
	}
	translateIfUnobstructed(direction: Direction, collides: (e: Collideable | TileWithPosition) => boolean) {
		const obstructed = this.collidingObjects(direction, collides).length !== 0;
		if(!obstructed) {
			this.translate(Vector.unit(direction));
			return true;
		}
		return false;
	}

	isRiderOf(collideable: Collideable) {
		const hitboxes = this.hitboxes().map(h => h.translate(new Vector(0, 1)));
		const otherHitboxes = collideable.hitboxes();
		return hitboxes.some(h1 => otherHitboxes.some(h2 => h1.intersects(h2)));
	}
	getRiders(canMoveRider: (object: Collideable) => boolean) {
		const searchRegion = Rectangle.boundingBox(this.hitboxes()).extend("up", 2);
		const collideables = this.world.entities.collideablesIntersecting(searchRegion);
		return [...collideables].filter(c => c !== this && c.isRiderOf(this) && canMoveRider(c) && this.canPush(c));
	}
	moveRiders(direction: Direction, options: MoveUnitOptions) {
		for(const rider of this.getRiders(options.canMoveRider ?? (() => true))) {
			rider.moveUnit(direction, { movedObjects: options.movedObjects });
		}
	}

	displayHitboxes(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HITBOX_COLOR;
		for(const hitbox of this.hitboxes()) {
			canvasIO.strokeRect(hitbox);
		}
	}

	corners() {
		const hitboxes = this.hitboxes();
		const corners = hitboxes.flatMap(r => r.getCorners());
		const intersections = hitboxes.flatMap(r => hitboxes.flatMap(s => r.intersections(s)));
		return [...new HashSet([...corners, ...intersections])];
	}
}
