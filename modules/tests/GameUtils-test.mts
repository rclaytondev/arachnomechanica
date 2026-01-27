import { assert } from "chai";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";

describe("GameUtils.gridSquaresOnRay", () => {
	it("returns the list of grid squares that intersect a given ray, up to a distance that is a given multiple of the ray direction vector's length", () => {
		const start = new Vector(1/2, 1/2);
		const direction = new Vector(2, 1);
		const squarePositions = GameUtils.gridSquaresOnRay(start, direction, 1, 1);
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
		const squarePositions = GameUtils.gridSquaresOnRay(start, direction, 2, 1);
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
});
