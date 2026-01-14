import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { World } from "../world/World.mjs";

export class Spider extends RectangularCollideable {
	display() { }
	update() { }

	static spawn(_position: Vector, _world: World): boolean {
		throw new Error("Unimplemented.");
	}
}
