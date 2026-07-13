import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, PlayerData, WorldData } from "../constants/GameData.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Player } from "../Player.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { ThrowableTile } from "./ThrowableTile.mjs";
export class ThrowableTileEntity extends RectangularCollideable {
    modifiers = [];
    velocity = new Vector(0, 0);
    gravity = PlayerData.GRAVITY;
    frictionX = ItemData.FRICTION_X;
    frictionY = 1;
    groundedFrictionX = ItemData.GROUNDED_FRICTION_X;
    constructor(position = new Vector(0, 0), modifiers) {
        super(Rectangle.square(position.x, position.y, WorldData.TILE_SIZE));
        this.gravity = ThrowableTileEntity.getGravity(modifiers);
        this.modifiers = modifiers;
        this.frictionY = Math.min(1, ...modifiers.map(m => m.frictionY ?? Infinity));
    }
    static getGravity(modifiers) {
        const values = new Set(modifiers.map(m => m.gravity));
        if (values.has("reverse")) {
            return -PlayerData.GRAVITY;
        }
        else if (values.has("none")) {
            return 0;
        }
        else {
            return PlayerData.GRAVITY;
        }
    }
    getItem() {
        return new ThrowableTile(this.modifiers);
    }
    update(world, canvasIO) {
        if (this.velocity.x !== 0) {
            this.velocity.x *= this.isGrounded(world) ? this.groundedFrictionX : this.frictionX;
        }
        this.velocity.y *= this.frictionY;
        this.velocity.y += this.gravity;
        this.move(this.velocity, world, canvasIO, {
            collides: (obj) => obj !== this,
        });
        for (const modifier of this.modifiers) {
            modifier.update(this, world, canvasIO);
        }
    }
    isGrounded(world) {
        return this.collidingObjects("down", world, () => true).length !== 0;
    }
    render() {
        return [new Renderable(this.display.bind(this), "tile-entity")];
    }
    display(canvasIO) {
        canvasIO.ctx.fillStyle = ItemData.BLOCK.COLOR;
        canvasIO.fillRect(this.hitbox);
        canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
        canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
        canvasIO.strokeSquare(this.hitbox.x + WorldData.TILE_ACCENT_INSET, this.hitbox.y + WorldData.TILE_ACCENT_INSET, 2 * WorldData.TILE_ACCENT_RADIUS);
        const center = this.hitbox.center();
        canvasIO.strokeCircle(center.x, center.y, WorldData.TILE_ACCENT_RADIUS - (WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_RADIUS));
    }
    onCollision(collision, world, canvasIO) {
        if (collision.movingObject === this) {
            if (Directions.isVertical(collision.direction)) {
                this.velocity.y = 0;
            }
            else {
                this.velocity.x = 0;
            }
        }
        for (const modifier of this.modifiers) {
            modifier.onCollision(this, collision, world, canvasIO);
        }
    }
    reset() {
        for (const modifier of this.modifiers) {
            modifier.reset();
        }
    }
    canPush(obj) {
        return obj instanceof Player;
    }
}
//# sourceMappingURL=ThrowableTileEntity.mjs.map