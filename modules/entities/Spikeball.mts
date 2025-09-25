import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Tile, TileWithPosition, World } from "../world/World.js";
import { Entity } from "../game-utilities/Entity.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { RectangularCollideable } from "../game-utilities/Collideable.mjs";

export class Spikeball extends RectangularCollideable {
	velocity: Vector;
	angle: number = 0;
	age: number = 0;
	bounces: number = SpikeballData.BOUNCES;
	overlappingObjects: (Spikeball | Vector)[] = [];

	constructor(position: Vector, velocity: Vector) {
		super(new Rectangle(position.x, position.y, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS));
		this.velocity = velocity;
	}

	collides(object: { x: number, y: number, tile: Tile } | Entity) {
		if(object instanceof Spikeball) {
			return !this.overlappingObjects.includes(object);
		}
		else if("tile" in object) {
			return !this.overlappingObjects.some(o => o instanceof Vector && o.equals(object.x, object.y));
		}
		return true;
	}

	display(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.fillStyle = SpikeballData.COLOR;
		canvasIO.fillCircle(center.x, center.y, SpikeballData.RADIUS);

		canvasIO.ctx.strokeStyle = `rgb(${SpikeballData.ACCENT_COLOR.red}, ${SpikeballData.ACCENT_COLOR.green}, ${SpikeballData.ACCENT_COLOR.blue}`;
		canvasIO.ctx.lineWidth = SpikeballData.ACCENT_THICKNESS;
		canvasIO.strokeCircle(center.x, center.y, SpikeballData.RADIUS * SpikeballData.ACCENT_RADIUS_MULTIPLIER);

		this.displaySpikes(canvasIO);
	}
	displaySpikes(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
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
		const center = this.hitbox.center();
		canvasIO.ctx.save();
		canvasIO.ctx.globalAlpha = this.age / SpikeballData.GLOW_FADE_TIME;
		GameUtils.glowCircle(
			center.x, center.y,
			SpikeballData.GLOW_SIZE, SpikeballData.GLOW_INTENSITY,
			canvasIO,
			SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue,
		);
		canvasIO.ctx.restore();
	}

	onCollision(direction: Direction, collisions: (Entity | TileWithPosition)[], world: World) {
		if(collisions.includes(world.player)) {
			world.player.damage(this.hitbox, world);
		}
		this.bounces --;
		if(Directions.isHorizontal(direction)) {
			this.velocity.x *= -1;
		}
		else {
			this.velocity.y *= -1;
		}
	}
	update(world: World, canvasIO: CanvasIO) {
		this.move(this.velocity, world, {
			collides: (obj) => this.collides(obj),
			onCollision: (direction, collisions) => this.onCollision(direction, collisions, world),
		});
		world.entities.moveEntity(this);
		if(this.bounces < 0) {
			world.entities.removeEntity(this);
			this.die(world, canvasIO);
		}
		this.angle += SpikeballData.ROTATION_SPEED;
		this.age ++;
		if(this.age > (WorldData.TILE_SIZE - 2 * SpikeballData.RADIUS) / SpikeballData.SPEED) {
			this.overlappingObjects = this.overlappingObjects.filter(s => (
				(s instanceof Spikeball && s.intersects(this))
				|| (s instanceof Vector && this.hitbox.intersects(Rectangle.square(s.x, s.y, 1).scale(WorldData.TILE_SIZE)))
			));
		}
	}

	die(world: World, canvasIO: CanvasIO) {
		GameUtils.shatterParticles(
			(canvasIO: CanvasIO) => this.display(canvasIO),
			world,
			this.hitbox.center(),
			SpikeballData.SHATTER_PIECES,
			SpikeballData.SHATTER_PARTICLE_SPEED,
			canvasIO,
			SpikeballData.SHATTER_ANGLE_EVENNESS,
			SpikeballData.SHATTER_PARTICLE_SETTINGS,
		);
	}
}
