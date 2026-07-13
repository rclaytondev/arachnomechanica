import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
export class WorldBorder extends RectangularCollideable {
    damageable = false;
    constructor(hitbox) {
        super(hitbox);
    }
    render() { return []; }
    update() { }
}
//# sourceMappingURL=WorldBorder.mjs.map