import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData, WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { Diagonal, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { SpikeballBlock } from "./SpikeballBlock.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Player } from "../Player.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";

abstract class SpikeballState {
	abstract update(self: Spikeball, world: World, canvasIO: CanvasIO): void;

	abstract render(self: Spikeball): Renderable[];
}

class MovingState extends SpikeballState {
	update(self: Spikeball, world: World, canvasIO: CanvasIO): void {
		self.move(Vector.gridUnit(self.direction).multiply(SpikeballData.SPEED), world, canvasIO, {
			collides: (obj) => self.collides(obj),
		});
	}

	render() {
		return [];
	}
}

class AttackState extends SpikeballState {
	timeInState: number = 0;

	update(self: Spikeball, world: World): void {
		this.timeInState ++;

		if(this.timeInState > SpikeballData.TELEGRAPH_DELAY) {
			this.attack(self, world);
			if(this.timeInState > SpikeballData.TELEGRAPH_DELAY + SpikeballData.ATTACK_DURATION) {
				self.state = new MovingState();
			}
		}
	}
	attack(self: Spikeball, world: World) {
		const center = self.hitbox.center();
		const hurtbox = Rectangle.fromCenter(center.x, center.y, SpikeballData.HURTBOX_SIZE, SpikeballData.HURTBOX_SIZE);
		if(world.player.hitbox.intersects(hurtbox)) {
			world.player.damage(hurtbox, world);
		}
	}


	render(self: Spikeball) {
		return [new Renderable(c => this.display(self, c), "glow")];
	}
	display(self: Spikeball, canvasIO: CanvasIO) {
		if(this.timeInState > SpikeballData.TELEGRAPH_DELAY) {
			this.displayLightning(self, canvasIO);
		}
		else {
			this.displayTelegraph(self, canvasIO);
		}
	}
	displayLightning(self: Spikeball, canvasIO: CanvasIO) {
		const center = self.hitbox.center();
		canvasIO.ctx.strokeStyle = SpikeballData.ELECTRICITY_COLOR;
		canvasIO.ctx.lineWidth = SpikeballData.ELECTRICITY_WIDTH;
		for(let i = 0; i < SpikeballData.NUM_ELECTRIC_ARCS; i ++) {
			const endpoints = RandomUtils.randomEvenlySpaced({
				generate: () => RandomUtils.randomInCircle(center.x, center.y, SpikeballData.TELEGRAPH_RADIUS),
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
	displayTelegraph(self: Spikeball, canvasIO: CanvasIO) {
		const center = self.hitbox.center();
		const thickness = GeomUtils.lerp(this.timeInState, 0, SpikeballData.TELEGRAPH_DELAY, SpikeballData.TELEGRAPH_THICKNESS, 1);
		GraphicsUtils.glowCircleOutline(center.x, center.y, SpikeballData.TELEGRAPH_RADIUS, thickness, 1, canvasIO, 255, 255, 0);
	}
}

export class Spikeball extends RectangularCollideable {
	state: SpikeballState = new MovingState();
	direction: Diagonal;
	age: number = 0;
	bounces: number = SpikeballData.BOUNCES;
	overlappingObjects: (Spikeball | SpikeballBlock | Vector)[] = [];
	lastCollisionFrame: number = -1;

	constructor(position: Vector, direction: Diagonal) {
		super(Rectangle.fromDimensions(position.x, position.y, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS));
		this.direction = direction;
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
			...this.state.render(this),
		];
	}
	display(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(-Directions.angle[this.direction]);
		canvasIO.ctx.fillStyle = SpikeballData.COLOR;
		canvasIO.fillPoly(
			-SpikeballData.WING_WIDTH, SpikeballData.WING_WIDTH,
			-SpikeballData.INNER_LENGTH, 0,
			-SpikeballData.WING_WIDTH, -SpikeballData.WING_WIDTH,
			SpikeballData.SPIKE_LENGTH, 0,
		);
		canvasIO.ctx.fillStyle = "yellow";
		canvasIO.ctx.scale(0.25, 0.25);
		canvasIO.fillPoly(
			-SpikeballData.WING_WIDTH, SpikeballData.WING_WIDTH,
			-SpikeballData.INNER_LENGTH, 0,
			-SpikeballData.WING_WIDTH, -SpikeballData.WING_WIDTH,
			SpikeballData.SPIKE_LENGTH, 0,
		);
		canvasIO.ctx.restore();
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.save();
		canvasIO.ctx.globalAlpha = this.age / SpikeballData.GLOW_FADE_TIME;
		GraphicsUtils.glowCircle(
			center.x, center.y,
			SpikeballData.GLOW_SIZE, SpikeballData.GLOW_INTENSITY,
			canvasIO,
			SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue,
		);
		canvasIO.ctx.restore();
	}

	onCollision(collision: CollisionEvent, world: World) {
		if(this.lastCollisionFrame === world.frameCount) {
			return;
		}
		this.lastCollisionFrame = world.frameCount;
		const collidingObject = collision.collidingObject(this);
		if(collision.movingObject === this && !(collidingObject instanceof Player)) {
			this.bounces --;
			if(Directions.isHorizontal(collision.direction)) {
				this.direction = Directions.reflectX[this.direction];
			}
			else {
				this.direction = Directions.reflectY[this.direction];
			}
		}
		if(collidingObject instanceof Player && this.state instanceof MovingState) {
			this.state = new AttackState();
		}
	}
	update(world: World, canvasIO: CanvasIO) {
		this.state.update(this, world, canvasIO);
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
		GraphicsUtils.shatterParticles(
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
