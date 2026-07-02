import { assert } from "chai";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { BoundingBoxStructure } from "../game-utilities/BoundingBoxStructure.mjs";

describe("BoundingBoxStructure", () => {
	it("can add and delete entities and iterate through all entities", () => {
		const structure = new BoundingBoxStructure<Rectangle>(100, r => r);
		const rect1 = Rectangle.fromBounds(1, 3, 1, 3);
		const rect2 = Rectangle.fromBounds(1, 3, 1, 3);
		const rect3 = Rectangle.fromBounds(200, 202, 1, 3);

		structure.add(rect1);
		assert.sameMembers([...structure], [rect1]);

		structure.add(rect2);
		assert.sameMembers([...structure], [rect1, rect2]);

		structure.add(rect2);
		assert.sameMembers([...structure], [rect1, rect2]);

		structure.delete(rect1);
		assert.sameMembers([...structure], [rect2]);

		structure.delete(rect3);
		assert.sameMembers([...structure], [rect2]);
	});
	it("can determine entities that could possibly intersect a given rectangle", () => {
		const structure = new BoundingBoxStructure<Rectangle>(100, r => r);
		const rect1 = Rectangle.fromBounds(1, 3, 1, 3);
		const rect2 = Rectangle.fromBounds(2, 4, 1, 3);
		const rect3 = Rectangle.fromBounds(200, 202, 1, 3);

		structure.add(rect1);
		structure.add(rect2);
		structure.add(rect3);

		const testCases = [
			Rectangle.fromBounds(1, 3, 1, 3),
			Rectangle.fromBounds(2, 4, 1, 3),
			Rectangle.fromBounds(-1000, 1000, -1000, 1000),
		];
		for(const rect of testCases) {
			const actual = structure.possiblyIntersecting(rect);
			const expected = [rect1, rect2, rect3].filter(r => r.intersects(rect));
			assert.includeMembers([...actual], expected);
		}
	});
});
