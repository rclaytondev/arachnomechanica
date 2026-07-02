import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";

export class WorldBorder extends RectangularCollideable {
	damageable: boolean = false;

	constructor(hitbox: Rectangle) {
		super(hitbox);
	}

	render() { return []; }
	update() { }
}
