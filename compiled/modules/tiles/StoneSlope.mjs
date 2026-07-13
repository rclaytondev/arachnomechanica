import { SlopeTile } from "./SlopeTile.mjs";
import { StoneTileRenderer } from "./StoneTile.mjs";
export class StoneSlope extends SlopeTile {
    constructor(shape) {
        super(shape);
    }
    render(tilePosition, world) {
        const stoneTileRenderer = world.staticEntities.entitiesList.find(e => e instanceof StoneTileRenderer);
        if (!stoneTileRenderer) {
            world.staticEntities.entitiesList.push(new StoneTileRenderer());
        }
        return [];
    }
    display() { }
    copy() { return this; }
    reflect() {
        const reflections = {
            "slope-floor-left": "slope-floor-right",
            "slope-floor-right": "slope-floor-left",
            "slope-ceiling-left": "slope-ceiling-right",
            "slope-ceiling-right": "slope-ceiling-left",
        };
        return new StoneSlope(reflections[this.shape]);
    }
    equals(tile) {
        return tile instanceof StoneSlope && tile.shape === this.shape;
    }
}
//# sourceMappingURL=StoneSlope.mjs.map