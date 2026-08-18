import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Spider } from "../entities/Spider.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const spiderPerformanceScenario = new TestScenario(() => {
	const GROUPS_PER_ROW = 5;
	const NUM_ROWS = 3;
	const ROW_HEIGHT = 3;

	const world = new World(false);
	world.tiles.fillRect(Rectangle.fromBounds(-5, 5, 0, 1), TowerTile.TOWER_TILE);

	for(let i = 0; i < NUM_ROWS; i ++) {
		const rowOffset = i * ROW_HEIGHT;
		world.tiles.fillRect(Rectangle.fromBounds(-2 * GROUPS_PER_ROW, 2 * GROUPS_PER_ROW, rowOffset + 3, rowOffset + 4), TowerTile.TOWER_TILE);
		for(let j = 1; j < GROUPS_PER_ROW; j ++) {
			Spider.spawn(new Vector(2 * j + 1, rowOffset + 2), world);
			Spider.spawn(new Vector(2 * j + 1, rowOffset + 4), world);
			Spider.spawn(new Vector(-2 * j - 1, rowOffset + 2), world);
			Spider.spawn(new Vector(-2 * j - 1, rowOffset + 4), world);
		}
	}

	return [world];
});


