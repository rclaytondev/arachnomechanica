import { Tile } from "./Tile.mjs";
export class EmptyTile extends Tile {
    constructor() {
        super();
    }
    static EMPTY = new EmptyTile();
    render() { return []; }
    display() { }
    copy() {
        return this;
    }
    equals(tile) {
        return tile instanceof EmptyTile;
    }
    reflect() {
        return this;
    }
    angularMotionBlockers() {
        return [];
    }
    intersects() {
        return false;
    }
    rayIntersectionDistance() {
        return Infinity;
    }
    blocksMovement() {
        return false;
    }
    rectIntersectionDistance() {
        return Infinity;
    }
    corners() {
        return [];
    }
}
//# sourceMappingURL=EmptyTile.mjs.map