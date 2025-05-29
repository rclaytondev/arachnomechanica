import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
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

	static displayTile(position: Vector, canvasIO: CanvasIO, tile: SolidTile, world: World) {
		if(tile.texture === "tower") {
			TowerTile.displaySolidTile(position, canvasIO, world);
		}
	}
	static displaySlopedTile(position: Vector, canvasIO: CanvasIO, tile: SolidTile & { shape: Slope }) {
		TowerTile.displaySlopedTile(position, canvasIO, tile.shape);
	}
}
