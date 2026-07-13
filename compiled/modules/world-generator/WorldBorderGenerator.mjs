import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData, WorldGeneratorData } from "../constants/GameData.mjs";
import { WorldBorder } from "../entities/WorldBorder.mjs";
import { FloorZero } from "./FloorZero.mjs";
import { WorldGenerationSegment } from "./WorldGenerationSegment.mjs";
export class WorldBorderGenerator extends WorldGenerationSegment {
    generated = false;
    shouldGenerate() {
        return !this.generated;
    }
    generate(world) {
        const floorZero = FloorZero.getRegion();
        world.entities.add(new WorldBorder(Rectangle.fromBounds(-Infinity, WorldData.TILE_SIZE * (floorZero.left - WorldGeneratorData.TOWER_OUTSIDE_WIDTH), -Infinity, Infinity)));
        world.entities.add(new WorldBorder(Rectangle.fromBounds(WorldData.TILE_SIZE * (floorZero.right + WorldGeneratorData.TOWER_OUTSIDE_WIDTH), Infinity, -Infinity, Infinity)));
        world.entities.add(new WorldBorder(Rectangle.fromBounds(-Infinity, Infinity, WorldData.TILE_SIZE * (floorZero.y + WorldGeneratorData.GROUND_OFFSET + WorldGeneratorData.GROUND_DEPTH), Infinity)));
        this.generated = true;
    }
}
//# sourceMappingURL=WorldBorderGenerator.mjs.map