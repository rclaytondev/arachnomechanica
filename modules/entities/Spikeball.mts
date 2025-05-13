import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";

export class Spikeball {
	physicsObject: PhysicsObject = new PhysicsObject(
		new Vector(0, 0),
		new Rectangle(0, 0, SpikeballData.WIDTH, SpikeballData.HEIGHT)
	);

	display() {
		
	}

	hitboxes() {
		return [this.physicsObject.hitbox()];
	}
}
