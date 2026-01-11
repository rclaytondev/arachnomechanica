import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { PlayerData, WorldData } from "../../constants/GameData.mjs";
import { ThrowableTile } from "../ThrowableTile.mjs";
import { TileModifier } from "../TileModifier.mjs";
import { ThrowableItemEntity } from "./ThrowableItemEntity.mjs";

export class ThrowableTileEntity extends ThrowableItemEntity {
	modifiers: TileModifier[] = [];

	constructor(position: Vector = new Vector(0, 0), modifiers: TileModifier[]) {
		super(Rectangle.square(position.x, position.y, WorldData.TILE_SIZE));
		this.gravity = ThrowableTileEntity.getGravity(modifiers);
		this.modifiers = modifiers;
		this.frictionY = Math.min(1, ...modifiers.map(m => m.frictionY ?? Infinity));
	}
	static getGravity(modifiers: TileModifier[]) {
		const values = new Set(modifiers.map(m => m.gravity));
		if(values.has("reverse")) {return -PlayerData.GRAVITY; }
		else if(values.has("none")) { return 0; }
		else { return PlayerData.GRAVITY; }
	}

	getItem() {
		return new ThrowableTile(this.modifiers);
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
