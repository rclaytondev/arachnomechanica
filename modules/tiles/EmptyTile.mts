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
	reflect(): EmptyTile {
		return this;
	}
}
