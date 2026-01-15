import "./Initializer.mjs";
import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { ThrowableTile } from "../items/ThrowableTile.mjs";
import { MovingModifier } from "../items/tile-modifiers/MovingModifier.mjs";
import { WorldGenerator } from "../level-generator/WorldGenerator.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { CrawlingMovementData, PointOnSurface, Spider } from "../entities/Spider.mjs";
import { Platform } from "../tiles/Platform.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 4, 3, 2), new BasicTile("full", "tower"));
world.tiles.fillRect(new Rectangle(0, 1, 1, 1), new BasicTile("full", "tower"));
world.tiles.set(1, 4, Platform.PLATFORM);
// Spider.spawn(new Vector(3, 3), world);
world.entities.addEntity(new Spider(new Vector(0, 0), new CrawlingMovementData(
	new PointOnSurface(new Vector(0, 4 * 50), "up"),
	"clockwise",
)));

world.player.equippedItems[0] = new ThrowableTile([new MovingModifier()]);

Main.screen = new WorldScreen(world);
if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof WorldScreen) {
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
