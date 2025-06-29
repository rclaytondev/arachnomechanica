import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { LaserBlockData, LevelGeneratorData, RoomData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";
import { World } from "../World";

type Feature = "lizards" | "spiders" | "lasers" | "spikeballs";

export class WorldRegion {
	position: Vector;
	features: Feature[];

	static FEATURES = ["lizards", "spiders", "lasers", "spikeballs"] as const;
	static randomFeatures(): Feature[] {
		return GameUtils.randomPermutation([...WorldRegion.FEATURES]).slice(0, 2);
	}
	
	constructor(position: Vector, features: Feature[]) {
		this.position = position;
		this.features = features;
	}
}

export class EntitySpawner {
	regionChunks: Grid<WorldRegion[] | null> = new Grid(null);

	generateChunk(chunkPosition: Vector, world: World) {
		this.addRegionsToAdjacent(chunkPosition);
		this.spawnEntities(chunkPosition, world);
	}

	addRegionsToAdjacent(chunkPosition: Vector) {
		const regionChunk = chunkPosition.divide(LevelGeneratorData.REGION_CHUNK_SIZE).floor();
		for(const position of [regionChunk, ...regionChunk.adjacentVectors()]) {
			if(!this.regionChunks.get(position)) {
				this.addRegions(position);
			}
		}
	}
	addRegions(regionChunk: Vector) {
		const roomPosition = regionChunk.multiply(LevelGeneratorData.REGION_CHUNK_SIZE * LevelGeneratorData.CHUNK_SIZE);
		const points = GameUtils.randomEvenlySpaced({
			generate: () => GameUtils.randomInRect(
				Rectangle.square(roomPosition.x, roomPosition.y, LevelGeneratorData.REGION_CHUNK_SIZE * LevelGeneratorData.CHUNK_SIZE - 1),
				GameUtils.randomInt
			),
			metric: Vector.dist,
			amount: LevelGeneratorData.REGION_CHUNK_SIZE ** 2 * LevelGeneratorData.REGIONS_PER_CHUNK,
			trials: LevelGeneratorData.REGION_EVENNESS,
			previousPoints: regionChunk.adjacentVectors().map(v => this.regionChunks.get(v)).flatMap(r => r ? r : []).map(r => r.position)
		});
		this.regionChunks.set(regionChunk, points.map(p => new WorldRegion(p, WorldRegion.randomFeatures())));
	}
	spawnEntities(chunkPosition: Vector, world: World) {
		const rectangle = Rectangle.square(
			chunkPosition.x * LevelGeneratorData.CHUNK_SIZE,
			chunkPosition.y * LevelGeneratorData.CHUNK_SIZE,
			LevelGeneratorData.CHUNK_SIZE
		);
		const regionChunk = chunkPosition.divide(LevelGeneratorData.REGION_CHUNK_SIZE).floor();
		const allRegions = [regionChunk, ...regionChunk.adjacentVectors()].flatMap(v => this.regionChunks.get(v)!);
		const regions = Utils.groupBy(
			rectangle.squares(),
			roomPosition  => Utils.minValue(allRegions, r => GameUtils.taxicabDistance(r.position, roomPosition))
		);
		for(const [region, rooms] of regions.entries()) {
			this.spawnEntitiesInRegion(region, rooms, world);
		}
	}
	spawnEntitiesInRegion(region: WorldRegion, rooms: Vector[], world: World) {
		if(region.features.includes("lasers")) {
			this.spawnLasers(rooms, world);
		}
	}

	
	spawnTraps(amount: number, evenness: number, rooms: Vector[], requirements: ((position: Vector, world: World) => boolean)[], spawn: (position: Vector, world: World) => void, world: World) {
		const positions = rooms.flatMap(r => Rectangle.square(r.x * RoomData.SIZE, r.y * RoomData.SIZE, RoomData.SIZE).squares());
		let possiblePositions = positions.filter(position => requirements.every(r => r(position, world)));
		let spawnedPositions: Vector[] = [];
		while(spawnedPositions.length < amount) {
			const [position] = GameUtils.randomEvenlySpaced({
				generate: () => Utils.randomItem(possiblePositions),
				metric: Vector.dist,
				amount: 1,
				trials: evenness,
				previousPoints: spawnedPositions
			});
			spawnedPositions.push(position);
			spawn(position, world);
			const adjacent = [position, ...position.adjacentVectors()];
			possiblePositions = possiblePositions.filter(p => !adjacent.some(a => a.equals(p)));
		}
	}


	static spawnRequirements = {
		replaceSolid: (position: Vector, world: World) => {
			const tile = world.tiles.get(position);
			return tile instanceof SolidTile && tile.shape === "solid";
		},
		atLeast2Empty: (position: Vector, world: World) => (
			Directions.DIRECTIONS.filter(d => world.tiles.get(position.add(Vector.unit(d))) === "empty").length >= 2
		),
		noAdjacentGates: (position: Vector, world: World) => (
			!position.adjacentVectors().some(v => world.tiles.get(v) instanceof Gate)
		),
		atLeastLine3Empty: (position: Vector, world: World) => {
			for(const direction of Directions.DIRECTIONS) {
				const firstTile = world.tiles.get(position.add(Vector.unit(direction)));
				if(firstTile instanceof SolidTile) { continue; }
				for(let i = 2; i <= 3; i ++) {
					if(world.tiles.get(position.add(Vector.unit(direction).multiply(i))) !== "empty") {
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
				if(firstTile instanceof SolidTile) { continue; }
				for(let i = 2; i <= 3; i ++) {
					if(
						world.tiles.get(position.add(directionVector.multiply(i))) !== "empty" ||
						world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular1)) !== "empty" ||
						world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular2)) !== "empty"
					) {
						return false;
					}
				}
			}
			return true;
		},
		notOnFloor: (position: Vector, world: World) => {
			return world.tiles.get(position.add(0, -1)) !== "empty";
		}
	};
	spawnLasers(rooms: Vector[], world: World) {
		this.spawnTraps(
			rooms.length * LaserBlockData.LASERS_PER_ROOM,
			LaserBlockData.SPAWN_EVENNESS,
			rooms,
			[
				EntitySpawner.spawnRequirements.replaceSolid,
				EntitySpawner.spawnRequirements.atLeast2Empty,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.notOnFloor,
				LaserBlock.canSpawn
			],
			(position, world) => {
				world.addTile(position, new LaserBlock(
					LaserBlockData.BEAMS_PER_BLOCK,
					GameUtils.random(LaserBlockData.MIN_SPEED, LaserBlockData.MAX_SPEED) * (Math.random() < 0.5 ? -1 : 1),
					GameUtils.random(0, 2 * Math.PI)
				));
			},
			world
		)
	}
}
