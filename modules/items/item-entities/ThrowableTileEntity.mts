import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData } from "../../constants/GameData.mjs";
import { ThrowableTile } from "../ThrowableTile.mjs";
import { ThrowableItemEntity } from "./ThrowableItemEntity.mjs";

export class ThrowableTileEntity extends ThrowableItemEntity {
	constructor() {
		super(Rectangle.square(0, 0, WorldData.TILE_SIZE));
	}

	getItem() {
		return new ThrowableTile();
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
		canvasIO.fillRect(this.hitbox);

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.strokeSquare(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
			2 * WorldData.TILE_ACCENT_RADIUS,
		);
		canvasIO.strokeLine(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
			this.hitbox.right() - WorldData.TILE_ACCENT_INSET,
			this.hitbox.bottom() - WorldData.TILE_ACCENT_INSET,
		);
		canvasIO.strokeLine(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.bottom() - WorldData.TILE_ACCENT_INSET,
			this.hitbox.right() - WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
		);
	}
}
