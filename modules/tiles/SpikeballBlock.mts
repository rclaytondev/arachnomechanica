import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballBlockData, SpikeballData, SpikeballPattern, WorldData } from "../constants/GameData.mjs";
import { Spikeball } from "../entities/Spikeball.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { World } from "../World";

export class SpikeballBlock {
	timeUntilSpawn: number = 0;
	pattern: SpikeballPattern;
	patternStep: number = 0;
	spikeballs: Spikeball[] = [];
	doorUpLeft: number = 0;
	doorUpRight: number = 0;
	doorDownLeft: number = 0;
	doorDownRight: number = 0;
	doors: { "up-left": number, "up-right": number, "down-left": number, "down-right": number } = {
		"up-left": 0,
		"up-right": 0,
		"down-left": 0,
		"down-right": 0
	};

	constructor(pattern: SpikeballPattern) {
		this.pattern = pattern;
	}

	display(canvasIO: CanvasIO, x: number, y:  number) {
		canvasIO.ctx.fillStyle = SpikeballBlockData.COLOR;
		canvasIO.ctx.fillRect(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE, WorldData.TILE_SIZE);

		this.displayDoors(canvasIO, x, y);
	}
	displayDoors(canvasIO: CanvasIO, x: number, y:  number) {
		canvasIO.ctx.fillStyle = SpikeballBlockData.DOOR_COLOR;

		canvasIO.ctx.save();
		canvasIO.ctx.translate(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE);
		canvasIO.ctx.fillRect(this.doors["up-left"], 0, SpikeballBlockData.DOOR_WIDTH, SpikeballBlockData.DOOR_HEIGHT);
		canvasIO.ctx.fillRect(0, this.doors["up-left"], SpikeballBlockData.DOOR_HEIGHT, SpikeballBlockData.DOOR_WIDTH);

		canvasIO.ctx.fillRect(this.doors["down-left"], WorldData.TILE_SIZE - SpikeballBlockData.DOOR_HEIGHT, SpikeballBlockData.DOOR_WIDTH, SpikeballBlockData.DOOR_HEIGHT);
		canvasIO.ctx.fillRect(0, WorldData.TILE_SIZE - SpikeballBlockData.DOOR_WIDTH - this.doors["down-left"], SpikeballBlockData.DOOR_HEIGHT, SpikeballBlockData.DOOR_WIDTH);

		
		canvasIO.ctx.fillRect(WorldData.TILE_SIZE - SpikeballBlockData.DOOR_WIDTH - this.doors["up-right"], 0, SpikeballBlockData.DOOR_WIDTH, SpikeballBlockData.DOOR_HEIGHT);
		canvasIO.ctx.fillRect(WorldData.TILE_SIZE - SpikeballBlockData.DOOR_HEIGHT, this.doors["up-right"], SpikeballBlockData.DOOR_HEIGHT, SpikeballBlockData.DOOR_WIDTH);

		
		canvasIO.ctx.fillRect(WorldData.TILE_SIZE - SpikeballBlockData.DOOR_WIDTH - this.doors["down-right"], WorldData.TILE_SIZE - SpikeballBlockData.DOOR_HEIGHT, SpikeballBlockData.DOOR_WIDTH, SpikeballBlockData.DOOR_HEIGHT);
		canvasIO.ctx.fillRect(WorldData.TILE_SIZE - SpikeballBlockData.DOOR_HEIGHT, WorldData.TILE_SIZE - SpikeballBlockData.DOOR_WIDTH - this.doors["down-right"], SpikeballBlockData.DOOR_HEIGHT, SpikeballBlockData.DOOR_WIDTH);

		canvasIO.ctx.restore();
	}

	update(world: World, x: number, y: number) {
		if(this.spikeballs.length === 0) {
			this.timeUntilSpawn --;
		}
		if(this.timeUntilSpawn < 0) {
			this.spawnSpikeballs(world, x, y);
			this.timeUntilSpawn = SpikeballBlockData.SPAWN_FREQUENCY;
		}
		this.spikeballs = this.spikeballs.filter(s => !s.dead);


		for(const xDirection of ["left", "right"] as const) {
			for(const yDirection of ["up", "down"] as const) {
				const patternStep = this.pattern[this.patternStep];
				const open = (
					this.timeUntilSpawn < SpikeballBlockData.DOOR_OPENING_TIME
					&& patternStep.some(p => p[0] === xDirection && p[1] === yDirection)
				);
				const target = open ? SpikeballBlockData.DOOR_OPENNESS : 0;
				const direction = yDirection + "-" + xDirection as "up-left" | "up-right" | "down-left" | "down-right";
				this.doors[direction] = GameUtils.moveTowards(this.doors[direction], target, SpikeballBlockData.DOOR_OPENING_SPEED);
			}
		}
	}

	spawnSpikeballs(world: World, x: number, y: number) {
		for(const [xDirection, yDirection] of this.pattern[this.patternStep]) {
			this.spawnSpikeball(x, y, xDirection, yDirection, world);
		}

		let foundSpawnable = false;
		while(!foundSpawnable) {
			for(const [xDirection, yDirection] of this.pattern[this.patternStep]) {
				if(this.canSpawnSpikeball(x, y, xDirection, yDirection, world)) {
					foundSpawnable = true;
				}
			}
			this.patternStep ++;
			this.patternStep %= this.pattern.length;
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
		this.spikeballs.push(spikeball);
		world.entities.push(spikeball);
	}

	copy() {
		const copy = new SpikeballBlock([]);
		copy.timeUntilSpawn = this.timeUntilSpawn;
		return copy;
	}

	static canSpawn(position: Vector, world: World) {
		if(world.tiles.get(position) !== "solid") {
			return false;
		}
		const block = new SpikeballBlock([]);
		return (
			block.canSpawnSpikeball(position.x, position.y, "left", "up", world)
			|| block.canSpawnSpikeball(position.x, position.y, "left", "down", world)
			|| block.canSpawnSpikeball(position.x, position.y, "right", "up", world)
			|| block.canSpawnSpikeball(position.x, position.y, "right", "down", world)
		);
	}
}
