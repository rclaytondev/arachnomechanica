import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { PortalData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { frameCount } from "../Main.js";
import { World } from "../World";

export class Portal {
	position: Vector;

	constructor(position: Vector) {
		this.position = position;
	}

	update(world: World, canvasIO: CanvasIO) {
		if(frameCount % PortalData.FRAMES_PER_LINE === 0) {
			this.addLine(world);
		}
	}
	addLine(world: World) {
		world.particles.push(new Particle(
			new Vector(
				this.position.x + GameUtils.random(-PortalData.LINE_SPAWN_WIDTH / 2, PortalData.LINE_SPAWN_WIDTH / 2),
				this.position.y
			),
			new Vector(0, -PortalData.LINE_SPEED),
			PortalData.PARTICLE_SETTINGS
		));
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PortalData.COLOR;
		canvasIO.ctx.fillRect(
			this.position.x - PortalData.WIDTH / 2, this.position.y - PortalData.BASE_HEIGHT,
			PortalData.WIDTH, PortalData.BASE_HEIGHT
		);
	}
}
