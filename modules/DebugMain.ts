import { canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { HealthPickup } from "./entities/HealthPickup.mjs";
import { ThrowableTile } from "./items/ThrowableTile.mjs";
import { Main } from "./Main.js";
import { BasicTile } from "./tiles/BasicTile.mjs";
import { World } from "./world/World.js";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-5, 0, 9, 5), new BasicTile("full", "tower"));

world.entities.addEntity(new HealthPickup(new Vector(-2, -2)));

world.player.equippedItems[0] = new ThrowableTile();

Main.screen = world;
if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof World) {
	// eslint-disable-next-line no-console
	console.time("generating chunk");
	const debugWorld = new World(false);
	debugWorld.worldGenerator.generateLevel(debugWorld);
	debugWorld.worldGenerator.visualize(canvasIO!, false);
	// eslint-disable-next-line no-console
	console.timeEnd("generating chunk");
	// eslint-disable-next-line no-debugger
	debugger;
}
