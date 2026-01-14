import { assert } from "chai";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Octants } from "../entities/Spider.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";

// describe("PointOnSurface.surfaceEndDistanceCW", () => {
// 	it("can return distance to the end of a tile when on the left edge", () => {
// 		const world = new World(false);
// 		const tile = new BasicTile("full", "tower");
// 		world.tiles.set(1, 2, tile);
// 		const point = new PointOnSurface(new Vector(WorldData.TILE_SIZE, 2 * WorldData.TILE_SIZE + 10), "left");
// 		const distance = point.surfaceEndDistanceCW(world);
// 		assert.equal(distance, 10);
// 	});
// });

describe("Octant.getSolidOctants", () => {
	it("works for corners of tiles", () => {
		const world = new World(false);
		world.tiles.set(0, 0, new BasicTile("full", "tower"));

		const octantsTopLeft = Octants.getSolidOctants(new Vector(0, 0), world);
		assert.sameMembers(octantsTopLeft, ["right", "down-right"]);

		const octantsTopRight = Octants.getSolidOctants(new Vector(WorldData.TILE_SIZE, 0), world);
		assert.sameMembers(octantsTopRight, ["down", "down-left"]);

		const octantsBottomLeft = Octants.getSolidOctants(new Vector(0, WorldData.TILE_SIZE), world);
		assert.sameMembers(octantsBottomLeft, ["up", "up-right"]);

		const octantsBottomRight = Octants.getSolidOctants(new Vector(WorldData.TILE_SIZE, WorldData.TILE_SIZE), world);
		assert.sameMembers(octantsBottomRight, ["left", "up-left"]);
	});
	it("returns an empty list when the point is not on the edge or corner of any solid", () => {
		const world = new World(false);
		world.tiles.set(0, 0, new BasicTile("full", "tower"));

		const octants1 = Octants.getSolidOctants(new Vector(-1, 0), world);
		const octants2 = Octants.getSolidOctants(new Vector(0, -1), world);
		assert.isEmpty(octants1);
		assert.isEmpty(octants2);
	});
	it("returns a list containing all eight octants when the point is inside a tile", () => {
		const world = new World(false);
		world.tiles.set(0, 0, new BasicTile("full", "tower"));

		const octants = Octants.getSolidOctants(new Vector(1, 1), world);
		assert.sameMembers(octants, [...Directions.DIRECTIONS, ...Directions.DIAGONALS]);
	});
	it("works when the point is on an edge of a tile", () => {
		const world = new World(false);
		world.tiles.set(0, 0, new BasicTile("full", "tower"));

		const octantsTop = Octants.getSolidOctants(new Vector(1, 0), world);
		assert.sameMembers(octantsTop, ["right", "down-right", "down", "down-left"]);

		const octantsRight = Octants.getSolidOctants(new Vector(WorldData.TILE_SIZE, 1), world);
		assert.sameMembers(octantsRight, ["down", "down-left", "left", "up-left"]);

		const octantsBottom = Octants.getSolidOctants(new Vector(1, WorldData.TILE_SIZE), world);
		assert.sameMembers(octantsBottom, ["left", "up-left", "up", "up-right"]);

		const octantsLeft = Octants.getSolidOctants(new Vector(0, 1), world);
		assert.sameMembers(octantsLeft, ["up", "up-right", "right", "down-right"]);
	});
});
