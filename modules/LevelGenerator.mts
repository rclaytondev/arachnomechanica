import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { GameUtils } from "./GameUtils.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";
import { LevelGeneratorData, LizardData, RoomData, WorldData } from "./constants/GameData.mjs";

export type RoomPlaceholder = { position: Vector, exits: Direction[], roomType: Room | null, generated: boolean };

export class LevelGenerator {
	path: RoomPlaceholder[] = [];
	rooms: RoomPlaceholder[] = [];
	world: World = new World();

	generatePath() {
		let x = GameUtils.randomInt(0, LevelGeneratorData.WIDTH - 1);
		let y = 0;
		this.path.push({ position: new Vector(x, y), exits: [], roomType: null, generated: false });
		while(y < LevelGeneratorData.HEIGHT - 1) {
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
				...((x < LevelGeneratorData.WIDTH - 1) ? ["right"] as const : []), 
				"down"
			];
		}
		const lastRoom = this.path[this.path.length - 2];
		const directions: Direction[] = ["down"];
		if(x > 0 && !(x === lastRoom.position.x + 1 && y === lastRoom.position.y)) {
			directions.push("left");
		}
		if(x < LevelGeneratorData.WIDTH - 1 && !(x === lastRoom.position.x - 1 && y === lastRoom.position.y)) {
			directions.push("right");
		}
		return directions;
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
					this.world.tiles.set(x, y, "solid");
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
					this.world.tiles.set(x, y, "solid");
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
			), "solid");
		}
		else {
			const yStart = room1Position.y + RoomData.SIZE;
			this.world.tiles.fillRect(new Rectangle(
				room1Position.x, yStart,
				RoomData.SIZE, LevelGeneratorData.MARGIN_Y
			), "solid");
		}
	}
	generateMargins() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				const room = this.rooms.find(p => p.position.equals(x, y));
				const position = new Vector(
					x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
					y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
				);
				for(const direction of ["right", "down"] as const) {
					if(
						(direction === "right" && x === LevelGeneratorData.WIDTH - 1) || 
						(direction === "down" && y === LevelGeneratorData.HEIGHT - 1)
					) { continue; }
					const adjacentRoom = this.rooms.find(p => Vector.unit(direction).add(x, y));
					if(room && adjacentRoom) {
						this.addMargin(
							position,
							room.roomType!, adjacentRoom.roomType!, direction,
							!room.exits.includes(direction)
						);
					}
					else {
						this.addSolidMargin(position, direction);
					}
				}

				if(x < LevelGeneratorData.WIDTH - 1 && y < LevelGeneratorData.HEIGHT - 1) {
					this.world.tiles.fillRect(new Rectangle(
						position.x + RoomData.SIZE, position.y + RoomData.SIZE, 
						LevelGeneratorData.MARGIN_X, LevelGeneratorData.MARGIN_Y
					), "solid");
				}
			}
		}
		for(const room of this.rooms) {
			for(const direction of ["right", "down"] as const) {
				const adjacentRoom = this.rooms.find(p => p.position.equals(room.position.add(Vector.unit(direction))));
				if(adjacentRoom) {
					this.addMargin(
						new Vector(
							room.position.x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X), 
							room.position.y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
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
			const room = this.chooseRoom(roomPlaceholder.exits);
			const exits = [...roomPlaceholder.exits];
			for(const possibleExit of room.optionalExits) {
				const adjacentPosition = roomPlaceholder.position.add(Vector.unit(possibleExit));
				if(
					Math.random() < LevelGeneratorData.MAIN_PATH_BRANCH_PROBABILITY && 
					LevelGenerator.isInBounds(adjacentPosition) &&
					!this.path.some(r => r.position.equals(adjacentPosition))
				) { exits.push(possibleExit); }
			}
			room.add(new Vector(
				roomPlaceholder.position.x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
				roomPlaceholder.position.y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
			), this.world, exits);
			roomPlaceholder.generated = true;
			roomPlaceholder.roomType = room;
			roomPlaceholder.exits = exits;
		}
	}
	generateRoomOffPath() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
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
					const room = this.chooseRoom(exits);
					for(const exit of room.optionalExits) {
						const adjacentPosition = Vector.unit(exit).add(x, y);
						if(
							Math.random() < LevelGeneratorData.OFF_PATH_BRANCH_PROBABILITY &&
							LevelGenerator.isInBounds(adjacentPosition) &&
							!this.rooms.some(r => r.position.equals(adjacentPosition)) &&
							!exits.includes(exit)
						) { exits.push(exit); }
					}
					this.rooms.push(roomPlaceholder);
					room.add(new Vector(x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X), y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)), this.world, exits);
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
			x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
			y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y),
			RoomData.SIZE,
			RoomData.SIZE,
		), "solid");
	}
	fillUnusedRegions() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				if(!this.rooms.some(r => r.position.equals(x, y))) {
					this.fillRoom(x, y);
				}
			}
		}
	}
	fillBoundaries() {
		this.world.tiles.fillRect(new Rectangle(
			-LevelGeneratorData.BORDER_X, -LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) + LevelGeneratorData.BORDER_X - LevelGeneratorData.MARGIN_X,
			LevelGeneratorData.BORDER_Y
		), "solid");
		this.world.tiles.fillRect(new Rectangle(
			-LevelGeneratorData.BORDER_X, 0,
			LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
		), "solid");
		this.world.tiles.fillRect(new Rectangle(
			LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) - LevelGeneratorData.MARGIN_X, -LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) + LevelGeneratorData.BORDER_Y
		), "solid");
		this.world.tiles.fillRect(new Rectangle(
			-LevelGeneratorData.BORDER_X, LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) - LevelGeneratorData.MARGIN_Y, 
			LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) + 2 * LevelGeneratorData.BORDER_X - LevelGeneratorData.MARGIN_X,
			LevelGeneratorData.BORDER_Y,
		), "solid");
	}
	spawnPlayer() {
		const lastRoom = this.path[this.path.length - 1];
		this.world.player.physicsObject.positionInt = lastRoom.position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE * RoomData.SIZE);
	}
	spawnLizards() {
		const positions = [];
		const totalLizards = Math.ceil(LevelGeneratorData.WIDTH * LevelGeneratorData.HEIGHT * LizardData.LIZARDS_PER_ROOM);
		let amountSpawned = 0;
		while(amountSpawned < totalLizards) {
			const position = GameUtils.randomEvenlySpaced(
				new Rectangle(
					0, 0,
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
				direction, length * WorldData.TILE_SIZE, LizardData.SPEED
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
			0 < roomPosition.x && roomPosition.x < LevelGeneratorData.WIDTH &&
			0 < roomPosition.y && roomPosition.y < LevelGeneratorData.HEIGHT
		);
	}
	chooseRoom(exitDirections: Direction[]) {
		const possibleRooms = ROOMS.filter(r => r.canAdd(exitDirections));
		const room = Utils.randomItem(possibleRooms);
		return room;
	}

	static initializeRooms() {
		const length = ROOMS.length;
		for(let i = 0; i < length; i ++) {
			ROOMS.push(ROOMS[i].reflect());
		}
	}
}
