import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { RoomPlaceholder } from "./LevelGenerator.mjs";
import { Tile, World } from "./World";

export class Room {
	static SIZE = 12;

	name: string;
	tiles: Grid<Tile>;
	requiredExits: Direction[];
	optionalExits: Direction[];
	exitTiles: Grid<Direction | "none">;

	constructor(name: string, tiles: { x: number, y: number, type: Tile }[], exitTiles: { x: number, y: number, direction: Direction }[], requiredExits: Direction[], optionalExits: Direction[]) {
		this.name = name;
		this.tiles = new Grid("empty");
		for(const { x, y, type } of tiles) {
			this.tiles.set(x, y, type);
		}
		this.exitTiles = new Grid("none");
		for(const { x, y, direction } of exitTiles) {
			this.exitTiles.set(x, y, direction);
		}
		this.requiredExits = requiredExits;
		this.optionalExits = optionalExits;
	}

	canAdd(exitDirections: Direction[]) {
		return exitDirections.every(exit =>
			[...this.requiredExits, ...this.optionalExits].includes(exit)
		) && this.requiredExits.every(exit => exitDirections.includes(exit));
	}

	add(position: Vector, world: World, exits: Direction[]) {
		for(let x = 0; x < Room.SIZE; x ++) {
			for(let y = 0; y < Room.SIZE; y ++) {
				const tile = this.tiles.get(x, y);
				const tileCopy = (typeof tile === "string") ? tile : tile.copy();
				const worldPosition = position.add(x, y);
				world.tiles.set(worldPosition, tileCopy);

				const direction = this.exitTiles.get(x, y);
				if(direction !== "none" && !exits.includes(direction)) {
					world.tiles.set(worldPosition, "solid");
				}
			}
		}
	}

	getExitCoordinates(direction: Direction, coordinate: "x" | "y") {
		return [...this.exitTiles.positions()].filter(p => this.exitTiles.get(p) === direction).map(p => p[coordinate]);
	}
}
