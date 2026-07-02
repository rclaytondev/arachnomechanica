import { Direction, Diagonal, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";


export type Octant = Direction | Diagonal; // convention: the diagonal is the direction of the start of the octant when going around clockwise.export class Octants {
export class Octants {
	static quadrant(quadrant: Diagonal): Octant[] {
		return [quadrant, Directions.rotateCounterclockwise45[quadrant]];
	}

	static octantsOfRect(point: Vector, rect: Rectangle) {
		if (!rect.contains(point)) { return []; }

		const result: Octant[] = [];
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

	static nextOctant(octant: Octant, direction: "clockwise" | "counterclockwise") {
		if (direction === "clockwise") {
			return Directions.rotateClockwise45[octant];
		}
		else {
			return Directions.rotateCounterclockwise45[octant];
		}
	}
	static nextOctantIn(octants: Octant[], start: Direction | Diagonal, direction: "clockwise" | "counterclockwise") {
		if (octants.length === 0) {
			return null;
		}
		let current = start;
		while (!octants.includes(current)) {
			current = Octants.nextOctant(current, direction);
		}
		return current;
	}
	static edge(octant: Octant, direction: "clockwise" | "counterclockwise"): Direction | Diagonal {
		if (direction === "counterclockwise") {
			return octant;
		}
		else {
			return Directions.rotateClockwise45[octant];
		}
	}
	static fromIncludes(point: Vector, includes: (p: Vector) => boolean) {
		const directions = [...Directions.DIRECTIONS, ...Directions.DIAGONALS].filter(
			d => includes(point.add(Vector.gridUnit(d).multiply(1/2))),
		);
		return ([...Directions.DIRECTIONS, ...Directions.DIAGONALS] as Octant[]).filter(
			o => directions.includes(Octants.edge(o, "clockwise")) && directions.includes(Octants.edge(o, "counterclockwise")),
		);
	}
}

