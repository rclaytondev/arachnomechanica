import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Collideable } from "./Collideable.mjs";
export class RectangularCollideable extends Collideable {
    hitbox;
    constructor(hitbox) {
        super();
        this.hitbox = hitbox;
        if (Number.isFinite(hitbox.left)) {
            this.subpixel.x = hitbox.left - Math.floor(hitbox.left);
            hitbox.x = Math.floor(hitbox.x);
        }
        if (Number.isFinite(hitbox.top)) {
            this.subpixel.y = hitbox.top - Math.floor(hitbox.top);
            hitbox.y = Math.floor(hitbox.y);
        }
    }
    hitboxes() {
        return [this.hitbox];
    }
    boundingBox() {
        return this.hitbox;
    }
    translate(amount, world) {
        this.hitbox.x += amount.x;
        this.hitbox.y += amount.y;
        world.entities.updatePosition(this);
    }
    extend(amount, direction, world, canvasIO, options) {
        if (amount < 0) {
            this.hitbox = this.hitbox.extend(direction, Math.floor(amount));
        }
        for (let i = 0; i < amount; i++) {
            const moved = this.moveUnit(direction, world, canvasIO, options);
            if (moved) {
                this.hitbox = this.hitbox.extend(Directions.opposite[direction], 1);
            }
        }
    }
}
//# sourceMappingURL=RectangularCollideable.mjs.map