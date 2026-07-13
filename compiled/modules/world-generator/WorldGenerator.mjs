import { FloorZero } from "./FloorZero.mjs";
import { GroundGenerator } from "./GroundGenerator.mjs";
import { TowerGenerator } from "./TowerGenerator.mjs";
import { WorldBorderGenerator } from "./WorldBorderGenerator.mjs";
export class WorldGenerator {
    towerGenerator = new TowerGenerator();
    floorZeroGenerator = new FloorZero();
    groundGenerator = new GroundGenerator();
    worldBorderGenerator = new WorldBorderGenerator();
    update(world) {
        this.towerGenerator.update(world);
        this.floorZeroGenerator.update(world);
        this.groundGenerator.update(world);
        this.worldBorderGenerator.update(world);
    }
}
//# sourceMappingURL=WorldGenerator.mjs.map