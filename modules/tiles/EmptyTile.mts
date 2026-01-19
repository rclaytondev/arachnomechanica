import { Tile } from "./Tile.mjs";

export class EmptyTile extends Tile {
	private constructor() {
		super();
	}
	static readonly EMPTY = new EmptyTile();

	display() { }

	copy() {
		return this;
	}
	equals(tile: Tile) {
		return tile instanceof EmptyTile;
	}
	reflect(): EmptyTile {
		return this;
	}
	angularMotionBlockers() {
		return [];
	}
}
