import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
export class Octants {
    static quadrant(quadrant) {
        return [quadrant, Directions.rotateCounterclockwise45[quadrant]];
    }
    static octantsOfRect(point, rect) {
        if (!rect.contains(point)) {
            return [];
        }
        const result = [];
        if (point.x > rect.left && point.y > rect.top) {
            result.push("left", "up-left");
        }
        if (point.x > rect.left && point.y < rect.bottom) {
            result.push("down", "down-left");
        }
        if (point.x < rect.right && point.y > rect.top) {
            result.push("up", "up-right");
        }
        if (point.x < rect.right && point.y < rect.bottom) {
            result.push("right", "down-right");
        }
        return result;
    }
    static nextOctant(octant, direction) {
        if (direction === "clockwise") {
            return Directions.rotateClockwise45[octant];
        }
        else {
            return Directions.rotateCounterclockwise45[octant];
        }
    }
    static nextOctantIn(octants, start, direction) {
        if (octants.length === 0) {
            return null;
        }
        let current = start;
        while (!octants.includes(current)) {
            current = Octants.nextOctant(current, direction);
        }
        return current;
    }
    static edge(octant, direction) {
        if (direction === "counterclockwise") {
            return octant;
        }
        else {
            return Directions.rotateClockwise45[octant];
        }
    }
    static fromIncludes(point, includes) {
        const directions = [...Directions.DIRECTIONS, ...Directions.DIAGONALS].filter(d => includes(point.add(Vector.gridUnit(d).multiply(1 / 2))));
        return [...Directions.DIRECTIONS, ...Directions.DIAGONALS].filter(o => directions.includes(Octants.edge(o, "clockwise")) && directions.includes(Octants.edge(o, "counterclockwise")));
    }
}
//# sourceMappingURL=Octant.mjs.map