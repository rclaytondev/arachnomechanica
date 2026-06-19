import { World } from "../world/World.mjs";

export abstract class WorldGenerationSegment {
	abstract shouldGenerate(world: World): boolean;
	abstract generate(world: World): void;

	update(world: World) {
		if(this.shouldGenerate(world)) {
			this.generate(world);
		}
	}
}
