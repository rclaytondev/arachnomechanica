import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Slope, World } from "../World";
import { TowerTile } from "./TowerTile.mjs";

export class SolidTile {
	readonly shape: "solid" | Slope;
	readonly texture: "tower" | "stone";

	constructor(shape: "solid" | Slope, texture: "tower" | "stone") {
		this.shape = shape;
		this.texture = texture;
	}

	copy() {
		return new SolidTile(this.shape, this.texture);
	}

	static displayTile(position: Vector, canvasIO: CanvasIO, tile: SolidTile) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS[tile.texture];
		canvasIO.ctx.fillRect(
			position.x * WorldData.TILE_SIZE - 1, 
			position.y * WorldData.TILE_SIZE - 1, 
			WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2
		);
	}
	static displaySlopedTile(position: Vector, canvasIO: CanvasIO, tile: SolidTile & { shape: Slope }) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS[tile.texture];
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const angles = {
			"slope-floor-right": 0,
			"slope-floor-left": MathUtils.toRadians(90),
			"slope-ceiling-right": MathUtils.toRadians(-90),
			"slope-ceiling-left": MathUtils.toRadians(-180),
		};
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(angles[tile.shape]);
		canvasIO.fillPoly(
			WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
			WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
			-WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
		);
		canvasIO.ctx.restore();
	}
}
