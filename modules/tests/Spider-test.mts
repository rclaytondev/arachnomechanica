import { assert } from "chai";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { PointOnSurface } from "../entities/Spider.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { InvisibleRectangle } from "../game-utilities/physics-engine/InvisibleRectangle.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Entities } from "../world/Entities.mjs";

// describe("PointOnSurface.surfaceEndDistanceCW", () => {
// 	it("can return distance to the end of a tile when on the left edge", () => {
// 		const world = new World(false);
// 		const tile = TowerTile.TOWER_TILE("full");
// 		world.tiles.set(1, 2, tile);
// 		const point = new PointOnSurface(new Vector(WorldData.TILE_SIZE, 2 * WorldData.TILE_SIZE + 10), "left");
// 		const distance = point.surfaceEndDistanceCW(world);
// 		assert.equal(distance, 10);
// 	});
// });

describe("Tiles.angularMotionBlockers", () => {
	it("works for corners of tiles", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octantsTopLeft = tiles.angularMotionBlockers(new Vector(0, 0), "clockwise");
		assert.sameMembers(octantsTopLeft, ["right", "down-right", "down"]);

		const octantsTopRight = tiles.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 0), "clockwise");
		assert.sameMembers(octantsTopRight, ["down", "down-left", "left"]);

		const octantsBottomLeft = tiles.angularMotionBlockers(new Vector(0, WorldData.TILE_SIZE), "clockwise");
		assert.sameMembers(octantsBottomLeft, ["up", "up-right", "right"]);

		const octantsBottomRight = tiles.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, WorldData.TILE_SIZE), "clockwise");
		assert.sameMembers(octantsBottomRight, ["left", "up-left", "up"]);
	});
	it("returns an empty list when the point is not on the edge or corner of any solid", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octants1 = tiles.angularMotionBlockers(new Vector(-1, 0), "clockwise");
		const octants2 = tiles.angularMotionBlockers(new Vector(0, -1), "clockwise");
		assert.isEmpty(octants1);
		assert.isEmpty(octants2);
	});
	it("returns a list containing all eight directions when the point is inside a tile", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octants = tiles.angularMotionBlockers(new Vector(1, 1), "clockwise");
		assert.sameMembers(octants, [...Directions.DIRECTIONS, ...Directions.DIAGONALS]);
	});
	it("works when the point is on an edge of a tile", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octantsTop = tiles.angularMotionBlockers(new Vector(1, 0), "clockwise");
		assert.sameMembers(octantsTop, ["right", "down-right", "down", "down-left", "left"]);

		const octantsRight = tiles.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 1), "clockwise");
		assert.sameMembers(octantsRight, ["down", "down-left", "left", "up-left", "up"]);

		const octantsBottom = tiles.angularMotionBlockers(new Vector(1, WorldData.TILE_SIZE), "clockwise");
		assert.sameMembers(octantsBottom, ["left", "up-left", "up", "up-right", "right"]);

		const octantsLeft = tiles.angularMotionBlockers(new Vector(0, 1), "clockwise");
		assert.sameMembers(octantsLeft, ["up", "up-right", "right", "down-right", "down"]);
	});
});
describe("Entitites.angularMotionBlockers", () => {
	it("works for corners of collideables", () => {
		const entities = new Entities();
		entities.add(new InvisibleRectangle(Rectangle.square(0, 0, WorldData.TILE_SIZE)));

		const octantsTopLeft = entities.angularMotionBlockers(new Vector(0, 0));
		assert.sameMembers(octantsTopLeft, ["right", "down-right", "down"]);

		const octantsTopRight = entities.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 0));
		assert.sameMembers(octantsTopRight, ["down", "down-left", "left"]);

		const octantsBottomLeft = entities.angularMotionBlockers(new Vector(0, WorldData.TILE_SIZE));
		assert.sameMembers(octantsBottomLeft, ["up", "up-right", "right"]);

		const octantsBottomRight = entities.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, WorldData.TILE_SIZE));
		assert.sameMembers(octantsBottomRight, ["left", "up-left", "up"]);
	});
	it("returns a list containing all eight directions when the point is inside a collideable", () => {
		const entities = new Entities();
		entities.add(new InvisibleRectangle(Rectangle.square(0, 0, WorldData.TILE_SIZE)));

		const octants = entities.angularMotionBlockers(new Vector(1, 1));
		assert.sameMembers(octants, [...Directions.DIRECTIONS, ...Directions.DIAGONALS]);
	});
	it("works when the point is on an edge of a collideable", () => {
		const entities = new Entities();
		entities.add(new InvisibleRectangle(Rectangle.square(0, 0, WorldData.TILE_SIZE)));

		const octantsTop = entities.angularMotionBlockers(new Vector(1, 0));
		assert.sameMembers(octantsTop, ["right", "down-right", "down", "down-left", "left"]);

		const octantsRight = entities.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 1));
		assert.sameMembers(octantsRight, ["down", "down-left", "left", "up-left", "up"]);

		const octantsBottom = entities.angularMotionBlockers(new Vector(1, WorldData.TILE_SIZE));
		assert.sameMembers(octantsBottom, ["left", "up-left", "up", "up-right", "right"]);

		const octantsLeft = entities.angularMotionBlockers(new Vector(0, 1));
		assert.sameMembers(octantsLeft, ["up", "up-right", "right", "down-right", "down"]);
	});
});

describe("PointOnSurface.nextPoint", () => {
	it("works when moving from a tile to an entity", () => {
		const world = new World(false);
		world.tiles.set(0, 0, TowerTile.TOWER_TILE);
		world.entities.add(new InvisibleRectangle(new Rectangle(10, -10, 10, 10)));

		const point = new PointOnSurface(new Vector(10, 0), "up");
		const next = point.nextPoint(new InvisibleRectangle(new Rectangle(-100, -100, 1, 1)), world, "clockwise");
		assert.isNotNull(next);
		assert.deepEqual(next, new PointOnSurface(new Vector(10, -1), "left"));
	});
	it("works when moving from a tile to an entity counterclockwise", () => {
		const world = new World(false);
		world.tiles.set(0, 0, TowerTile.TOWER_TILE);
		world.entities.add(new InvisibleRectangle(new Rectangle(10, -10, 10, 10)));

		const point = new PointOnSurface(new Vector(10, 0), "up");
		const next = point.nextPoint(new InvisibleRectangle(new Rectangle(-100, -100, 1, 1)), world, "counterclockwise");
		assert.isNotNull(next);
		assert.deepEqual(next, new PointOnSurface(new Vector(9, 0), "up"));
	});
});
