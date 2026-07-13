import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { HashSet } from "../../../utils-ts/modules/HashSet.mjs";
import { DEBUG_SETTINGS } from "../../constants/DebugSettings.mjs";
import { Entity } from "../Entity.mjs";
import { CollisionEvent } from "./CollisionEvent.mjs";
export class Collideable extends Entity {
    damage(hurtbox, world, canvasIO) {
        world.entities.delete(this);
    }
    subpixel = new Vector(0, 0);
    onCollision(collision, world, canvasIO) { }
    slideUpSlopes = true;
    slideDownSlopes = true;
    tangible = true;
    damageable = true;
    move(amount, world, canvasIO, options) {
        this.subpixel = this.subpixel.add(amount);
        for (const axis of ["x", "y"]) {
            while (this.subpixel[axis] < 0) {
                const direction = (axis === "x") ? "left" : "up";
                const moved = this.moveUnit(direction, world, canvasIO, options);
                this.subpixel[axis]++;
                if (!moved) {
                    this.subpixel[axis] = 0;
                    break;
                }
            }
            while (this.subpixel[axis] >= 1) {
                const direction = (axis === "x") ? "right" : "down";
                const moved = this.moveUnit(direction, world, canvasIO, options);
                this.subpixel[axis]--;
                if (!moved) {
                    this.subpixel[axis] = 0;
                    break;
                }
            }
        }
    }
    moveUnit(direction, world, canvasIO, options) {
        if (Directions.isHorizontal(direction)) {
            const offsetY = this.slopeOffsetY(direction, world, this.slideUpSlopes, this.slideDownSlopes);
            if (offsetY === 1) {
                const moved = this.moveWithoutSlopes(direction, world, options, canvasIO);
                if (moved) {
                    this.translateIfUnobstructed("down", options.collides ?? (() => true), world);
                    return true;
                }
            }
            else if (offsetY === -1) {
                const translated = this.translateIfUnobstructed("up", options.collides ?? (() => true), world);
                if (!translated) {
                    return false;
                }
                const moved = this.moveWithoutSlopes(direction, world, options, canvasIO);
                if (!moved) {
                    this.translateIfUnobstructed("down", options.collides ?? (() => true), world);
                    return false;
                }
                return true;
            }
        }
        return this.moveWithoutSlopes(direction, world, options, canvasIO);
    }
    moveWithoutSlopes(direction, world, options, canvasIO) {
        const collidingObjects = this.collidingObjects(direction, world, options.collides ?? (() => true));
        const unpushables = collidingObjects.filter(o => !(o instanceof Collideable) || (!this.canPush(o) && o.tangible));
        if (unpushables.length > 0) {
            if (!options.queryOnly) {
                this.callCollisionHandlers(direction, unpushables, false, options.onCollision ?? (() => { }), world, canvasIO);
            }
            return false;
        }
        const immovableUncrushables = collidingObjects.filter(c => !this.canCrush(c) && c.tangible && !c.canMove(direction, world, canvasIO));
        if (immovableUncrushables.length > 0) {
            if (!options.queryOnly) {
                this.callCollisionHandlers(direction, immovableUncrushables, false, options.onCollision ?? (() => { }), world, canvasIO);
            }
            return false;
        }
        if (this.tangible) {
            for (const pushable of collidingObjects) {
                pushable.moveUnit(direction, world, canvasIO, {
                    onCollision: (collision) => {
                        if (pushable.tangible && !collision.moveSuccessful) {
                            for (const collidingHitbox of this.collidingHitboxes(pushable, Vector.unit(direction))) {
                                pushable.damage(collidingHitbox, world, canvasIO);
                            }
                        }
                    },
                    queryOnly: options.queryOnly,
                });
            }
        }
        if (!options.queryOnly) {
            this.callCollisionHandlers(direction, collidingObjects, true, options.onCollision ?? (() => { }), world, canvasIO);
            this.translate(Vector.unit(direction), world);
            if (options.moveRiders ?? true) {
                this.moveRiders(direction, world, canvasIO, options);
            }
        }
        return true;
    }
    callCollisionHandlers(direction, objects, moveSuccessful, onCollision, world, canvasIO) {
        for (const collidingObject of objects) {
            const collision = new CollisionEvent(this, collidingObject, direction, moveSuccessful);
            if (!(collidingObject instanceof Collideable) || collidingObject.tangible) {
                this.onCollision(collision, world, canvasIO);
                onCollision(collision, world, canvasIO);
            }
            if (collidingObject instanceof Collideable && this.tangible) {
                collidingObject.onCollision(collision, world, canvasIO);
            }
        }
    }
    slopeOffsetY(direction, world, slideUpSlopes = false, slideDownSlopes = false) {
        if (slideUpSlopes && this.hitboxes().some(h => world.onSlope(h, `slope-floor-${direction}`, "up"))) {
            return -1;
        }
        const opposite = Directions.opposite[direction];
        if (slideDownSlopes && this.hitboxes().some(h => world.onSlope(h, `slope-floor-${opposite}`, "down"))) {
            return 1;
        }
        return 0;
    }
    collidingObjects(direction, world, collides) {
        const hitboxes = this.hitboxes();
        const newHitboxes = hitboxes.map(h => h.translate(Vector.unit(direction)));
        const tiles = world.tiles.blockingMovement(this, direction, hitboxes, newHitboxes).filter(collides);
        const entities = newHitboxes.flatMap(h => [...world.entities.collideablesIntersecting(h, collides)]).filter(o => o !== this);
        return [...tiles, ...new Set(entities)];
    }
    collidingHitboxes(entity, offset) {
        return this.hitboxes().map(h => h.translate(offset)).filter(h => entity.hitboxes().some(h2 => h.intersects(h2)));
    }
    canPush(obj) {
        if (obj instanceof Entity) {
            return false; // TODO: add restrictions on what can push what
            // return PhysicsData.CAN_PUSH[this.entityType][obj.entityType];
        }
        return false;
    }
    canCrush(obj) {
        return this.canPush(obj);
    }
    canMove(direction, world, canvasIO) {
        return this.moveUnit(direction, world, canvasIO, { queryOnly: true });
    }
    intersects(entity) {
        return this.intersectsRects(entity.hitboxes());
    }
    intersectsRects(rectangles) {
        return this.hitboxes().some(h => rectangles.some(r => h.interiorIntersects(r)));
    }
    translateIfUnobstructed(direction, collides, world) {
        const obstructed = this.collidingObjects(direction, world, collides).length !== 0;
        if (!obstructed) {
            this.translate(Vector.unit(direction), world);
            return true;
        }
        return false;
    }
    isRiderOf(collideable) {
        const hitboxes = this.hitboxes().map(h => h.translate(new Vector(0, 1)));
        const otherHitboxes = collideable.hitboxes();
        return hitboxes.some(h1 => otherHitboxes.some(h2 => h1.intersects(h2)));
    }
    getRiders(world, canMoveRider) {
        const searchRegion = Rectangle.boundingBox(this.hitboxes()).extend("up", 2);
        const collideables = world.entities.collideablesIntersecting(searchRegion);
        return [...collideables].filter(c => c !== this && c.isRiderOf(this) && canMoveRider(c) && this.canPush(c));
    }
    moveRiders(direction, world, canvasIO, options) {
        for (const rider of this.getRiders(world, options.canMoveRider ?? (() => true))) {
            rider.moveUnit(direction, world, canvasIO, {});
        }
    }
    displayHitboxes(canvasIO) {
        canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HITBOX_COLOR;
        for (const hitbox of this.hitboxes()) {
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
//# sourceMappingURL=Collideable.mjs.map