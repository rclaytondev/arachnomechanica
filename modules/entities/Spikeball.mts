import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { SpikeballBlock } from "./SpikeballBlock.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Player } from "../Player.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";

export class Spikeball extends RectangularCollideable {
	velocity: Vector;
	age: number = 0;
	bounces: number = SpikeballData.BOUNCES;
	overlappingObjects: (Spikeball | SpikeballBlock | Vector)[] = [];
	lastCollisionFrame: number = -1;

	constructor(position: Vector, velocity: Vector) {
		super(new Rectangle(position.x, position.y, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS));
		this.velocity = velocity;
	}

	collides(object: Collideable | TileWithPosition) {
		if(object instanceof Spikeball || object instanceof SpikeballBlock) {
			return !this.overlappingObjects.includes(object);
		}
		else if(!(object instanceof Collideable)) {
			return !this.overlappingObjects.some(o => o instanceof Vector && o.equals(object.position));
		}
		return true;
	}

	render() {
		return [
			new Renderable(this.display.bind(this), "entity"),
			new Renderable(this.displayGlowEffect.bind(this), "glow"),
		];
	}
	display(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.fillStyle = SpikeballData.COLOR;
		canvasIO.fillCircle(center.x, center.y, SpikeballData.RADIUS);


		canvasIO.ctx.strokeStyle = SpikeballData.ELECTRICITY_COLOR;
		canvasIO.ctx.lineWidth = SpikeballData.ELECTRICITY_WIDTH;
		for(let i = 0; i < SpikeballData.NUM_ELECTRIC_ARCS; i ++) {
			const endpoints = GameUtils.randomEvenlySpaced({
				generate: () => GameUtils.randomInCircle(center.x, center.y, SpikeballData.ELECTRICITY_RADIUS),
				metric: Vector.dist,
				amount: SpikeballData.ELECTRICITY_SEGMENTS,
				trials: SpikeballData.ELECTRICITY_EVENNESS,
			});
			for(let i = 0; i < endpoints.length - 1; i ++) {
				const [point, next] = [endpoints[i], endpoints[i+1]];
				canvasIO.strokeLine(point.x, point.y, next.x, next.y);
			}
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

	onCollision(collision: CollisionEvent, world: World) {
		if(this.lastCollisionFrame === GameUtils.frameCount) {
			return;
		}
		this.lastCollisionFrame = GameUtils.frameCount;
		if(collision.movingObject === this) {
			this.bounces --;
			if(Directions.isHorizontal(collision.direction)) {
				this.velocity.x *= -1;
			}
			else {
				this.velocity.y *= -1;
			}
		}
		const collidingObject = collision.collidingObject(this);
		if(collidingObject instanceof Player) {
			collidingObject.damage(this.hitbox, world);
		}
	}
	update(world: World, canvasIO: CanvasIO) {
		this.move(this.velocity, world, canvasIO, {
			collides: (obj) => this.collides(obj),
		});
		if(this.bounces < 0) {
			world.entities.delete(this);
			this.die(world, canvasIO);
		}
		this.age ++;
		if(this.age > (WorldData.TILE_SIZE - 2 * SpikeballData.RADIUS) / SpikeballData.SPEED) {
			this.overlappingObjects = this.overlappingObjects.filter(s => (
				((s instanceof Spikeball || s instanceof SpikeballBlock) && s.intersects(this))
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
