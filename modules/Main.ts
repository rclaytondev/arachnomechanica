import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { World } from "./World.js";

const FRAMERATE = 60;
const world = new World();
world.tiles.set(1, 1, "solid");

window.setInterval(() => {
	world.display(canvasIO!);
}, 1000 / FRAMERATE);
