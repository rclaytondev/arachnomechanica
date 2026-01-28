import "./Initializer.mjs";
import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { LevelGenerator } from "../level-generator/LevelGenerator.mjs";
import { Main } from "../Main.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

import "../debug-scenarios/spider-projectile-test.mjs";


if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof WorldScreen) {
	// eslint-disable-next-line no-console
	console.time("generating chunk");
	const generator = new LevelGenerator(new Vector(0, 0));
	generator.generateLevel(Main.screen.world);
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
