import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { LaserBlockData, LizardData, RoomData, SpiderData, SpikeballBlockData, WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.js";
import { PointOnSurface, Spider, Surface } from "../entities/Spider.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";
import { SpikeballBlock } from "../tiles/SpikeballBlock.mjs";
import { World } from "../world/World.js";

type Feature = "lizards" | "spiders" | "lasers" | "spikeballs";

export class EntitySpawner {
	static FEATURES = ["lizards", "spiders", "lasers", "spikeballs"] as const;
	static randomFeatures(): Feature[] {
		return GameUtils.randomPermutation([...EntitySpawner.FEATURES]).slice(0, 2);
	}

	spawnAllEntities(tileRegion: Rectangle, world: World) {
		const features = EntitySpawner.randomFeatures();
		if(features.includes("lasers")) {
			this.spawnLasers(tileRegion, world);
		}
		if(features.includes("spikeballs")) {
			this.spawnSpikeballBlocks(tileRegion, world);
		}
		if(features.includes("lizards")) {
			this.spawnLizards(tileRegion, world);
		}
		if(features.includes("spiders")) {
			this.spawnSpiders(tileRegion, world);
		}
	}


	spawnEntities(amount: number, evenness: number, tileRegion: Rectangle, requirements: ((position: Vector, world: World) => boolean)[], spawn: (position: Vector, world: World) => void, world: World) {
		const positions = tileRegion.squares();
		let possiblePositions = positions.filter(position => requirements.every(r => r(position, world)));
		const spawnedPositions: Vector[] = [];
		while(spawnedPositions.length < amount && possiblePositions.length > 0) {
			const [position] = GameUtils.randomEvenlySpaced({
				generate: () => Utils.randomItem(possiblePositions),
				metric: Vector.dist,
				amount: 1,
				trials: evenness,
				previousPoints: spawnedPositions,
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
		replaceEmpty: (position: Vector, world: World) => world.tiles.get(position) === "empty",
		solidAdjacent: (position: Vector, world: World) => Directions.DIRECTIONS.some(direction => {
			const tile = world.tiles.get(position.add(Vector.unit(direction)));
			return tile instanceof SolidTile && tile.shape === "solid";
		}),
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
		},
	};
	spawnLasers(tileRegion: Rectangle, world: World) {
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
				const direction = (Math.random() < 0.5) ? 1 : -1;
				world.addTile(position, new LaserBlock(
					LaserBlockData.BEAMS_PER_BLOCK,
					LaserBlockData.SPEED * direction,
					GameUtils.random(0, 2 * Math.PI),
					direction,
				));
			},
			world,
		);
	}
	spawnSpikeballBlocks(tileRegion: Rectangle, world: World) {
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
				world.addTile(position, new SpikeballBlock(Utils.randomItem(SpikeballBlockData.PATTERNS)));
			},
			world,
		);
	}
	spawnLizards(tileRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * LizardData.LIZARDS_PER_ROOM,
			LizardData.SPAWN_EVENNESS,
			tileRegion,
			[EntitySpawner.spawnRequirements.replaceEmpty],
			(position: Vector, world: World) => {
				const direction = Utils.randomItem(Directions.DIRECTIONS);
				let distance = 0;
				for(; distance < LizardData.MAX_LENGTH; distance ++) {
					const empty = world.tiles.get(position.add(Vector.unit(direction).multiply(distance))) === "empty";
					if(!empty) {
						distance --;
						break;
					}
				}
				if(distance >= LizardData.MIN_LENGTH) {
					world.addEntityIfEmpty(new Lizard(
						position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
						direction,
						(GameUtils.randomInt(LizardData.MIN_LENGTH, distance) + 1/2) * WorldData.TILE_SIZE,
						LizardData.SPEED,
					));
				}
			},
			world,
		);
	}
	spawnSpiders(tileRegion: Rectangle, world: World) {
		this.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * SpiderData.SPIDERS_PER_ROOM,
			SpiderData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceEmpty,
				EntitySpawner.spawnRequirements.solidAdjacent,
			],
			(position: Vector, world: World) => {
				const direction = Directions.DIRECTIONS.find(dir => {
					const tile = world.tiles.get(position.add(Vector.unit(dir)));
					return tile instanceof SolidTile && tile.shape === "solid";
				})!;
				const spider = new Spider(position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE));
				const surfacePoint = {
					"left": position,
					"right": position.add(1, 0),
					"up": position,
					"down": position.add(0, 1),
				}[direction];
				spider.basepoint = new PointOnSurface(
					new Surface(surfacePoint, Directions.opposite[direction]),
					WorldData.TILE_SIZE / 2,
				);
				world.addEntityIfEmpty(spider);
			},
			world,
		);
	}
}
