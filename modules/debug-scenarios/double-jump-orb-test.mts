import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { DoubleJumpOrb } from "../entities/DoubleJumpOrb.mjs";
import { TestScenario } from "../dev/TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../game-engine/world/World.mjs";

export const doubleJumpOrbScenario = new TestScenario("double-jump-orb-scenario", () => {
	const world = new World(false);
	world.tiles.set(0, 0, TowerTile.TOWER_TILE);
	world.entities.add(new DoubleJumpOrb(new Vector(WorldData.TILE_SIZE / 2, -2 * WorldData.TILE_SIZE), world));
	return [world];
});
