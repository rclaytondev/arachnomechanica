import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { LaserBlockData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { World } from "../World";

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

	lasers: number;
	speed: number;
	angle: number;

	constructor(lasers: number, speed: number, angle: number) {
		this.lasers = lasers;
		this.speed = speed;
		this.angle = angle;
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
		for(const angle of this.angles()) {
			const direction = new Vector(Math.cos(angle), Math.sin(angle));
			const intersectionDistance = this.endpointDistance(new Vector(x, y), direction, world, canvasIO);
			canvasIO.ctx.strokeStyle = `rgb(${LaserBlockData.LASER_COLOR.red}, ${LaserBlockData.LASER_COLOR.green}, ${LaserBlockData.LASER_COLOR.blue})`;
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angle);
			canvasIO.strokeLine(0, 0, intersectionDistance, 0);
			canvasIO.ctx.fillStyle = LaserBlock.glowLineGradient;
			canvasIO.ctx.fillRect(0, -LaserBlockData.LASER_GLOW_SIZE, intersectionDistance, LaserBlockData.LASER_GLOW_SIZE);
			canvasIO.ctx.fillStyle = LaserBlock.glowLineGradient2;
			canvasIO.ctx.fillRect(0, 0, intersectionDistance, LaserBlockData.LASER_GLOW_SIZE);
			canvasIO.ctx.restore();
		}
	}

	update(world: World, x: number, y: number, canvasIO: CanvasIO) {
		this.angle += this.speed;
		
		const player = world.player.physicsObject.hitbox();
		for(const direction of this.directions()) {
			if(this.intersectsBox(new Vector(x, y), direction, world, canvasIO, player)) {
				world.player.damage();
			}
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
	screenIntersectionDistance(position: Vector, direction: Vector, world: World, canvasIO: CanvasIO) {
		const onscreenPosition = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const player = world.player.physicsObject.hitbox().center();
		const left = player.x - canvasIO.canvas.width / 2 - LaserBlockData.LASER_OFFSCREEN_DISTANCE;
		const right = player.x + canvasIO.canvas.width / 2 + LaserBlockData.LASER_OFFSCREEN_DISTANCE;
		const top = player.y - canvasIO.canvas.height / 2 - LaserBlockData.LASER_OFFSCREEN_DISTANCE;
		const bottom = player.y + canvasIO.canvas.height / 2 + LaserBlockData.LASER_OFFSCREEN_DISTANCE;
		return Math.min(
			GameUtils.rayIntersectsVSegment(onscreenPosition, direction, direction.x >= 0 ? right : left, top, bottom),
			GameUtils.rayIntersectsHSegment(onscreenPosition, direction, direction.y >= 0 ? bottom : top, left, right)
		);
	}
	tileIntersectionDistance(position: Vector, direction: Vector, world: World, maxDistance: number) {
		let result = Infinity;
		for(let x = (direction.x >= 0) ? position.x + 1 : position.x; true; x += (direction.x >= 0) ? 1 : -1) {
			const distance = GameUtils.rayIntersectsVertical(
				position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
				direction,
				x * WorldData.TILE_SIZE
			);
			const y = Math.floor(position.y + 1/2 + (direction.y * distance) / WorldData.TILE_SIZE);
			if(world.tiles.get(x - 1, y) === "solid" || world.tiles.get(x, y) === "solid") {
				result = Math.min(result, distance);
				break;
			}
			if(distance > maxDistance) { break; }
		}
		for(let y = (direction.y >= 0) ? position.y + 1 : position.y; true; y += (direction.y >= 0) ? 1 : -1) {
			const distance = GameUtils.rayIntersectsHorizontal(
				position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
				direction,
				y * WorldData.TILE_SIZE
			);
			const x = Math.floor(position.x + 1/2 + (direction.x * distance) / WorldData.TILE_SIZE);
			if(world.tiles.get(x, y - 1) === "solid" || world.tiles.get(x, y) === "solid") {
				result = Math.min(result, distance);
				break;
			}
			if(distance > maxDistance) { break; }
		}
		return result;
	}
	intersectsBox(position: Vector, direction: Vector, world: World, canvasIO: CanvasIO, box: Rectangle) {
		const distance = this.endpointDistance(position, direction, world, canvasIO);
		const onscreenPosition = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		return GameUtils.rayIntersectsRectangle(
			onscreenPosition, direction,
			world.player.physicsObject.hitbox()
		) <= distance;
	}
	endpointDistance(position: Vector, direction: Vector, world: World, canvasIO: CanvasIO) {
		let distance = this.screenIntersectionDistance(position, direction, world, canvasIO);
		if(distance === Infinity) { return 0; }
		distance = Math.min(distance, this.tileIntersectionDistance(position, direction, world, distance));
		return distance;
	}
	endpoint(position: Vector, direction: Vector, world: World, canvasIO: CanvasIO) {
		const distance = this.endpointDistance(position, direction, world, canvasIO);
		return position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE).add(direction.multiply(distance));
	}
}
