import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData } from "../../constants/GameData.mjs";
import { ThrowableItemEntity } from "./ThrowableItemEntity.mjs";

export class ThrowableTileEntity extends ThrowableItemEntity {
	constructor() {
		super(Rectangle.square(0, 0, WorldData.TILE_SIZE));
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
		canvasIO.fillRect(this.hitbox);
	}
}
