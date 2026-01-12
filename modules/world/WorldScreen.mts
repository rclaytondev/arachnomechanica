import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { World } from "./World.mjs";

export class WorldScreen {
	world: World;

	constructor(world: World) {
		this.world = world;
	}

	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);
	}

	display(canvasIO: CanvasIO) {
		this.world.display(canvasIO);
	}
}
