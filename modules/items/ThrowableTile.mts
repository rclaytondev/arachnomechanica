import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { World } from "../world/World";
import { ThrowableTileEntity } from "./item-entities/ThrowableTileEntity.mjs";

export class ThrowableTile {
	use(world: World, canvasIO: CanvasIO) {
		world.player.throw(new ThrowableTileEntity(), world, canvasIO);
	}
}
