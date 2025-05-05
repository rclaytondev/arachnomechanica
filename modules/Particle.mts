import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { GameUtils } from "./GameUtils.mjs";

type ParticleSettings = {
	color: { red: number, green: number, blue: number };
	size: number;
	
	opacity?: number;
	opacityDecay?: number;
	shape?: "circle" | number;
	gravity?: number;
	sizeDecay?: number;
	maxRotationalVelocity?: number;
	minRotationalVelocity?: number;
	rotation?: number;
	colorVariance?: number;
	solid?: boolean;
};

export class Particle {
	position: Vector;
	velocity: Vector;

	size: number;
	color: string;

	opacity: number;
	opacityDecay: number;
	shape: "circle" | number;
	gravity: number;
	sizeDecay: number;
	rotationalVelocity: number;
	rotation: number;
	solid: boolean;

	constructor(position: Vector, velocity: Vector, settings: ParticleSettings) {
		this.position = position;
		this.velocity = velocity;

		this.size = settings.size;

		const red = settings.color.red + GameUtils.random(-(settings.colorVariance ?? 0), settings.colorVariance ?? 0);
		const green = settings.color.green + GameUtils.random(-(settings.colorVariance ?? 0), settings.colorVariance ?? 0);
		const blue = settings.color.blue + GameUtils.random(-(settings.colorVariance ?? 0), settings.colorVariance ?? 0);
		this.color = `rgb(${red}, ${green}, ${blue})`;

		this.opacity = settings.opacity ?? 1;
		this.opacityDecay = settings.opacityDecay ?? 1/20;
		this.shape = settings.shape ?? "circle";
		this.gravity = settings.gravity ?? 0;
		this.sizeDecay = settings.sizeDecay ?? 0;
		this.rotationalVelocity = GameUtils.random(
			settings.minRotationalVelocity ?? 0,
			settings.maxRotationalVelocity ?? settings.minRotationalVelocity ?? 0
		);
		this.rotation = settings.rotation ?? GameUtils.random(0, 2 * Math.PI);
		this.solid = settings.solid ?? true;
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.ctx.strokeStyle = this.color;
		canvasIO.ctx.globalAlpha = this.opacity;
		if(this.solid) {
			if(this.shape === "circle") {
				canvasIO.fillCircle(this.position.x, this.position.y, this.size);
			}
			else {
				canvasIO.fillRegularPoly(this.position, this.size, this.shape);
			}
		}
		else {
			if(this.shape === "circle") {
				canvasIO.strokeCircle(this.position.x, this.position.y, this.size);
			}
			else {
				canvasIO.strokeRegularPoly(this.position, this.size, this.shape);
			}
		}
		canvasIO.ctx.restore();
	}

	update() {
		this.velocity = this.velocity.add(0, this.gravity);
		this.position = this.position.add(this.velocity);
		this.size = Math.max(0, this.size - this.sizeDecay);
		this.opacity = Math.max(0, this.opacity - this.opacityDecay);
	}

	isDead() {
		return this.size <= 0 || this.opacity <= 0;
	}
}
