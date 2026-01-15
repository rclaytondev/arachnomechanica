import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { Tile } from "../tiles/Tile.mjs";
import { World } from "../world/World.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { Particle, ParticleSettings } from "./Particle.mjs";

export type FireSpawnerSettings = {
	maxHurtboxSize: number;
	hurtboxWidth: number;
	hurtboxOffset: number;
	particlesPerFrame: number;
	hurtboxSpeed: number;
	particleSpeed: number;
	particleSpeedVariance: number;
	particleCrossSpeedVariance: number;
	particleSettings: ParticleSettings;
};

export class FireSpawner {
	position: Vector;
	direction: Direction;

	timeLeft: number = 0;
	hurtboxSize: number = 0;

	maxHurtboxSize: number;
	hurtboxWidth: number;
	hurtboxOffset: number;
	particlesPerFrame: number;
	hurtboxSpeed: number;
	particleSpeed: number;
	particleSpeedVariance: number;
	particleCrossSpeedVariance: number;
	particleSettings: ParticleSettings;

	constructor(position: Vector, direction: Direction, settings: FireSpawnerSettings) {
		this.position = position;
		this.direction = direction;
		this.maxHurtboxSize = settings.maxHurtboxSize;
		this.hurtboxWidth = settings.hurtboxWidth;
		this.hurtboxOffset = settings.hurtboxOffset;
		this.particlesPerFrame = settings.particlesPerFrame;
		this.hurtboxSize = settings.hurtboxSpeed;
		this.hurtboxSpeed = settings.hurtboxSpeed;
		this.particleSpeed = settings.particleSpeed;
		this.particleSpeedVariance = settings.particleSpeedVariance;
		this.particleCrossSpeedVariance = settings.particleCrossSpeedVariance;
		this.particleSettings = settings.particleSettings;
	}

	update(world: World, canvasIO: CanvasIO) {
		this.timeLeft --;
		if(this.timeLeft > 0) {
			for(let i = 0; i < this.particlesPerFrame; i ++) {
				world.addParticle(this.generateFireParticle(), canvasIO);
			}
			this.hurtboxSize = Math.min(this.hurtboxSize + this.hurtboxSpeed, this.maxHurtboxSize);
		}
		else {
			this.hurtboxSize = 0;
		}
	}
	startFire(duration: number) {
		if(this.timeLeft < 0) {
			this.hurtboxSize = 0;
		}
		this.timeLeft = duration;
	}
	stopFire() {
		this.timeLeft = 0;
		this.hurtboxSize = 0;
	}

	generateFireParticleVelocity() {
		const speed = this.particleSpeed + GameUtils.random(-this.particleSpeedVariance, this.particleSpeedVariance);
		const crossSpeed = GameUtils.random(-this.particleCrossSpeedVariance, this.particleCrossSpeedVariance);
		if(Directions.isHorizontal(this.direction)) {
			return new Vector(
				speed * (this.direction === "left" ? -1 : 1),
				crossSpeed,
			);
		}
		else {
			return new Vector(
				crossSpeed,
				speed * (this.direction === "up" ? -1 : 1),
			);
		}
	}
	generateFireParticle() {
		return new Particle(this.position, this.generateFireParticleVelocity(), this.particleSettings);
	}


	hurtbox(size: number = this.hurtboxSize) {
		if(this.direction === "left") {
			return new Rectangle(
				this.position.x - size - this.hurtboxOffset, this.position.y - this.hurtboxWidth / 2,
				Math.max(0, size - this.hurtboxOffset), this.hurtboxWidth,
			);
		}
		else if(this.direction === "right") {
			return new Rectangle(
				this.position.x + this.hurtboxOffset, this.position.y - this.hurtboxWidth / 2,
				Math.max(0, size - this.hurtboxOffset), this.hurtboxWidth,
			);
		}
		else if(this.direction === "up") {
			return new Rectangle(
				this.position.x - this.hurtboxWidth / 2, this.position.y - size - this.hurtboxOffset,
				this.hurtboxWidth, Math.max(0, size - this.hurtboxOffset),
			);
		}
		else {
			return new Rectangle(
				this.position.x - this.hurtboxWidth / 2, this.position.y + this.hurtboxOffset,
				this.hurtboxWidth, Math.max(0,size - this.hurtboxOffset),
			);
		}
	}
	shouldDestroy(tile: Tile) {
		return !(
			(tile === Platform.PLATFORM && this.direction !== "down") ||
			(tile instanceof Gate && tile.openness >= 1)
		);
	}
	updateHurtbox(world: World, canvasIO: CanvasIO) {
		if(this.hurtboxSize === 0) { return; }
		const hurtbox = this.hurtbox();
		for(const { position, tile } of world.tiles.getTilesAt(hurtbox)) {
			if(this.shouldDestroy(tile)){
				world.destroyTile(position);
			}
		}
		world.damage(hurtbox, canvasIO);
	}
}
