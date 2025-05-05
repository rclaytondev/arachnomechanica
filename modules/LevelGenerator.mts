import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { GameUtils } from "./GameUtils.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";

export type RoomPlaceholder = { position: Vector, exits: Direction[], roomType: Room | null, generated: boolean };

export class LevelGenerator {
	static WIDTH = 3;
	static HEIGHT = 5;
	static MARGIN_X = 2;
	static MARGIN_Y = 0;

	static MAIN_PATH_BRANCH_PROBABILITY = 0.6;
	static OFF_PATH_BRANCH_PROBABILITY = 0.6;

	path: RoomPlaceholder[] = [];
	rooms: RoomPlaceholder[] = [];
	world: World = new World();

	generatePath() {
		let x = GameUtils.randomInt(0, LevelGenerator.WIDTH - 1);
		let y = 0;
		this.path.push({ position: new Vector(x, y), exits: [], roomType: null, generated: false });
		while(y < LevelGenerator.HEIGHT - 1) {
			const nextDirection = Utils.randomItem(this.possibleNextDirections(x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			const nextRoom = {
				position: nextPosition,
				exits: [Directions.opposite(nextDirection) as Direction],
				roomType: null,
				generated: false
			};
			this.path.push(nextRoom);
			this.rooms.push(nextRoom);
			[x, y] = [nextPosition.x, nextPosition.y];

			const previousRoom = this.path[this.path.length - 2];
			if(previousRoom) { previousRoom.exits.push(nextDirection); }
		}
	}
	possibleNextDirections(x: number, y: number): Direction[] {
		if(this.path.length <= 1) {
			return [
				...((x > 0) ? ["left"] as const : []),
				...((x < LevelGenerator.WIDTH - 1) ? ["right"] as const : []), 
				"down"
			];
		}
		const lastRoom = this.path[this.path.length - 2];
		const directions: Direction[] = ["down"];
		if(x > 0 && !(x === lastRoom.position.x + 1 && y === lastRoom.position.y)) {
			directions.push("left");
		}
		if(x < LevelGenerator.WIDTH - 1 && !(x === lastRoom.position.x - 1 && y === lastRoom.position.y)) {
			directions.push("right");
		}
		return directions;
	}

	addMargin(room1Position: Vector, room1: Room, room2: Room, direction: "right" | "down", forceSolid: boolean) {
		if(direction === "right") {
			const room1YExits = new Set(room1.getExitCoordinates("right", "y"));
			const room2YExits = new Set(room2.getExitCoordinates("left", "y"));
			const xStart = room1Position.x + Room.SIZE;
			for(let y = room1Position.y; y < room1Position.y + Room.SIZE + LevelGenerator.MARGIN_Y; y ++) {
				if(room1YExits.has(y - room1Position.y) && room2YExits.has(y - room1Position.y) && !forceSolid) {
					continue;
				}
				for(let x = xStart; x < xStart + LevelGenerator.MARGIN_X; x ++) {
					this.world.tiles.set(x, y, "solid");
				}
			}
		}
		else {
			const room1XExits = new Set(room1.getExitCoordinates("down", "x"));
			const room2XExits = new Set(room2.getExitCoordinates("up", "x"));
			const yStart = room1Position.y + Room.SIZE;
			for(let x = room1Position.x; x < room1Position.x + Room.SIZE + LevelGenerator.MARGIN_X; x ++) {
				if(room1XExits.has(x - room1Position.x) && room2XExits.has(x - room1Position.x) && !forceSolid) {
					continue;
				}
				for(let y = yStart; y < yStart + LevelGenerator.MARGIN_Y; y ++) {
					this.world.tiles.set(x, y, "solid");
				}
			}
		}
	}
	generateMargins() {
		for(const room of this.rooms) {
			for(const direction of ["right", "down"] as const) {
				const adjacentRoom = this.rooms.find(p => p.position.equals(room.position.add(Vector.unit(direction))));
				if(adjacentRoom) {
					this.addMargin(
						new Vector(
							room.position.x * (Room.SIZE + LevelGenerator.MARGIN_X), 
							room.position.y * (Room.SIZE + LevelGenerator.MARGIN_Y)
						),
						room.roomType!,
						adjacentRoom.roomType!,
						direction,
						!room.exits.includes(direction)
					);
				}
			}
		}
	}
	generateRoomsOnPath() {
		for(const roomPlaceholder of this.path) {
			const possibleRooms = ROOMS.filter(r => r.canAdd(roomPlaceholder));
			const room = Utils.randomItem(possibleRooms);
			const exits = [...roomPlaceholder.exits];
			for(const possibleExit of room.optionalExits) {
				const adjacentPosition = roomPlaceholder.position.add(Vector.unit(possibleExit));
				if(
					Math.random() < LevelGenerator.MAIN_PATH_BRANCH_PROBABILITY && 
					LevelGenerator.isInBounds(adjacentPosition) &&
					!this.path.some(r => r.position.equals(adjacentPosition))
				) { exits.push(possibleExit); }
			}
			room.add(new Vector(
				roomPlaceholder.position.x * (Room.SIZE + LevelGenerator.MARGIN_X),
				roomPlaceholder.position.y * (Room.SIZE + LevelGenerator.MARGIN_Y)
			), this.world, exits);
			roomPlaceholder.generated = true;
			roomPlaceholder.roomType = room;
			roomPlaceholder.exits = exits;
		}
	}
	generateRoomOffPath() {
		for(let x = 0; x < LevelGenerator.WIDTH; x ++) {
			for(let y = 0; y < LevelGenerator.HEIGHT; y ++) {
				if(this.rooms.some(r => r.position.equals(x, y))) {
					continue;
				}
				const exits = Directions.DIRECTIONS.filter(dir => (
					this.rooms.filter(r => r.position.equals(Vector.unit(dir).add(x, y)))
					.some(r => r.exits.includes(Directions.opposite(dir)))
				));
				if(exits.length > 0) {
					const roomPlaceholder: RoomPlaceholder = {
						position: new Vector(x, y),
						exits: exits,
						roomType: null,
						generated: true
					};
					const possibleRooms = ROOMS.filter(r => r.canAdd(roomPlaceholder));
					const room = Utils.randomItem(possibleRooms);
					for(const exit of room.optionalExits) {
						const adjacentPosition = Vector.unit(exit).add(x, y);
						if(
							Math.random() < LevelGenerator.OFF_PATH_BRANCH_PROBABILITY &&
							LevelGenerator.isInBounds(adjacentPosition) &&
							!this.rooms.some(r => r.position.equals(adjacentPosition)) &&
							!exits.includes(exit)
						) { exits.push(exit); }
					}
					this.rooms.push(roomPlaceholder);
					room.add(new Vector(x * (Room.SIZE + LevelGenerator.MARGIN_X), y * (Room.SIZE + LevelGenerator.MARGIN_Y)), this.world, exits);
					roomPlaceholder.roomType = room;
					return true;
				}
			}
		}
		return false;
	}
	generateRoomsOffPath() {
		let generating = true;
		while(generating) {
			generating = this.generateRoomOffPath();
		}
	}
	fillRoom(x: number, y: number) {
		this.world.tiles.fillRect(new Rectangle(
			x * (Room.SIZE + LevelGenerator.MARGIN_X) - LevelGenerator.MARGIN_X,
			y * (Room.SIZE + LevelGenerator.MARGIN_Y) - LevelGenerator.MARGIN_Y,
			Room.SIZE + 2 * LevelGenerator.MARGIN_X,
			Room.SIZE + 2 * LevelGenerator.MARGIN_Y,
		), "solid");
	}
	fillUnusedRegions() {
		for(let x = 0; x < LevelGenerator.WIDTH; x ++) {
			for(let y = 0; y < LevelGenerator.HEIGHT; y ++) {
				if(!this.rooms.some(r => r.position.equals(x, y))) {
					this.fillRoom(x, y);
				}
			}
		}
	}
	fillBoundaries() {
		this.world.tiles.fillRect(new Rectangle(
			-LevelGenerator.MARGIN_X, -LevelGenerator.MARGIN_Y,
			LevelGenerator.WIDTH * (Room.SIZE + LevelGenerator.MARGIN_X) + LevelGenerator.MARGIN_X,
			LevelGenerator.MARGIN_Y
		), "solid");
		this.world.tiles.fillRect(new Rectangle(
			-LevelGenerator.MARGIN_X, -LevelGenerator.MARGIN_Y,
			LevelGenerator.MARGIN_X,
			LevelGenerator.HEIGHT * (Room.SIZE + LevelGenerator.MARGIN_Y) + LevelGenerator.MARGIN_Y
		), "solid");
		this.world.tiles.fillRect(new Rectangle(
			LevelGenerator.WIDTH * (Room.SIZE + LevelGenerator.MARGIN_X) - LevelGenerator.MARGIN_X, -LevelGenerator.MARGIN_Y,
			LevelGenerator.MARGIN_Y,
			LevelGenerator.HEIGHT * (Room.SIZE + LevelGenerator.MARGIN_Y)
		), "solid");
		this.world.tiles.fillRect(new Rectangle(
			-LevelGenerator.MARGIN_X, LevelGenerator.HEIGHT * (Room.SIZE + LevelGenerator.MARGIN_Y) - LevelGenerator.MARGIN_Y, 
			LevelGenerator.WIDTH * (Room.SIZE + LevelGenerator.MARGIN_X) + LevelGenerator.MARGIN_X,
			LevelGenerator.MARGIN_Y,
		), "solid");
	}
	spawnPlayer() {
		const lastRoom = this.path[this.path.length - 1];
		this.world.player.physicsObject.positionInt = lastRoom.position.add(1/2, 1/2).multiply(World.TILE_SIZE * Room.SIZE);
	}
	spawnLizards() {
		const positions = [];
		const totalLizards = Math.ceil(LevelGenerator.WIDTH * LevelGenerator.HEIGHT * Lizard.LIZARDS_PER_ROOM);
		let amountSpawned = 0;
		while(amountSpawned < totalLizards) {
			const position = GameUtils.randomEvenlySpaced(
				new Rectangle(
					0, 0,
					LevelGenerator.WIDTH * (Room.SIZE + LevelGenerator.MARGIN_X) - LevelGenerator.MARGIN_X - 1,
					LevelGenerator.HEIGHT * (Room.SIZE + LevelGenerator.MARGIN_Y) - LevelGenerator.MARGIN_Y - 1
				),
				positions,
				Lizard.SPAWN_EVENNESS,
				"int"
			);
			const direction = Utils.randomItem(Directions.DIRECTIONS);
			const length = GameUtils.randomInt(Lizard.MIN_LENGTH, Lizard.MAX_LENGTH);
			const lizard = new Lizard(
				position.add(1/2, 1/2).multiply(World.TILE_SIZE), 
				direction, length * World.TILE_SIZE, Lizard.SPEED
			);
			if(lizard.canSpawn(this.world)) {
				this.world.creatures.push(lizard);
				positions.push(position);
				amountSpawned ++;
			}
		}
		console.log(this.world.creatures.length);
	}
	generate(): World {
		this.generatePath();
		this.generateRoomsOnPath();
		this.generateRoomsOffPath();
		this.generateMargins();
		this.fillUnusedRegions();
		this.fillBoundaries();
		this.spawnPlayer();
		this.spawnLizards();
		return this.world;
	}

	static isInBounds(roomPosition: Vector) {
		return (
			0 < roomPosition.x && roomPosition.x < LevelGenerator.WIDTH &&
			0 < roomPosition.y && roomPosition.y < LevelGenerator.HEIGHT
		);
	}
}
