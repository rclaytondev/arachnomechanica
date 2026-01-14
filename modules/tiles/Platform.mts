import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { World } from "../world/World.mjs";
import { Tile } from "./Tile.mjs";

export class Platform extends Tile {
	private constructor() {
		super();
	}
	static readonly PLATFORM = new Platform();

	display(canvasIO: CanvasIO, x: number, y: number, world: World): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
		canvasIO.ctx.fillRect(
			x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE,
			WorldData.TILE_SIZE + 1, 2 * WorldData.TILE_ACCENT_INSET,
		);
		const platformLeft = (world.tiles.get(x - 1, y) === Platform.PLATFORM);
		const platformRight = (world.tiles.get(x + 1, y) === Platform.PLATFORM);
		const accentStart = platformLeft ? -1 : WorldData.TILE_ACCENT_INSET;
		const accentEnd = WorldData.TILE_SIZE- (platformRight ? -1 : WorldData.TILE_ACCENT_INSET);
		const accentY = y * WorldData.TILE_SIZE + WorldData.TILE_ACCENT_INSET;
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.strokeLine(
			x * WorldData.TILE_SIZE + accentStart, accentY,
			x * WorldData.TILE_SIZE + accentEnd, accentY,
		);
	}

	copy() {
		return this;
	}
}
