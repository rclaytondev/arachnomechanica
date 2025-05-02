import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { World } from "./World.js";

const FRAMERATE = 60;
const world = new World();
world.tiles.set(8, 3, "solid");
world.tiles.set(7, 1, "solid");
world.creatures.push(new Lizard(new Vector(200, 175), "right", 200, 3));

export const DEBUG_SETTINGS = {
	LIZARD_JOINT_COLOR: "rgba(255, 150, 0)", // set to transparent to disable
	PLACE_BLOCKS_WITH_CURSOR: true
};

window.setInterval(() => {
	world.update();
	world.display(canvasIO!);
}, 1000 / FRAMERATE);
