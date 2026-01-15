import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Slope } from "../world/World.mjs";
import { Tile } from "./Tile.mjs";

export class BasicTile extends Tile {
	readonly shape: "full" | Slope;
	readonly texture: "tower" | "stone";

	constructor(shape: "full" | Slope, texture: "tower" | "stone") {
		super();
		this.shape = shape;
		this.texture = texture;
	}

	copy() {
		return new BasicTile(this.shape, this.texture);
	}
	reflect(): BasicTile {
		const reflections: { [key: string]: "full" | Slope } = {
			"full": "full",
			"slope-floor-left": "slope-floor-right",
			"slope-floor-right": "slope-floor-left",
			"slope-ceiling-left": "slope-ceiling-right",
			"slope-ceiling-right": "slope-ceiling-left",
		};
		return new BasicTile(reflections[this.shape], this.texture);
	}
	equals(tile: unknown) {
		return tile instanceof BasicTile && this.shape === tile.shape && this.texture === tile.texture;
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

	display(canvasIO: CanvasIO, x: number, y: number): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS[this.texture];
		canvasIO.ctx.beginPath();
		this.addToPath(new Vector(x, y), canvasIO);
		canvasIO.ctx.fill();
	}
}
