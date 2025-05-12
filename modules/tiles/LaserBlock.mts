import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { LaserBlockData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { World } from "../World";

export class LaserBlock {
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
		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);
		for(const angle of this.angles()) {
			const intersection = this.endpoint(new Vector(x, y), new Vector(Math.cos(angle), Math.sin(angle)), world, canvasIO);
			canvasIO.ctx.strokeStyle = LaserBlockData.LASER_COLOR;
			canvasIO.strokeLine(center.x, center.y, intersection.x, intersection.y);
		}
	}

	update() {
		this.angle += this.speed;
	}

	angles() {
		const angles = [];
		for(let i = 0; i < this.lasers; i ++) {
			angles.push(this.angle + i * 2 * Math.PI / this.lasers);
		}
		return angles;
	}
	screenIntersectionDistance(position: Vector, direction: Vector, world: World, canvasIO: CanvasIO) {
		const onscreenPosition = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const player = world.player.physicsObject.hitbox().center();
		const xSide = (direction.x >= 0) ? 1 : -1;
		const ySide = (direction.y >= 0) ? 1 : -1;
		return Math.min(
			GameUtils.lineIntersectVertical(onscreenPosition, direction, player.x + xSide * canvasIO.canvas.width / 2),
			GameUtils.lineIntersectHorizontal(onscreenPosition, direction, player.y + ySide * canvasIO.canvas.height / 2)
		);
	}
	tileIntersectionDistance(position: Vector, direction: Vector, world: World, maxDistance: number) {
		let result = Infinity;
		for(let x = (direction.x >= 0) ? position.x + 1 : position.x; true; x += (direction.x >= 0) ? 1 : -1) {
			const distance = GameUtils.lineIntersectVertical(
				position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
				direction,
				x * WorldData.TILE_SIZE
			);
			const y = Math.floor(position.y + (direction.y * distance) / WorldData.TILE_SIZE);
			if(world.tiles.get(x - 1, y) === "solid" || world.tiles.get(x, y) === "solid") {
				result = Math.min(result, distance);
				break;
			}
			if(distance > maxDistance) { break; }
		}
		for(let y = (direction.y >= 0) ? position.y + 1 : position.y; true; y += (direction.y >= 0) ? 1 : -1) {
			const distance = GameUtils.lineIntersectHorizontal(
				position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
				direction,
				y * WorldData.TILE_SIZE
			);
			const x = Math.floor(position.x + (direction.x * distance) / WorldData.TILE_SIZE);
			if(world.tiles.get(x, y - 1) === "solid" || world.tiles.get(x, y) === "solid") {
				result = Math.min(result, distance);
				break;
			}
			if(distance > maxDistance) { break; }
		}
		return result;
	}
	endpoint(position: Vector, direction: Vector, world: World, canvasIO: CanvasIO) {
		let distance = this.screenIntersectionDistance(position, direction, world, canvasIO);
		distance = Math.min(distance, this.tileIntersectionDistance(position, direction, world, distance));
		return position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE).add(direction.multiply(distance));
	}
}
