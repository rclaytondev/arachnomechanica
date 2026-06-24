import { World } from "../world/World.mjs";
import { FloorZero } from "./FloorZero.mjs";
import { GroundGenerator } from "./GroundGenerator.mjs";
import { TowerGenerator } from "./TowerGenerator.mjs";

export class WorldGenerator {
	towerGenerator: TowerGenerator = new TowerGenerator();
	floorZeroGenerator: FloorZero = new FloorZero();
	groundGenerator: GroundGenerator = new GroundGenerator();

	update(world: World) {
		this.towerGenerator.update(world);
		this.floorZeroGenerator.update(world);
		this.groundGenerator.update(world);
	}
}
