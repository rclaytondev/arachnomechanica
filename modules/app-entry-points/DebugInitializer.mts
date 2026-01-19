import "./Initializer.mjs";
import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { WorldGenerator } from "../level-generator/WorldGenerator.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { CrawlingMovementData, Spider } from "../entities/Spider.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { Lizard } from "../entities/Lizard.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 10, 6), new BasicTile("full", "tower"));
world.tiles.fillRect(new Rectangle(-1, 1, 8, 4), EmptyTile.EMPTY);

Lizard.spawn(new Vector(-1, 4), world);
const lizard = [...world.entities].find(e => e instanceof Lizard)!;
lizard.length = 200;
lizard.speed = 0;

Spider.spawn(new Vector(5, 4), world);
const spider = [...world.entities].find(e => e instanceof Spider)!;
(spider.movement as CrawlingMovementData).direction = "counterclockwise";

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
