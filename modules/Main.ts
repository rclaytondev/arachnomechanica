import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { World } from "./World.js";

const FRAMERATE = 60;
const world = new World();
world.tiles.set(1, 1, "solid");
world.creatures.push(new Lizard(new Vector(200, 200), "right", 100, 2));

window.setInterval(() => {
	world.update();
	world.display(canvasIO!);
}, 1000 / FRAMERATE);
