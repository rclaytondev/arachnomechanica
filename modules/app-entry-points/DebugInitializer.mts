import "./Initializer.mjs";
import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { LevelGenerator } from "../level-generator/LevelGenerator.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 10, 6), new BasicTile());
world.tiles.fillRect(new Rectangle(-1, 1, 8, 4), EmptyTile.EMPTY);
const laserBlock = LaserBlock.generate(new Vector(3, -1));
world.entities.add(laserBlock);
laserBlock.lasers = 1;
laserBlock.startAngle = Math.PI;
world.tiles.set(new Vector(2, -1), new SlopeTile("slope-ceiling-right"));
world.tiles.set(new Vector(3, -2), new SlopeTile("slope-ceiling-left"));

Main.screen = new WorldScreen(world);
if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof WorldScreen) {
	// eslint-disable-next-line no-console
	console.time("generating chunk");
	const generator = new LevelGenerator(new Vector(0, 0));
	generator.generateLevel(world);
	generator.visualize(canvasIO!, false);
	// eslint-disable-next-line no-console
	console.timeEnd("generating chunk");
	// eslint-disable-next-line no-debugger
	debugger;
}

if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS !== 0) {
	// eslint-disable-next-line no-console
	console.log(LevelGenerator.roomFrequencies(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS));
	// eslint-disable-next-line no-debugger
	debugger;
}
