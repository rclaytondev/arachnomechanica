import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Backgrounds } from "../backgrounds/Backgrounds.mjs";
import { GearsBackground } from "../backgrounds/GearsBackground.mjs";
import { SkyBackground } from "../backgrounds/SkyBackground.mjs";
import { World } from "./World.mjs";

export class WorldScreen {
	world: World;
	backgrounds: Backgrounds = new Backgrounds([
		GearsBackground.generate(),
		new SkyBackground(),
	]);

	constructor(world: World) {
		this.world = world;
	}

	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);
	}

	display(canvasIO: CanvasIO) {
		this.backgrounds.display(canvasIO, this.world.camera);
		this.world.display(canvasIO);
	}
}
