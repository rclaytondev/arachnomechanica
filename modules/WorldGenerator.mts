import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { LevelGeneratorData, RoomData, WorldData } from "./constants/GameData.mjs";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";

export class WorldGenerator {
	levelGenerator: LevelGenerator = new LevelGenerator();
	world: World = new World();

	generateRooms() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				const roomPlaceholder = this.levelGenerator.rooms.get(x, y);
				if(!roomPlaceholder) { continue; }
				const possibleRooms = ROOMS.filter(room => room.canAdd(roomPlaceholder));
				const room = Utils.randomItem(possibleRooms);
				room.add(new Vector(
					x * (RoomData.SIZE + LevelGeneratorData.MARGIN_X),
					y * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)
				), this.world, roomPlaceholder.exits);
			}
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
				if(this.levelGenerator.rooms.get(x, y) === null) {
					this.fillRoom(x, y);
				}
			}
		}
	}
	spawnPlayer() {
		const lastRoom = this.levelGenerator.path[this.levelGenerator.path.length - 1];
		this.world.player.physicsObject.positionInt = lastRoom.add(1/2, 1/2).multiply(WorldData.TILE_SIZE * RoomData.SIZE);
	}

	generate() {
		this.levelGenerator.generate();
		this.generateRooms();
		this.fillUnusedRegions();
		this.spawnPlayer();
		return this.world;
	}
}
