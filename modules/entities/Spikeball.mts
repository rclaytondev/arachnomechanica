import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { World } from "../World";

export class Spikeball {
	static glowGradient = GameUtils.glowCircleGradient(
		0, 0, SpikeballData.GLOW_SIZE,
		SpikeballData.GLOW_INTENSITY,
		SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue
	);
	physicsObject: PhysicsObject;
	angle: number = 0;
	
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

		canvasIO.ctx.strokeStyle = `rgb(${SpikeballData.ACCENT_COLOR.red}, ${SpikeballData.ACCENT_COLOR.green}, ${SpikeballData.ACCENT_COLOR.blue}`;
		canvasIO.ctx.lineWidth = SpikeballData.ACCENT_THICKNESS;
		canvasIO.strokeCircle(center.x, center.y, SpikeballData.RADIUS * SpikeballData.ACCENT_RADIUS_MULTIPLIER);

		this.displaySpikes(canvasIO);
	}
	displaySpikes(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		for(let i = 0; i < SpikeballData.NUM_SPIKES; i ++) {
			const angle = this.angle + i * (2 * Math.PI / SpikeballData.NUM_SPIKES);
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angle);
			canvasIO.fillPoly(
				-SpikeballData.SPIKE_WIDTH, -SpikeballData.SPIKE_BASE,
				0, -SpikeballData.SPIKE_HEIGHT,
				SpikeballData.SPIKE_WIDTH, -SpikeballData.SPIKE_BASE,
			);
			canvasIO.ctx.restore();
		}
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		canvasIO.ctx.fillStyle = Spikeball.glowGradient;
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.fillCircle(0, 0, SpikeballData.GLOW_SIZE);
		canvasIO.ctx.restore();
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
		this.angle += SpikeballData.ROTATION_SPEED;
	}

	hitboxes() {
		return [this.physicsObject.hitbox()];
	}
}
