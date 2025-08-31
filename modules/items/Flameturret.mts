import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { World } from "../world/World";
import { FlameturretEntity } from "./item-entities/FlameturretEntity.mjs";

export class Flameturret {
	use(world: World, canvasIO: CanvasIO) {
		world.player.throw(new FlameturretEntity(), world, canvasIO);
	}
}
