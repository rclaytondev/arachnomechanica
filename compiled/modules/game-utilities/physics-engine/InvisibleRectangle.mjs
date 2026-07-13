import { Collideable } from "./Collideable.mjs";
import { RectangularCollideable } from "./RectangularCollideable.mjs";
export class InvisibleRectangle extends RectangularCollideable {
    constructor(hitbox) {
        super(hitbox);
    }
    render() { return []; }
    display() { }
    update() { }
    canPush(entity) {
        return entity instanceof Collideable;
    }
}
//# sourceMappingURL=InvisibleRectangle.mjs.map