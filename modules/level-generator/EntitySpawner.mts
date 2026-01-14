import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, LaserBlockData, LizardData, RoomData, SpiderData, SpikeballBlockData, WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { Spider } from "../entities/Spider.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { SpikeballBlock } from "../tiles/SpikeballBlock.mjs";
import { World } from "../world/World.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { ThrowableTileEntity } from "../items/ThrowableTileEntity.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";

type Feature = "lizards" | "spiders" | "lasers" | "spikeballs";

export class EntitySpawner {
	static FEATURES = ["lizards", "spiders", "lasers", "spikeballs"] as const;
	static randomFeatures(): Feature[] {
		return GameUtils.randomPermutation([...EntitySpawner.FEATURES]).slice(0, 2);
	}

	static spawnAllEntities(tileRegion: Rectangle, safeRegion: Rectangle, world: World) {
		const features = EntitySpawner.randomFeatures();
		if(features.includes("lasers")) {
			this.spawnLasers(tileRegion, safeRegion, world);
		}
		if(features.includes("spikeballs")) {
			this.spawnSpikeballBlocks(tileRegion, safeRegion, world);
		}
		if(features.includes("lizards")) {
			this.spawnLizards(tileRegion, safeRegion, world);
		}
		if(features.includes("spiders")) {
			this.spawnSpiders(tileRegion, safeRegion, world);
		}
		this.spawnThrowableBlocks(tileRegion, world);
	}


	static spawnEntities(amount: number, evenness: number, tileRegion: Rectangle, requirements: ((position: Vector, world: World) => boolean)[], spawn: (position: Vector, world: World) => boolean, safeRegion: Rectangle, world: World) {
		const safePositions = new Set(safeRegion.squares().map(s => s.toString()));
		const positions = tileRegion.squares().filter(s => !safePositions.has(s.toString()));
		let possiblePositions = positions.filter(position => requirements.every(r => r(position, world)));
		const spawnedPositions: Vector[] = [];
		while(spawnedPositions.length < amount && possiblePositions.length > 0) {
			const [position] = GameUtils.randomEvenlySpaced({
				generate: () => ArrayUtils.randomItem(possiblePositions),
				metric: Vector.dist,
				amount: 1,
				trials: evenness,
				previousPoints: spawnedPositions,
			});
			const spawned = spawn(position, world);
			if(spawned) {
				spawnedPositions.push(position);
			}
			const adjacent = [position, ...position.adjacentVectors()];
			possiblePositions = possiblePositions.filter(p => p !== position && !adjacent.some(a => a.equals(p)));
		}
	}


	static spawnRequirements = {
		replaceSolid: (position: Vector, world: World) => {
			const tile = world.tiles.get(position);
			return tile instanceof BasicTile && tile.shape === "full";
		},
		replaceEmpty: (position: Vector, world: World) => world.tiles.get(position) === EmptyTile.EMPTY,
		solidAdjacent: (position: Vector, world: World) => Directions.DIRECTIONS.some(direction => {
			const tile = world.tiles.get(position.add(Vector.unit(direction)));
			return tile instanceof BasicTile && tile.shape === "full";
		}),
		atLeast2Empty: (position: Vector, world: World) => (
			Directions.DIRECTIONS.filter(d => world.tiles.get(position.add(Vector.unit(d))) === EmptyTile.EMPTY).length >= 2
		),
		noAdjacentGates: (position: Vector, world: World) => (
			!position.adjacentVectors().some(v => world.tiles.get(v) instanceof Gate)
		),
		atLeastLine3Empty: (position: Vector, world: World) => {
			for(const direction of Directions.DIRECTIONS) {
				const firstTile = world.tiles.get(position.add(Vector.unit(direction)));
				if(firstTile instanceof BasicTile) { continue; }
				for(let i = 2; i <= 3; i ++) {
					if(world.tiles.get(position.add(Vector.unit(direction).multiply(i))) !== EmptyTile.EMPTY) {
						return false;
					}
				}
			}
			return true;
		},
		atLeast3RectEmpty: (position: Vector, world: World) => {
			for(const direction of Directions.DIRECTIONS) {
				const directionVector = Vector.unit(direction);
				const perpendicular1 = Vector.unit(Directions.rotateClockwise[direction]);
				const perpendicular2 = Vector.unit(Directions.rotateCounterclockwise[direction]);
				const firstTile = world.tiles.get(position.add(directionVector));
				if(firstTile instanceof BasicTile) { continue; }
				for(let i = 2; i <= 3; i ++) {
					if(
						world.tiles.get(position.add(directionVector.multiply(i))) !== EmptyTile.EMPTY ||
						world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular1)) !== EmptyTile.EMPTY ||
						world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular2)) !== EmptyTile.EMPTY
					) {
						return false;
					}
				}
			}
			return true;
		},
		notOnFloor: (position: Vector, world: World) => {
			return world.tiles.get(position.add(0, -1)) !== EmptyTile.EMPTY;
		},
		leftOrRightEmpty: (position: Vector, world: World) => (
			world.tiles.get(position.add(-1, 0)) === EmptyTile.EMPTY ||
			world.tiles.get(position.add(1, 0)) === EmptyTile.EMPTY
		),
		solidBelow: (position: Vector, world: World) => World.isFullBasicTile(world.tiles.get(position.add(0, 1))),
	};
	static spawnLasers(tileRegion: Rectangle, safeRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * LaserBlockData.LASERS_PER_ROOM,
			LaserBlockData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceSolid,
				EntitySpawner.spawnRequirements.atLeast2Empty,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.notOnFloor,
				LaserBlock.canSpawn,
			],
			(position, world) => {
				world.addTile(position, LaserBlock.generate());
				return true;
			},
			safeRegion,
			world,
		);
	}
	static spawnSpikeballBlocks(tileRegion: Rectangle, safeRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * SpikeballBlockData.SPIKEBALLS_PER_ROOM,
			SpikeballBlockData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceSolid,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.atLeast3RectEmpty,
				SpikeballBlock.canSpawn,
			],
			(position: Vector, world: World) => {
				world.addTile(position, new SpikeballBlock(ArrayUtils.randomItem(SpikeballBlockData.PATTERNS)));
				return true;
			},
			safeRegion,
			world,
		);
	}
	static spawnLizards(tileRegion: Rectangle, safeRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * LizardData.LIZARDS_PER_ROOM,
			LizardData.SPAWN_EVENNESS,
			tileRegion,
			[EntitySpawner.spawnRequirements.replaceEmpty],
			Lizard.spawn,
			safeRegion,
			world,
		);
	}
	static spawnSpiders(tileRegion: Rectangle, safeRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * SpiderData.SPIDERS_PER_ROOM,
			SpiderData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceEmpty,
				EntitySpawner.spawnRequirements.solidAdjacent,
			],
			Spider.spawn,
			safeRegion,
			world,
		);
	}
	static spawnThrowableBlocks(tileRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * ItemData.BLOCK.BLOCKS_PER_ROOM,
			ItemData.BLOCK.BLOCKS_SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceSolid,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.leftOrRightEmpty,
				EntitySpawner.spawnRequirements.solidBelow,
			],
			(position: Vector, world: World) => {
				world.removeTile(position);
				world.entities.addEntity(new ThrowableTileEntity(position.multiply(WorldData.TILE_SIZE), []));
				return true;
			},
			new Rectangle(0, 0, 0, 0),
			world,
		);
	}
}
