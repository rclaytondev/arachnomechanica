import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { GameUtils } from "./GameUtils.mjs";

export type ParticleSettings = {
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
	glowSize?: number;
	glowIntensity?: number;
	grayscaleColorVariance?: number;
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
	glowSize: number;
	glowIntensity: number;
	glowGradient: CanvasGradient | null;

	constructor(position: Vector, velocity: Vector, settings: ParticleSettings) {
		this.position = position;
		this.velocity = velocity;

		this.size = settings.size;

		if(settings.colorVariance) {
			const red = settings.color.red + GameUtils.random(-settings.colorVariance, settings.colorVariance);
			const green = settings.color.green + GameUtils.random(-settings.colorVariance, settings.colorVariance);
			const blue = settings.color.blue + GameUtils.random(-settings.colorVariance, settings.colorVariance);
			this.color = `rgb(${red}, ${green}, ${blue})`;
		}
		else if(settings.grayscaleColorVariance) {
			const offset = GameUtils.random(-settings.grayscaleColorVariance, settings.grayscaleColorVariance);
			this.color = `rgb(${settings.color.red + offset}, ${settings.color.green + offset}, ${settings.color.blue + offset})`;
		}
		else {
			this.color = `rgb(${settings.color.red}, ${settings.color.green}, ${settings.color.blue})`;
		}

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
		this.glowSize = settings.glowSize ?? 0;
		this.glowIntensity = settings.glowIntensity ?? 1;
		this.glowGradient = GameUtils.glowCircleGradient(0, 0, this.glowSize, this.glowIntensity);
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.translate(this.position.x, this.position.y);
		canvasIO.ctx.rotate(this.rotation);
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.ctx.strokeStyle = this.color;
		canvasIO.ctx.globalAlpha = this.opacity;
		if(this.solid) {
			if(this.shape === "circle") {
				canvasIO.fillCircle(0, 0, this.size);
			}
			else {
				canvasIO.fillRegularPoly(new Vector(0, 0), this.size, this.shape);
			}
		}
		else {
			if(this.shape === "circle") {
				canvasIO.strokeCircle(0, 0, this.size);
			}
			else {
				canvasIO.strokeRegularPoly(new Vector(0, 0), this.size, this.shape);
			}
		}
		canvasIO.ctx.restore();
	}
	displayGlow(canvasIO: CanvasIO) {
		if(this.glowSize !== 0 && this.glowIntensity !== 0 && this.glowGradient !== null) {
			canvasIO.ctx.fillStyle = this.glowGradient;
			canvasIO.fillCircle(this.position.x, this.position.y, this.glowSize);
		}
	}

	update() {
		this.velocity = this.velocity.add(0, this.gravity);
		this.position = this.position.add(this.velocity);
		this.rotation += this.rotationalVelocity;
		this.size = Math.max(0, this.size - this.sizeDecay);
		this.opacity = Math.max(0, this.opacity - this.opacityDecay);
	}

	isDead() {
		return this.size <= 0 || this.opacity <= 0;
	}
}
