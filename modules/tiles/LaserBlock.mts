import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { LaserBlockData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { World } from "../world/World.mjs";
import { Tile } from "./Tile.mjs";

export class LaserBlock extends Tile {
	lasers: number;
	speed: number;
	startAngle: number;
	lengths: number[];
	direction: 1 | -1;

	mode: "unactivated" | "waiting" | "activated" = "unactivated";
	modeStartTime: number = 0;

	get angle() {
		return this.startAngle + GameUtils.frameCount * this.speed;
	}

	constructor(lasers: number, speed: number, startAngle: number, direction: 1 | -1) {
		super();
		this.lasers = lasers;
		this.speed = speed;
		this.startAngle = startAngle;
		this.lengths = new Array(lasers).fill(0);
		this.direction = direction;
	}
	static generate() {
		const direction = (Math.random() < 0.5) ? 1 : -1;
		return new LaserBlock(
			LaserBlockData.BEAMS_PER_BLOCK,
			LaserBlockData.SPEED * direction,
			GameUtils.random(0, 2 * Math.PI),
			direction,
		);
	}

	copy() {
		return new LaserBlock(this.lasers, this.speed, this.startAngle, this.direction);
	}

	display(canvasIO: CanvasIO, x: number, y: number) {
		canvasIO.ctx.fillStyle = LaserBlockData.TILE_COLOR;
		canvasIO.ctx.fillRect(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
	displayLasers(canvasIO: CanvasIO, x: number, y: number) {
		canvasIO.ctx.lineWidth = (this.mode === "activated") ? LaserBlockData.ACTIVATED_THICKNESS : LaserBlockData.LASER_THICKNESS;
		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);
		for(const [i, angle] of this.angles().entries()) {
			const distance = this.lengths[i];
			canvasIO.ctx.strokeStyle = GameUtils.formatColor(this.color());
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angle);
			canvasIO.linePointedness = canvasIO.ctx.lineWidth / 2;
			canvasIO.pointedLine(0, 0, distance, 0);
			canvasIO.ctx.restore();
		}
	}
	color() {
		return this.mode === "activated" ? LaserBlockData.ACTIVATED_COLOR : LaserBlockData.LASER_COLOR;
	}
	displayLaserGlow(canvasIO: CanvasIO, x: number, y: number) {
		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);
		for(const [i, angle] of this.angles().entries()) {
			const distance = this.lengths[i];
			const endpoint = center.add(new Vector(distance, 0).rotate(MathUtils.toDegrees(angle)));
			const color = this.color();
			GameUtils.glowOutline(
				center.x, center.y, endpoint.x, endpoint.y,
				LaserBlockData.LASER_GLOW_SIZE, LaserBlockData.LASER_GLOW_INTENSITY,
				canvasIO,
				color.red, color.green, color.blue,
			);
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
				center.y + direction.y * LaserBlockData.BARREL_LENGTH,
			);
		}
	}

	update(world: World, x: number, y: number, canvasIO: CanvasIO) {
		this.updateLengths(world, x, y, canvasIO);
		this.updateMode();
	}
	updateLengths(world: World, x: number, y: number, canvasIO: CanvasIO) {
		const player = world.player.hitbox;
		for(const [i, direction] of this.directions().entries()) {
			const length = this.endpointDistance(new Vector(x, y), direction, world, canvasIO.boundingBox());
			this.lengths[i] = GameUtils.moveTowards(this.lengths[i], length, LaserBlockData.LASER_LINEAR_SPEED);
			this.lengths[i] = Math.min(this.lengths[i], length);
			if(this.lengths[i] === length && this.lengths[i] < LaserBlockData.MAX_LENGTH && GameUtils.frameCount % LaserBlockData.FRAMES_PER_PARTICLE == 0) {
				const position = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE).add(direction.multiply(length));
				world.addParticle(new Particle(
					position,
					new Vector(
						GameUtils.random(-LaserBlockData.PARTICLE_SPEED, LaserBlockData.PARTICLE_SPEED),
						GameUtils.random(-LaserBlockData.PARTICLE_SPEED, LaserBlockData.PARTICLE_SPEED),
					),
					LaserBlockData.PARTICLE_INFO,
				), canvasIO);
			}
			if(this.intersectsBox(new Vector(x, y), direction, player, length)) {
				if(this.mode === "unactivated") {
					this.modeStartTime = GameUtils.frameCount;
					this.mode = "waiting";
					this.setSpeed(0);
				}
				if(this.mode === "activated") {
					world.player.damage(world.player.hitbox, world);
				}
			}
		}
	}
	setSpeed(speed: number) {
		const angle = this.angle;
		this.startAngle = angle - GameUtils.frameCount * speed;
		this.speed = speed;
	}
	updateMode() {
		if(this.mode === "waiting" && GameUtils.frameCount - this.modeStartTime > LaserBlockData.WAIT_TIMER) {
			this.mode = "activated";
			this.modeStartTime = GameUtils.frameCount;
			this.setSpeed(LaserBlockData.ACTIVATED_SPEED * this.direction);
		}
		if(this.mode === "activated" && GameUtils.frameCount - this.modeStartTime > LaserBlockData.ACTIVATION_TIME) {
			this.mode = "unactivated";
			this.modeStartTime = GameUtils.frameCount;
			this.setSpeed(LaserBlockData.SPEED * this.direction);
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
			box,
		) <= length;
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
		const player = world.player.hitbox.center();
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const laser = new LaserBlock(1, 0, 0, 1);
		const previousTile = world.tiles.get(position);
		world.tiles.set(position, laser);
		const distance = laser.endpointDistance(position, player.subtract(center), world, new Rectangle(0, 0, 100, 100));
		const result = !laser.intersectsBox(
			position,
			player.subtract(center),
			world.player.hitbox,
			distance,
		);
		world.tiles.set(position, previousTile);
		return result;
	}
}
