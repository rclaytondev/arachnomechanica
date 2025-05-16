import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { Entity, Tile, World } from "../World";

export class Spikeball {
	static glowGradient = GameUtils.glowCircleGradient(
		0, 0, SpikeballData.GLOW_SIZE,
		SpikeballData.GLOW_INTENSITY,
		SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue
	);
	physicsObject: PhysicsObject;
	angle: number = 0;
	ignoredTiles: Vector[] = [];
	age: number = 0;
	bounces: number = SpikeballData.BOUNCES;
	dead: boolean = false;
	
	constructor(position: Vector, velocity: Vector) {
		this.physicsObject = new PhysicsObject(
			position,
			new Rectangle(0, 0, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS)
		);
		this.physicsObject.velocity = velocity;
		this.physicsObject.collides = (object) => this.collides(object);
	}

	collides(object: { x: number, y: number, tile: Tile } | Entity) {
		if(object instanceof Spikeball) {
			return (
				Math.sign(object.physicsObject.velocity.x - this.physicsObject.velocity.x) !== Math.sign(object.physicsObject.velocity.x - this.physicsObject.velocity.x)
				|| Math.sign(object.physicsObject.velocity.y - this.physicsObject.velocity.y) !== Math.sign(object.physicsObject.velocity.y - this.physicsObject.velocity.y)
			);
		}
		else if("tile" in object && this.age < Math.sqrt(2) * WorldData.TILE_SIZE / 2 / SpikeballData.SPEED + 1) {
			return !this.ignoredTiles.some(t => t.equals(object.x, object.y));
		}
		return true;
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
		canvasIO.ctx.globalAlpha = this.age / SpikeballData.GLOW_FADE_TIME;
		canvasIO.fillCircle(0, 0, SpikeballData.GLOW_SIZE);
		canvasIO.ctx.restore();
	}

	update(world: World, canvasIO: CanvasIO) {
		this.physicsObject.moveX(
			this.physicsObject.velocity.x,
			() => {
				this.bounces --;
				this.physicsObject.velocity.x = -this.physicsObject.velocity.x;
			},
			world
		);
		this.physicsObject.moveY(
			this.physicsObject.velocity.y,
			() => {
				this.bounces --;
				this.physicsObject.velocity.y = -this.physicsObject.velocity.y;
			},
			world
		);
		if(this.bounces < 0) {
			this.dead = true;
			this.die(world, canvasIO);
		}
		this.angle += SpikeballData.ROTATION_SPEED;
		if(this.hurtbox().intersects(world.player.physicsObject.hitbox())) {
			world.player.damage();
		}
		this.age ++;
	}

	die(world: World, canvasIO: CanvasIO) {
		GameUtils.shatterParticles(
			(canvasIO: CanvasIO) => this.display(canvasIO),
			world,
			this.physicsObject.hitbox().center(),
			SpikeballData.SHATTER_PIECES,
			SpikeballData.SHATTER_PARTICLE_SPEED,
			canvasIO,
			SpikeballData.SHATTER_ANGLE_EVENNESS,
			SpikeballData.SHATTER_PARTICLE_SETTINGS
		);
	}

	hurtbox() {
		const center = this.physicsObject.hitbox().center();
		return new Rectangle(
			center.x - SpikeballData.HURTBOX_SIZE / 2, center.y - SpikeballData.HURTBOX_SIZE /  2,
			SpikeballData.HURTBOX_SIZE, SpikeballData.HURTBOX_SIZE
		);
	}
	hitboxes() {
		return [this.physicsObject.hitbox()];
	}
}
