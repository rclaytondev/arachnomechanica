import { LevelGenerator } from "./LevelGenerator.mjs";
import { World } from "./World";

export class WorldGenerator {
	levelGenerator: LevelGenerator = new LevelGenerator();
	world: World = new World();

	generate() {
		// TODO: generate the world
		return this.world;
	}
}
