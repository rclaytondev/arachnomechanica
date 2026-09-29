import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { RectangularCollideable } from "../../game-engine/collisions/RectangularCollideable.mjs";
import { World } from "../../game-engine/world/World.mjs";

export class WorldBorder extends RectangularCollideable {
	damageable: boolean = false;

	constructor(hitbox: Rectangle, world: World) {
		super(hitbox, world);
	}

	render() { return []; }
	display() { }
	update() { }
}
