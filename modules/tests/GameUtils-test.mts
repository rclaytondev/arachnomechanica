import { assert } from "chai";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";

describe("GeomUtils.gridSquaresOnRay", () => {
	it("returns the list of grid squares that intersect a given ray, up to a distance that is a given multiple of the ray direction vector's length", () => {
		const start = new Vector(1/2, 1/2);
		const direction = new Vector(2, 1);
		const squarePositions = GeomUtils.gridSquaresOnRay(start, direction, 1, 1);
		assert.sameDeepMembers(squarePositions, [
			new Vector(0, 0),
			new Vector(1, 0),
			new Vector(1, 1),
			new Vector(2, 1),
		]);
	});
	it("includes all neighboring squares when the ray hits a corner exactly", () => {
		const start = new Vector(1/2, 1/2);
		const direction = new Vector(1, 1);
		const squarePositions = GeomUtils.gridSquaresOnRay(start, direction, 2, 1);
		assert.sameDeepMembers(squarePositions, [
			new Vector(0, 0),
			new Vector(1, 0),
			new Vector(0, 1),
			new Vector(1, 1),
			new Vector(2, 1),
			new Vector(1, 2),
			new Vector(2, 2),
		]);
	});
	it("does not loop forever on an input that causes floating point errors (regression test)", () => {
		const start = new Vector(36.503174497307405, -37.77631829820087);
		const direction = new Vector(-18.383174497307404, 49.93631829820087);
		GeomUtils.gridSquaresOnRay(start, direction, 0.9919897979340137, 1);
	});
});
