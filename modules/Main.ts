import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { World } from "./World.js";

let frameCount = 0;
const FRAMERATE = 60;
const world = LevelGenerator.generate();
world.tiles.set(7, 3, "solid");
world.tiles.set(7, 1, "solid");
world.tiles.set(0, 5, "solid");
world.creatures.push(new Lizard(new Vector(200, 175), "right", 200, 3));

export const DEBUG_SETTINGS = {
	LIZARD_JOINT_COLOR: "rgba(255, 150, 0, 0)", // set to transparent to disable
	PLACE_BLOCKS_WITH_CURSOR: true
};

window.setInterval(() => {
	world.update(canvasIO!);
	world.display(canvasIO!);
	frameCount ++;
}, 1000 / FRAMERATE);

export { frameCount };
