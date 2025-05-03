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

	static generatePath() {
		const rooms: RoomPlaceholder[] = [];
		let x = GameUtils.randomInt(0, LevelGenerator.WIDTH - 1);
		let y = 0;
		rooms.push({ position: new Vector(x, y), exits: [], roomType: null, generated: false });
		while(y < LevelGenerator.HEIGHT) {
			const nextDirection = Utils.randomItem(LevelGenerator.possibleNextDirections(rooms, x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			rooms.push({
				position: nextPosition,
				exits: [Directions.opposite(nextDirection)],
				roomType: null,
				generated: false
			});
			[x, y] = [nextPosition.x, nextPosition.y];

			const previousRoom = rooms[rooms.length - 2];
			if(previousRoom) { previousRoom.exits.push(nextDirection); }
		}
		return rooms;
	}
	static possibleNextDirections(rooms: RoomPlaceholder[], x: number, y: number): Direction[] {
		if(rooms.length <= 1) {
			return [
				...((x > 0) ? ["left"] as const : []),
				...((x < LevelGenerator.WIDTH - 1) ? ["right"] as const : []), 
				"down"
			];
		}
		const lastRoom = rooms[rooms.length - 2];
		const directions: Direction[] = ["down"];
		if(x > 0 && !(x === lastRoom.position.x + 1 && y === lastRoom.position.y)) {
			directions.push("left");
		}
		if(x < LevelGenerator.WIDTH - 1 && !(x === lastRoom.position.x - 1 && y === lastRoom.position.y)) {
			directions.push("right");
		}
		return directions;
	}

	static addMargin(room1Position: Vector, room1: Room, room2: Room, direction: "right" | "down", world: World) {
		if(direction === "right") {
			const room1YExits = new Set(room1.getExitCoordinates("right", "y"));
			const room2YExits = new Set(room2.getExitCoordinates("left", "y"));
			const xStart = room1Position.x + Room.SIZE;
			for(let y = room1Position.y; y < room1Position.y + Room.SIZE + LevelGenerator.MARGIN; y ++) {
				if(room1YExits.has(y - room1Position.y) && room2YExits.has(y - room1Position.y)) {
					continue;
				}
				for(let x = xStart; x < xStart + LevelGenerator.MARGIN; x ++) {
					world.tiles.set(x, y, "solid");
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
					world.tiles.set(x, y, "solid");
				}
			}
		}
	}
	static generateMargins(path: RoomPlaceholder[], world: World) {
		for(const room of path) {
			for(const direction of ["right", "down"] as const) {
				const adjacentRoom = path.find(p => p.position.equals(room.position.add(Vector.unit(direction))));
				if(adjacentRoom) {
					LevelGenerator.addMargin(
						room.position.multiply(Room.SIZE + LevelGenerator.MARGIN),
						room.roomType!,
						adjacentRoom.roomType!,
						direction,
						world
					);
				}
			}
		}
	}
	static generate(): World {
		const path = LevelGenerator.generatePath();
		const world = new World();
		for(const roomPlaceholder of path) {
			const possibleRooms = ROOMS.filter(r => r.canAdd(roomPlaceholder));
			const room = Utils.randomItem(possibleRooms);
			room.add(roomPlaceholder.position.multiply(Room.SIZE + LevelGenerator.MARGIN), world, roomPlaceholder.exits);
			roomPlaceholder.generated = true;
			roomPlaceholder.roomType = room;
		}

		LevelGenerator.generateMargins(path, world);

		const lastRoom = path[path.length - 1];
		world.player.physicsObject.positionInt = lastRoom.position.add(1/2, 1/2).multiply(World.TILE_SIZE * Room.SIZE)

		return world;
	}
}
