import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldBorder } from "../entities/special/WorldBorder.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { World } from "../game-engine/world/World.mjs";

export const worldBorderScenario = new TestScenario("world-border-scenario", () => {
	const world = new World(false);
	world.entities.add(new WorldBorder(Rectangle.fromBounds(-Infinity, Infinity, 0, 100), world));

	return [world];
});

