import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";

export class SolidTile {
	static tileGlowGradient: CanvasGradient | null = null;
	static diagonalGlowGradient: CanvasGradient | null = null;
	
	static getTileGlowGradent() {
		if(this.tileGlowGradient) { return this.tileGlowGradient; }
		this.tileGlowGradient = GameUtils.glowLineGradient(
			0, 0, 0, -WorldData.TILE_GLOW_SIZE, 
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.tileGlowGradient;
	}
	static getDiagonalGlowGradient(canvasIO: CanvasIO) {
		if(this.diagonalGlowGradient) { return this.diagonalGlowGradient; }
		this.diagonalGlowGradient = GameUtils.glowCircleGradient(
			0, 0, WorldData.TILE_GLOW_SIZE,
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.diagonalGlowGradient;
	}
}
