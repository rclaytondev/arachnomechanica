import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, PlayerData } from "../../constants/GameData.mjs";
import { PhysicsObject } from "../../game-utilities/PhysicsObject.mjs";
import { World } from "../../world/World";

export class FlameturretEntity {
	physicsObject: PhysicsObject;

	constructor() {
		this.physicsObject = new PhysicsObject(
			new Vector(0, 0),
			Rectangle.square(0, 0, ItemData.FLAMETURRET.SIZE),
		);
		this.physicsObject.collides = (obj) => obj !== this;
	}

	display(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		canvasIO.ctx.fillStyle = "black";
		canvasIO.fillDiamond(center.x, center.y, ItemData.FLAMETURRET.SIZE / 2);
	}

	update(world: World) {
		this.physicsObject.velocity.x *= ItemData.FRICTION_X;
		this.physicsObject.applyGravity(PlayerData.GRAVITY);
		this.physicsObject.move(this.physicsObject.velocity, world);
		world.entities.moveEntity(this);
	}

	boundingBox() {
		return this.physicsObject.hitbox();
	}

	hitboxes() {
		return [this.boundingBox()];
	}
}
