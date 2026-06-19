import { World } from "../world/World.mjs";
import { TowerGenerator } from "./TowerGenerator.mjs";

export class WorldGenerator {
	towerGenerator: TowerGenerator = new TowerGenerator();

	update(world: World) {
		this.towerGenerator.update(world);
	}
}
