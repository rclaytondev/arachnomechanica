import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tile } from "../tiles/Tile.mjs";

export class Tiles {
	tilesGrid: Grid<Tile>;
	constructor(tilesGrid: Grid<Tile> = new Grid(EmptyTile.EMPTY)) {
		this.tilesGrid = tilesGrid;
	}

	get(position: Vector): Tile;
	get(x: number, y: number): Tile;
	get(...args: [number, number] | [Vector]) {
		return this.tilesGrid.get(args[0] as number, args[1] as number);
	}
	set(position: Vector, tile: Tile): Tiles;
	set(x: number, y: number, tile: Tile): Tiles;
	set(...args: [number, number, Tile] | [Vector, Tile]) {
		this.tilesGrid.set(args[0] as number, args[1] as number, args[2] as Tile);
		return this;
	}
	fillRect(rect: Rectangle, tile: Tile) {
		this.tilesGrid.fillRect(rect, tile);
	}

	static getTileX(onscreenX: number) {
		return Math.floor(onscreenX / WorldData.TILE_SIZE);
	}
	static getTileY(onscreenY: number) {
		return Math.floor(onscreenY / WorldData.TILE_SIZE);
	}
	static getTileCoordinates(onscreenPosition: Vector) {
		return new Vector(
			Math.floor(onscreenPosition.x / WorldData.TILE_SIZE),
			Math.floor(onscreenPosition.y / WorldData.TILE_SIZE),
		);
	}
	getTileAt(onscreenPosition: Vector) {
		return this.get(Tiles.getTileCoordinates(onscreenPosition));
	}
	*getTilesAt(rectangle: Rectangle) {
		const left = Tiles.getTileX(rectangle.left());
		const right = Tiles.getTileX(rectangle.right() - 1);
		const top = Tiles.getTileY(rectangle.top());
		const bottom = Tiles.getTileY(rectangle.bottom() - 1);
		for(let x = left; x <= right; x ++) {
			for(let y = top; y <= bottom; y ++) {
				yield { position: new Vector(x, y), tile: this.get(x, y) };
			}
		}
	}
}
