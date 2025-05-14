import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballBlockData, SpikeballData, WorldData } from "../constants/GameData.mjs";
import { Spikeball } from "../entities/Spikeball.mjs";
import { World } from "../World";

export class SpikeballBlock {
	timeUntilSpawn: number = 0;

	constructor() {

	}

	display(canvasIO: CanvasIO, x: number, y:  number) {
		canvasIO.ctx.fillStyle = SpikeballBlockData.COLOR;
		canvasIO.ctx.fillRect(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}

	update(world: World, x: number, y: number) {
		this.timeUntilSpawn --;
		if(this.timeUntilSpawn < 0) {
			this.spawnSpikeballs(world, x, y);
			this.timeUntilSpawn = SpikeballBlockData.SPAWN_FREQUENCY;
		}
	}

	spawnSpikeballs(world: World, x: number, y: number) {
		for(const xDirection of ["left", "right"] as const) {
			for(const yDirection of ["up", "down"] as const) {
				if(this.canSpawnSpikeball(x, y, xDirection, yDirection, world)) {
					this.spawnSpikeball(x, y, xDirection, yDirection, world);
				}
			}
		}
	}
	canSpawnSpikeball(x: number, y: number, xDirection: Direction, yDirection: Direction, world: World) {
		const tileX = world.tiles.get(Vector.unit(xDirection).add(x, y));
		const tileY = world.tiles.get(Vector.unit(yDirection).add(x, y));
		const tileDiagonal = world.tiles.get(Vector.unit(xDirection).add(Vector.unit(yDirection)).add(x, y));
		return (tileX === "empty" || tileY === "empty") && tileDiagonal === "empty";
	}
	spawnSpikeball(x: number, y: number, xDirection: Direction, yDirection: Direction, world: World) {
		const spikeball = new Spikeball(
			new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE).subtract(SpikeballData.RADIUS, SpikeballData.RADIUS),
			Vector.unit(xDirection).add(Vector.unit(yDirection)).multiply(SpikeballData.SPEED)
		);
		spikeball.ignoredTiles.push(
			new Vector(x, y),
			new Vector(x, y).add(Vector.unit(xDirection)),
			new Vector(x, y).add(Vector.unit(yDirection)),
		);
		world.entities.push(spikeball);
	}

	copy() {
		const copy = new SpikeballBlock();
		copy.timeUntilSpawn = this.timeUntilSpawn;
		return new SpikeballBlock();
	}
}
