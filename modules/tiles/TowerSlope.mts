import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";
import { SlopeTile } from "./SlopeTile.mjs";
import { TowerTile } from "./TowerTile.mjs";

export class TowerSlope extends SlopeTile {
	render(position: Vector, world: World) {
		return [
			new Renderable(c => this.display(c, position.x, position.y), "tile"),
			new Renderable(c => this.displayAccent(position, c, world), "tile-accent"),
		];
	}
	display(canvasIO: CanvasIO, x: number, y: number): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS["tower"];
		canvasIO.ctx.beginPath();
		this.addToPath(new Vector(x, y), canvasIO);
		canvasIO.ctx.fill();
	}
	displayAccent(position: Vector, canvasIO: CanvasIO, world: World) {
		TowerTile.displaySlopedAccent(position, canvasIO, this.normal, world);
	}

	copy() {
		return new TowerSlope(this.normal);
	}
	reflect() {
		const reflected = Directions.reflectX[this.normal];
		return new TowerSlope(reflected);
	}
	equals(tile: unknown) {
		return tile instanceof TowerSlope && tile.normal === this.normal;
	}
}
