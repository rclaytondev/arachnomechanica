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

	generate() {
		this.levelGenerator.generate();
		this.generateRooms();
		// TODO: generate the world
		return this.world;
	}
}
