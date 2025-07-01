import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { PortalData, RoomData, WorldData } from "../constants/GameData.mjs";
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
			this.addLine(world, canvasIO);
		}

		if(world.player.physicsObject.hitbox().intersects(this.teleportHitbox())) {
			// eslint-disable-next-line no-console
			console.log("Portal teleportation is currently unimplemented.");
		}
	}
	teleportHitbox() {
		return new Rectangle(
			this.position.x - PortalData.HITBOX_WIDTH / 2, this.position.y - PortalData.HITBOX_HEIGHT,
			PortalData.HITBOX_WIDTH, PortalData.HITBOX_HEIGHT,
		);
	}
	addLine(world: World, canvasIO: CanvasIO) {
		world.addParticle(new Particle(
			new Vector(
				this.position.x + GameUtils.random(-PortalData.LINE_SPAWN_WIDTH / 2, PortalData.LINE_SPAWN_WIDTH / 2),
				this.position.y,
			),
			new Vector(0, -PortalData.LINE_SPEED),
			PortalData.PARTICLE_SETTINGS,
		), canvasIO);
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PortalData.COLOR;
		canvasIO.ctx.fillRect(
			this.position.x - PortalData.WIDTH / 2, this.position.y - PortalData.BASE_HEIGHT,
			PortalData.WIDTH, PortalData.BASE_HEIGHT,
		);
	}

	reflect() {
		return new Portal(new Vector(RoomData.SIZE * WorldData.TILE_SIZE - this.position.x, this.position.y));
	}
	translate(offset: Vector) {
		return new Portal(this.position.add(offset));
	}
	copy() {
		return new Portal(this.position.clone());
	}

	distanceFrom(rectangle: Rectangle) {
		return rectangle.distanceTo(this.position);
	}
	boundingBox() {
		return new Rectangle(
			this.position.x - PortalData.WIDTH / 2,
			this.position.y - PortalData.HITBOX_HEIGHT,
			PortalData.WIDTH,
			PortalData.HITBOX_HEIGHT,
		);
	}
}
