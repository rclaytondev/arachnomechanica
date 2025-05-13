import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { World } from "../World";

export class Spikeball {
	physicsObject: PhysicsObject;
	
	constructor(position: Vector, velocity: Vector) {
		this.physicsObject = new PhysicsObject(
			position,
			new Rectangle(0, 0, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS)
		);
		this.physicsObject.velocity = velocity;
		this.physicsObject.collides = (entity) => entity !== this;
	}

	display(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		canvasIO.ctx.fillStyle = SpikeballData.COLOR;
		canvasIO.fillCircle(center.x, center.y, SpikeballData.RADIUS);
	}
	displayGlowEffect() {

	}

	update(world: World) {
		this.physicsObject.moveX(
			this.physicsObject.velocity.x,
			() => { this.physicsObject.velocity.x = -this.physicsObject.velocity.x; },
			world
		);
		this.physicsObject.moveY(
			this.physicsObject.velocity.y,
			() => {
				this.physicsObject.velocity.y = -this.physicsObject.velocity.y;
			},
			world
		);
	}

	hitboxes() {
		return [this.physicsObject.hitbox()];
	}
}
