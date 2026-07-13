import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Octants } from "../game-utilities/Octant.mjs";
export class Tile {
    static fullAngularMotionBlockers(tilePosition, point) {
        const rect = Rectangle.square(tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);
        const octants = Octants.octantsOfRect(point, rect);
        return [...new Set(octants.flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]))];
        return [];
    }
}
//# sourceMappingURL=Tile.mjs.map