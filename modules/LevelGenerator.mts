import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";

export type RoomPlaceholder = { position: Vector, exits: Direction[] };

export class LevelGenerator {
	static WIDTH = 3;
	static HEIGHT = 5;

	static generatePath() {
		const rooms: RoomPlaceholder[] = [];
		let x = GameUtils.randomInt(0, LevelGenerator.WIDTH - 1);
		let y = 0;
		rooms.push({ position: new Vector(x, y), exits: [] });
		while(y < LevelGenerator.HEIGHT) {
			const nextDirection = Utils.randomItem(LevelGenerator.possibleNextDirections(rooms, x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			rooms.push({ position: nextPosition, exits: [Directions.opposite(nextDirection)] });
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

	static generate(): World {
		const path = LevelGenerator.generatePath();
		const world = new World();
		for(const roomPlaceholder of path) {
			const possibleRooms = ROOMS.filter(r => r.canAdd(roomPlaceholder));
			const room = Utils.randomItem(possibleRooms);
			room.add(roomPlaceholder.position.multiply(Room.SIZE), world, roomPlaceholder.exits);
		}

		const lastRoom = path[path.length - 1];
		world.player.physicsObject.positionInt = lastRoom.position.add(1/2, 1/2).multiply(World.TILE_SIZE * Room.SIZE)

		return world;
	}
}
