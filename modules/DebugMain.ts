import { canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { Main } from "./Main.js";
import { BasicTile } from "./tiles/BasicTile.mjs";
import { World } from "./world/World.js";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-5, 0, 9, 3), new BasicTile("full", "tower"));

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
