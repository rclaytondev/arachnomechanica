import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { LaserBlockData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { frameCount } from "../Main.js";
import { Particle } from "../game-utilities/Particle.mjs";
import { World } from "../World";
import { Gate } from "./Gate.mjs";

export class LaserBlock {
	static glowLineGradient = GameUtils.glowLineGradient(
		0, 0, 0, -LaserBlockData.LASER_GLOW_SIZE,
		LaserBlockData.LASER_GLOW_INTENSITY, 
		LaserBlockData.LASER_COLOR.red, LaserBlockData.LASER_COLOR.green, LaserBlockData.LASER_COLOR.blue
	);
	static glowLineGradient2 = GameUtils.glowLineGradient(
		0, 0, 0, LaserBlockData.LASER_GLOW_SIZE,
		LaserBlockData.LASER_GLOW_INTENSITY, 
		LaserBlockData.LASER_COLOR.red, LaserBlockData.LASER_COLOR.green, LaserBlockData.LASER_COLOR.blue
	);
	static circleGradient = GameUtils.glowCircleGradient(
		0, 0,
		LaserBlockData.LASER_GLOW_SIZE, LaserBlockData.LASER_GLOW_INTENSITY,
		LaserBlockData.LASER_COLOR.red, LaserBlockData.LASER_COLOR.green, LaserBlockData.LASER_COLOR.blue
	);

	lasers: number;
	speed: number;
	angle: number;
	lengths: number[];

	constructor(lasers: number, speed: number, angle: number) {
		this.lasers = lasers;
		this.speed = speed;
		this.angle = angle;
		this.lengths = new Array(lasers).fill(0);
	}

	copy() {
		return new LaserBlock(this.lasers, this.speed, this.angle);
	}

	display(canvasIO: CanvasIO, x: number, y: number) {
		canvasIO.ctx.fillStyle = LaserBlockData.COLOR;
		canvasIO.ctx.fillRect(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
	displayLasers(canvasIO: CanvasIO, x: number, y: number, world: World) {
		canvasIO.ctx.lineWidth = LaserBlockData.LASER_THICKNESS;
		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);
		for(const [i, angle] of this.angles().entries()) {
			const distance = this.lengths[i];
			canvasIO.ctx.strokeStyle = `rgb(${LaserBlockData.LASER_COLOR.red}, ${LaserBlockData.LASER_COLOR.green}, ${LaserBlockData.LASER_COLOR.blue})`;
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angle);
			canvasIO.strokeLine(0, 0, distance, 0);
			canvasIO.ctx.restore();
		}
	}
	displayLaserGlow(canvasIO: CanvasIO, x: number, y: number, world: World) {
		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);
		for(const [i, angle] of this.angles().entries()) {
			const direction = new Vector(Math.cos(angle), Math.sin(angle));
			const distance = this.lengths[i];
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angle);
			canvasIO.ctx.fillStyle = LaserBlock.glowLineGradient;
			canvasIO.ctx.fillRect(0, -LaserBlockData.LASER_GLOW_SIZE, distance, LaserBlockData.LASER_GLOW_SIZE);
			canvasIO.ctx.fillStyle = LaserBlock.glowLineGradient2;
			canvasIO.ctx.fillRect(0, 0, distance, LaserBlockData.LASER_GLOW_SIZE);
			canvasIO.ctx.fillStyle = LaserBlock.circleGradient;
			canvasIO.fillArc(0, 0, LaserBlockData.LASER_GLOW_SIZE, Math.PI / 2, 3 * Math.PI / 2);
			canvasIO.ctx.translate(distance, 0);
			canvasIO.fillArc(0, 0, LaserBlockData.LASER_GLOW_SIZE, -Math.PI / 2, Math.PI / 2);
			canvasIO.ctx.restore();
		}
	}
	displayBarrels(canvasIO: CanvasIO, x: number, y: number) {
		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);
		canvasIO.ctx.strokeStyle = LaserBlockData.BARREL_COLOR;
		canvasIO.ctx.lineWidth = LaserBlockData.BARREL_THICKNESS;
		for(const direction of this.directions()) {
			canvasIO.strokeLine(
				center.x, center.y,
				center.x + direction.x * LaserBlockData.BARREL_LENGTH,
				center.y + direction.y * LaserBlockData.BARREL_LENGTH
			)
		}
	}

	update(world: World, x: number, y: number, canvasIO: CanvasIO) {
		this.angle += this.speed;
		
		const player = world.player.physicsObject.hitbox();
		for(const [i, direction] of this.directions().entries()) {
			const length = this.endpointDistance(new Vector(x, y), direction, world, canvasIO.boundingBox());
			this.lengths[i] = GameUtils.moveTowards(this.lengths[i], length, LaserBlockData.LASER_LINEAR_SPEED);
			this.lengths[i] = Math.min(this.lengths[i], length);
			if(this.lengths[i] === length && this.lengths[i] < LaserBlockData.MAX_LENGTH && frameCount % LaserBlockData.FRAMES_PER_PARTICLE == 0) {
				const position = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE).add(direction.multiply(length));
				world.addParticle(new Particle(
					position,
					new Vector(
						GameUtils.random(-LaserBlockData.PARTICLE_SPEED, LaserBlockData.PARTICLE_SPEED),
						GameUtils.random(-LaserBlockData.PARTICLE_SPEED, LaserBlockData.PARTICLE_SPEED),
					),
					LaserBlockData.PARTICLE_INFO
				), canvasIO);
			}
			if(this.intersectsBox(new Vector(x, y), direction, player, length)) {
				world.player.damage();
			}
		}

		if(canvasIO.keys.KeyZ && !GameUtils.pastKeys.KeyZ) {
			this.speed = -this.speed;
		}
	}

	angles() {
		const angles = [];
		for(let i = 0; i < this.lasers; i ++) {
			angles.push(this.angle + i * 2 * Math.PI / this.lasers);
		}
		return angles;
	}
	directions() {
		return this.angles().map(a => new Vector(Math.cos(a), Math.sin(a)));
	}
	intersectsBox(position: Vector, direction: Vector, box: Rectangle, length: number) {
		const onscreenPosition = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		return GameUtils.rayIntersectsRectangle(
			onscreenPosition, direction,
			box
		) < length;
	}
	endpointDistance(position: Vector, direction: Vector, world: World, screenSize: Rectangle) {
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const screenDistance = world.screenIntersectionDistance(center, direction, screenSize);
		return world.lineIntersectionDistance(center, direction, Math.min(screenDistance, LaserBlockData.MAX_LENGTH), [this]);
	}
	endpoint(position: Vector, direction: Vector, world: World, screenSize: Rectangle) {
		const distance = this.endpointDistance(position, direction, world, screenSize);
		return position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE).add(direction.multiply(distance));
	}

	static canSpawn(position: Vector, world: World) {
		const player = world.player.physicsObject.hitbox().center();
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const laser = new LaserBlock(1, 0, 0);
		const previousTile = world.tiles.get(position);
		world.tiles.set(position, laser);
		const distance = laser.endpointDistance(position, player.subtract(center), world, new Rectangle(0, 0, 100, 100));
		const result = !laser.intersectsBox(
			position,
			player.subtract(center),
			world.player.physicsObject.hitbox(),
			distance
		);
		world.tiles.set(position, previousTile);
		return result;
	}
}
