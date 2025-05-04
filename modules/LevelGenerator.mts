import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";

export type RoomPlaceholder = { position: Vector, exits: Direction[], roomType: Room | null, generated: boolean };

export class LevelGenerator {
	static WIDTH = 3;
	static HEIGHT = 5;
	static MARGIN = 2;

	static MAIN_PATH_BRANCH_PROBABILITY = 0.35;

	path: RoomPlaceholder[] = [];
	world: World = new World();

	generatePath() {
		let x = GameUtils.randomInt(0, LevelGenerator.WIDTH - 1);
		let y = 0;
		this.path.push({ position: new Vector(x, y), exits: [], roomType: null, generated: false });
		while(y < LevelGenerator.HEIGHT) {
			const nextDirection = Utils.randomItem(this.possibleNextDirections(x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			this.path.push({
				position: nextPosition,
				exits: [Directions.opposite(nextDirection)],
				roomType: null,
				generated: false
			});
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

	addMargin(room1Position: Vector, room1: Room, room2: Room, direction: "right" | "down") {
		if(direction === "right") {
			const room1YExits = new Set(room1.getExitCoordinates("right", "y"));
			const room2YExits = new Set(room2.getExitCoordinates("left", "y"));
			const xStart = room1Position.x + Room.SIZE;
			for(let y = room1Position.y; y < room1Position.y + Room.SIZE + LevelGenerator.MARGIN; y ++) {
				if(room1YExits.has(y - room1Position.y) && room2YExits.has(y - room1Position.y)) {
					continue;
				}
				for(let x = xStart; x < xStart + LevelGenerator.MARGIN; x ++) {
					this.world.tiles.set(x, y, "solid");
				}
			}
		}
		else {
			const room1XExits = new Set(room1.getExitCoordinates("down", "x"));
			const room2XExits = new Set(room2.getExitCoordinates("up", "x"));
			const yStart = room1Position.y + Room.SIZE;
			for(let x = room1Position.x; x < room1Position.x + Room.SIZE + LevelGenerator.MARGIN; x ++) {
				if(room1XExits.has(x - room1Position.x) && room2XExits.has(x - room1Position.x)) {
					continue;
				}
				for(let y = yStart; y < yStart + LevelGenerator.MARGIN; y ++) {
					this.world.tiles.set(x, y, "solid");
				}
			}
		}
	}
	generateMargins() {
		for(const room of this.path) {
			for(const direction of ["right", "down"] as const) {
				const adjacentRoom = this.path.find(p => p.position.equals(room.position.add(Vector.unit(direction))));
				if(adjacentRoom) {
					this.addMargin(
						room.position.multiply(Room.SIZE + LevelGenerator.MARGIN),
						room.roomType!,
						adjacentRoom.roomType!,
						direction
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
			room.add(roomPlaceholder.position.multiply(Room.SIZE + LevelGenerator.MARGIN), this.world, exits);
			roomPlaceholder.generated = true;
			roomPlaceholder.roomType = room;
		}
	}
	spawnPlayer() {
		const lastRoom = this.path[this.path.length - 1];
		this.world.player.physicsObject.positionInt = lastRoom.position.add(1/2, 1/2).multiply(World.TILE_SIZE * Room.SIZE);
	}
	generate(): World {
		this.generatePath();
		this.generateRoomsOnPath();
		this.generateMargins();
		this.spawnPlayer();
		return this.world;
	}

	static isInBounds(roomPosition: Vector) {
		return (
			0 < roomPosition.x && roomPosition.x < LevelGenerator.WIDTH &&
			0 < roomPosition.y && roomPosition.y < LevelGenerator.HEIGHT
		);
	}
}
