import { Direction } from "../utils-ts/modules/geometry/Direction.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Tile } from "./World";

export class Room {
	static SIZE = 12;

	tiles: Grid<Tile | Direction>;

	constructor(tiles: Grid<Tile | Direction>) {
		this.tiles = tiles;
	}
}
