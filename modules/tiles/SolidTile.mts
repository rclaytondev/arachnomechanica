import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Slope } from "../world/World";

export class SolidTile {
	readonly shape: "full" | Slope;
	readonly texture: "tower" | "stone";

	constructor(shape: "full" | Slope, texture: "tower" | "stone") {
		this.shape = shape;
		this.texture = texture;
	}

	copy() {
		return new SolidTile(this.shape, this.texture);
	}
	equals(tile: unknown) {
		return tile instanceof SolidTile && this.shape === tile.shape && this.texture === tile.texture;
	}

	addToPath(position: Vector, canvasIO: CanvasIO) {
		if(this.shape === "full") {
			canvasIO.ctx.rect(
				position.x * WorldData.TILE_SIZE - 1,
				position.y * WorldData.TILE_SIZE - 1,
				WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2,
			);
		}
		else {
			const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
			const angles = {
				"slope-floor-right": 0,
				"slope-floor-left": MathUtils.toRadians(90),
				"slope-ceiling-right": MathUtils.toRadians(-90),
				"slope-ceiling-left": MathUtils.toRadians(-180),
			};
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angles[this.shape]);
			canvasIO.polygon(
				WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
				WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
				-WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
			);
			canvasIO.ctx.restore();
		}
	}

	static displayTile(position: Vector, canvasIO: CanvasIO, tile: SolidTile) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS[tile.texture];
		canvasIO.ctx.beginPath();
		tile.addToPath(position, canvasIO);
		canvasIO.ctx.fill();
	}
}
