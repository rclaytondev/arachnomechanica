import { LevelGeneratorData } from "./constants/GameData.mjs";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World";

export class WorldGenerator {
	levelGenerator: LevelGenerator = new LevelGenerator();
	world: World = new World();

	generateRooms() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				// const possibleRooms = ROOMS.filter(room => room.canAdd())
			}
		}
	}

	generate() {
		this.levelGenerator.generate();
		// TODO: generate the world
		return this.world;
	}
}
