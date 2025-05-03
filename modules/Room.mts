import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { RoomPlaceholder } from "./LevelGenerator.mjs";
import { Tile, World } from "./World";

export class Room {
	static SIZE = 12;

	tiles: Grid<Tile | Direction>;
	requiredExits: Direction[];
	optionalExits: Direction[];

	constructor(tiles: Grid<Tile | Direction>, requiredExits: Direction[], optionalExits: Direction[]) {
		this.tiles = tiles;
		this.requiredExits = requiredExits;
		this.optionalExits = optionalExits;
	}

	canAdd(roomPlaceholder: RoomPlaceholder) {
		return roomPlaceholder.exits.every(exit =>
			[...this.requiredExits, ...this.optionalExits].includes(exit)
		) && this.requiredExits.every(exit => roomPlaceholder.exits.includes(exit));
	}

	add(position: Vector, world: World, exits: Direction[]) {
		for(let x = 0; x < Room.SIZE; x ++) {
			for(let y = 0; y < Room.SIZE; y ++) {
				const tile = this.tiles.get(x, y);
				const worldPosition = position.add(x, y);
				if(Directions.isDirection(tile)) {
					world.tiles.set(worldPosition, exits.includes(tile) ? "empty" : "solid");
				}
				else {
					world.tiles.set(x + position.x, y + position.y, tile);
				}
			}
		}
	}
}
