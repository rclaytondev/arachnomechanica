import { assert } from "chai";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { BoundingBoxStructure } from "../game-utilities/BoundingBoxStructure.mjs";
describe("BoundingBoxStructure", () => {
    it("can add and delete entities and iterate through all entities", () => {
        const structure = new BoundingBoxStructure(100, r => r);
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
        const structure = new BoundingBoxStructure(100, r => r);
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
        for (const rect of testCases) {
            const actual = structure.possiblyIntersecting(rect);
            const expected = [rect1, rect2, rect3].filter(r => r.intersects(rect));
            assert.includeMembers([...actual], expected);
        }
    });
    it("correctly handles operations involving entities that have infinitely large bounding boxes", () => {
        const rect1 = Rectangle.fromBounds(1, 3, 1, 3);
        const rect2 = Rectangle.fromBounds(2, 4, 1, 3);
        const infiniteRight = Rectangle.fromBounds(5, Infinity, 3, 4);
        const infiniteBottomLeft = Rectangle.fromBounds(-Infinity, -5, 5, Infinity);
        const infiniteAll = Rectangle.fromBounds(-Infinity, Infinity, -Infinity, Infinity);
        const structure = new BoundingBoxStructure(10, r => r);
        structure.add(rect1);
        structure.add(rect2);
        structure.add(infiniteRight);
        structure.add(infiniteBottomLeft);
        structure.add(infiniteAll);
        assert.sameMembers([...structure], [rect1, rect2, infiniteRight, infiniteBottomLeft, infiniteAll]);
        const testCases = [
            Rectangle.fromBounds(1, 3, 1, 3),
            Rectangle.fromBounds(2, 4, 1, 3),
            Rectangle.fromBounds(-100, 100, -100, 100),
            Rectangle.fromBounds(4, 6, 5, 7),
        ];
        for (const rect of testCases) {
            const actual = structure.possiblyIntersecting(rect);
            const expected = [rect1, rect2, infiniteRight, infiniteBottomLeft, infiniteAll].filter(r => r.intersects(rect));
            assert.includeMembers([...actual], expected);
        }
    });
});
//# sourceMappingURL=BoundingBoxStructure-test.mjs.map