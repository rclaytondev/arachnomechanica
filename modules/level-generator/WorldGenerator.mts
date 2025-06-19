import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { LaserBlockData, LevelGeneratorData, LizardData, RoomData, SpikeballBlockData, WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.js";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "../World.js";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { SpikeballBlock } from "../tiles/SpikeballBlock.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";

export class WorldGenerator {
	levelGenerator: LevelGenerator = new LevelGenerator();
	position: Vector;
	world: World;
	rooms: Grid<Room | null> = new Grid(null);

	constructor(position: Vector = new Vector(0, 0), world: World = new World()) {
		this.position = position;
		this.world = world;
	}

	generateRooms() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				const roomPlaceholder = this.levelGenerator.rooms.get(x, y);
				if(!roomPlaceholder) { continue; }
				const possibleRooms = ROOMS.filter(
					room => room.canAdd(roomPlaceholder)
					&& room.hasPortal() === this.levelGenerator.path[0].equals(x, y)
				);
				const room = GameUtils.weightedRandom(possibleRooms, possibleRooms.map(r => r.weight));
				room.add(new Vector(
					this.position.x + x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
					this.position.y + y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
				), this.world, roomPlaceholder.exits);
				this.rooms.set(x, y, room);
			}
		}
	}
	fillRoom(x: number, y: number) {
		this.world.tiles.fillRect(new Rectangle(
			this.position.x + x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
			this.position.y + y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y),
			RoomData.SIZE,
			RoomData.SIZE,
		), new SolidTile("solid", "tower"));
	}
	fillUnusedRegions() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				if(this.levelGenerator.rooms.get(x, y) === null) {
					this.fillRoom(x, y);
				}
			}
		}
	}
	addMargin(room1Position: Vector, room1: Room, room2: Room, direction: "right" | "down", forceSolid: boolean) {
		if(direction === "right") {
			const room1YExits = new Set(room1.getExitCoordinates("right", "y"));
			const room2YExits = new Set(room2.getExitCoordinates("left", "y"));
			const xStart = room1Position.x + RoomData.SIZE;
			for(let y = room1Position.y; y < room1Position.y + RoomData.SIZE; y ++) {
				if(room1YExits.has(y - room1Position.y) && room2YExits.has(y - room1Position.y) && !forceSolid) {
					continue;
				}
				for(let x = xStart; x < xStart + LevelGeneratorData.MARGIN_X; x ++) {
					this.world.tiles.set(x, y, new SolidTile("solid", "tower"));
				}
			}
		}
		else {
			const room1XExits = new Set(room1.getExitCoordinates("down", "x"));
			const room2XExits = new Set(room2.getExitCoordinates("up", "x"));
			const yStart = room1Position.y + RoomData.SIZE;
			for(let x = room1Position.x; x < room1Position.x + RoomData.SIZE; x ++) {
				if(room1XExits.has(x - room1Position.x) && room2XExits.has(x - room1Position.x) && !forceSolid) {
					continue;
				}
				for(let y = yStart; y < yStart + LevelGeneratorData.MARGIN_Y; y ++) {
					this.world.tiles.set(x, y, new SolidTile("solid", "tower"));
				}
			}
		}
	}
	addSolidMargin(room1Position: Vector, direction: "right" | "down") {
		if(direction === "right") {
			const xStart = room1Position.x + RoomData.SIZE;
			this.world.tiles.fillRect(new Rectangle(
				xStart, room1Position.y, 
				LevelGeneratorData.MARGIN_X, RoomData.SIZE
			), new SolidTile("solid", "tower"));
		}
		else {
			const yStart = room1Position.y + RoomData.SIZE;
			this.world.tiles.fillRect(new Rectangle(
				room1Position.x, yStart,
				RoomData.SIZE, LevelGeneratorData.MARGIN_Y
			), new SolidTile("solid", "tower"));
		}
	}
	generateMargins() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				const room = this.rooms.get(x, y);
				const position = new Vector(
					this.position.x + x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
					this.position.y + y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
				);
				for(const direction of ["right", "down"] as const) {
					if(
						(direction === "right" && x === LevelGeneratorData.WIDTH - 1) || 
						(direction === "down" && y === LevelGeneratorData.HEIGHT - 1)
					) { continue; }
					const adjacentRoom = this.rooms.get(Vector.unit(direction).add(x, y));
					if(room && adjacentRoom) {
						this.addMargin(
							position,
							room, adjacentRoom, direction,
							!this.levelGenerator.rooms.get(x, y)!.exits.includes(direction)
						);
					}
					else {
						this.addSolidMargin(position, direction);
					}
				}

				if(x < LevelGeneratorData.WIDTH - 1 && y < LevelGeneratorData.HEIGHT - 1) {
					this.world.tiles.fillRect(new Rectangle(
						this.position.x + position.x + RoomData.SIZE, this.position.y + position.y + RoomData.SIZE, 
						LevelGeneratorData.MARGIN_X, LevelGeneratorData.MARGIN_Y
					), new SolidTile("solid", "tower"));
				}
			}
		}
	}
	fillBoundaries() {
		this.world.tiles.fillRect(new Rectangle(
			this.position.x - LevelGeneratorData.BORDER_X, this.position.y - LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) + LevelGeneratorData.BORDER_X - LevelGeneratorData.MARGIN_X,
			LevelGeneratorData.BORDER_Y
		), new SolidTile("solid", "tower"));
		this.world.tiles.fillRect(new Rectangle(
			this.position.x - LevelGeneratorData.BORDER_X, this.position.y,
			LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
		), new SolidTile("solid", "tower"));
		this.world.tiles.fillRect(new Rectangle(
			this.position.x + LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) - LevelGeneratorData.MARGIN_X, this.position.y - LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) + LevelGeneratorData.BORDER_Y
		), new SolidTile("solid", "tower"));
		this.world.tiles.fillRect(new Rectangle(
			this.position.x - LevelGeneratorData.BORDER_X, this.position.y + LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) - LevelGeneratorData.MARGIN_Y, 
			LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) + 2 * LevelGeneratorData.BORDER_X - LevelGeneratorData.MARGIN_X,
			LevelGeneratorData.BORDER_Y,
		), new SolidTile("solid", "tower"));
	}


	spawnPlayer() {
		const lastRoom = this.levelGenerator.path[this.levelGenerator.path.length - 1];
		const emptyTiles = [];
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const position = new Vector(
					this.position.x + lastRoom.x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) + x,
					this.position.y + lastRoom.y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) + y
				);
				const tileBelow = this.world.tiles.get(position.x, position.y + 1);
				if(this.world.tiles.get(position) === "empty" && tileBelow instanceof SolidTile && tileBelow.shape === "solid") {
					emptyTiles.push(position);
				}
			}
		}
		const tile = Utils.randomItem(emptyTiles);
		this.world.player.physicsObject.positionInt = tile.multiply(WorldData.TILE_SIZE)
		this.world.camera = this.world.player.physicsObject.hitbox().center();
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
	
	spawnLizards() {
		const positions = [];
		const totalLizards = Math.ceil(LevelGeneratorData.WIDTH * LevelGeneratorData.HEIGHT * LizardData.LIZARDS_PER_ROOM);
		let amountSpawned = 0;
		while(amountSpawned < totalLizards) {
			const position = GameUtils.randomEvenlySpaced(
				new Rectangle(
					this.position.x, this.position.y,
					LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) - LevelGeneratorData.MARGIN_X - 1,
					LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) - LevelGeneratorData.MARGIN_Y - 1
				),
				positions,
				LizardData.SPAWN_EVENNESS,
				"int"
			);
			const direction = Utils.randomItem(Directions.DIRECTIONS);
			const length = GameUtils.randomInt(LizardData.MIN_LENGTH, LizardData.MAX_LENGTH);
			const lizard = new Lizard(
				position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE), 
				direction, (length + 1/2) * WorldData.TILE_SIZE, LizardData.SPEED
			);
			if(lizard.canSpawn(this.world)) {
				this.world.entities.push(lizard);
				positions.push(position);
				amountSpawned ++;
			}
		}
		console.log(this.world.entities.length);
	}
	spawnLasers(trapPositions: Vector[] = []) {
		return this.spawnTraps(
			LaserBlockData.LASERS_PER_ROOM,
			[
				WorldGenerator.spawnRequirements.replaceSolid,
				WorldGenerator.spawnRequirements.atLeast2Empty,
				WorldGenerator.spawnRequirements.noAdjacentGates,
				WorldGenerator.spawnRequirements.notOnFloor,
				LaserBlock.canSpawn
			],
			(x, y, world) => {
				world.addTile(new Vector(x, y), new LaserBlock(
					LaserBlockData.BEAMS_PER_BLOCK,
					GameUtils.random(LaserBlockData.MIN_SPEED, LaserBlockData.MAX_SPEED) * (Math.random() < 0.5 ? -1 : 1),
					GameUtils.random(0, 2 * Math.PI)
				));
			},
			trapPositions
		);
	}
	spawnSpikeballBlocks(trapPositions: Vector[] = []) {
		return this.spawnTraps(
			SpikeballBlockData.SPIKEBALLS_PER_ROOM,
			[
				WorldGenerator.spawnRequirements.replaceSolid,
				WorldGenerator.spawnRequirements.noAdjacentGates,
				WorldGenerator.spawnRequirements.atLeast3RectEmpty,
				SpikeballBlock.canSpawn,
			],
			(x: number, y: number, world: World) => {
				world.addTile(new Vector(x, y), new SpikeballBlock(Utils.randomItem(SpikeballBlockData.PATTERNS)));
			},
			trapPositions
		);
	}
	spawnAllTraps() {
		const positions = this.spawnLasers();
		// this.spawnSpikeballBlocks(positions);
	}
	spawnTraps(density: number, requirements: ((position: Vector, world: World) => boolean)[], spawn: (x: number, y: number, world: World) => void, positionsSpawned: Vector[] = []) {
		let possiblePositions: Vector[] = [];
		for(let x = -1; x < LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) + 1; x ++) {
			for(let y = -1; y < LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) + 1; y ++) {
				const position = new Vector(this.position.x + x, this.position.y + y);
				if(requirements.every(r => r(position, this.world))) {
					possiblePositions.push(position);
				}
			}
		}
		const totalTraps = Math.ceil(LevelGeneratorData.WIDTH * LevelGeneratorData.HEIGHT * density);
		let amountSpawned = 0;
		while(amountSpawned < totalTraps && possiblePositions.length > 0) {
			const next = GameUtils.randomEvenlySpaced(
				new Rectangle(0, 0, 0, 0),
				positionsSpawned,
				LaserBlockData.SPAWN_EVENNESS,
				"int",
				() => Utils.randomItem(possiblePositions)
			);
			spawn(next.x, next.y, this.world);
			positionsSpawned.push(next);
			for(const neighbor of [next, ...Directions.DIRECTIONS.map(d => next.add(Vector.unit(d)))]) {
				possiblePositions = possiblePositions.filter(p => !p.equals(neighbor));
			}
			amountSpawned ++;
		}
		return positionsSpawned;
	}

	generate() {
		this.levelGenerator.generate();
		this.generateRooms();
		this.fillUnusedRegions();
		this.generateMargins();
		this.fillBoundaries();
		this.spawnPlayer();
		this.spawnLizards();
		this.spawnAllTraps();
		this.world.levels ++;
		return this.world;
	}
}
