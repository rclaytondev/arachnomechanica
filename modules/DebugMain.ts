import "./Initializer.mjs";
import { canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { HealthPickup } from "./entities/HealthPickup.mjs";
import { ThrowableTile } from "./items/ThrowableTile.mjs";
import { MovingModifier } from "./items/tile-modifiers/MovingModifier.mjs";
import { WorldGenerator } from "./level-generator/WorldGenerator.mjs";
import { Main } from "./Main.mjs";
import { BasicTile } from "./tiles/BasicTile.mjs";
import { World } from "./world/World.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-5, -5, 10, 20), new BasicTile("full", "tower"));
world.tiles.fillRect(new Rectangle(-4, -4, 8, 8), "empty");

world.entities.addEntity(new HealthPickup(new Vector(-2, -2)));

world.player.equippedItems[0] = new ThrowableTile([new MovingModifier()]);

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

if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS !== 0) {
	// eslint-disable-next-line no-console
	console.log(WorldGenerator.roomFrequencies(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS));
	// eslint-disable-next-line no-debugger
	debugger;
}
