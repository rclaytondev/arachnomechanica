import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { RoomData } from "./constants/GameData.mjs";
import { GateState } from "./GateState.mjs";
import { RoomPlaceholder } from "./LevelGenerator.mjs";
import { Tile, World } from "./World.js";

export type Traversability = { start: GateState, end: GateState }[];

export class Room {
	name: string;
	tiles: Grid<Tile>;
	requiredExits: Direction[];
	optionalExits: Direction[];
	exitTiles: Grid<Direction | "none">;
	traversability: Traversability;

	constructor(name: string, tiles: { x: number, y: number, type: Tile }[] | Grid<Tile>, exitTiles: { x: number, y: number, direction: Direction }[] | Grid<Direction>, requiredExits: Direction[], optionalExits: Direction[], traversability?: Traversability) {
		this.name = name;
		if(tiles instanceof Grid) {
			this.tiles = tiles;
		}
		else {
			this.tiles = new Grid("empty");
			for(const { x, y, type } of tiles) {
				this.tiles.set(x, y, type);
			}
		}
		if(exitTiles instanceof Grid) {
			this.exitTiles = exitTiles;
		}
		else {
			this.exitTiles = new Grid("none");
			for(const { x, y, direction } of exitTiles) {
				this.exitTiles.set(x, y, direction);
			}
		}
		this.requiredExits = requiredExits;
		this.optionalExits = optionalExits;
		const exits = [this.requiredExits, ...optionalExits];
		this.traversability = traversability ?? RoomData.NO_GATE_TRAVERSABILITY.filter(
			({ start, end }) => exits.includes(start.exit) && exits.includes(end.exit)
		);
	}

	canAdd(roomPlaceholder: RoomPlaceholder) {
		const exitDirections = roomPlaceholder.exits;
		const hasAllExits = exitDirections.every(exit =>
			[...this.requiredExits, ...this.optionalExits].includes(exit)
		);
		const allRequiredExits = this.requiredExits.every(exit => exitDirections.includes(exit));
		const traversabilityMatches = GateState.traversabilityEquals(
			this.traversability,
			roomPlaceholder.traversability
		);
		return hasAllExits && allRequiredExits && traversabilityMatches;
	}

	add(position: Vector, world: World, exits: Direction[]) {
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
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

	reflect() {
		const reflected = new Room(
			`${this.name}-reflected`,
			[],
			[],
			this.requiredExits.map(Directions.reflectX),
			this.optionalExits.map(Directions.reflectX),
		);
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const reflectedX = RoomData.SIZE - x - 1;
				const tile = this.tiles.get(x, y);
				reflected.tiles.set(reflectedX, y, World.reflectTile(tile));

				const exitTile = this.exitTiles.get(x, y);
				if(exitTile !== "none") {
					reflected.exitTiles.set(reflectedX, y, Directions.reflectX(exitTile));
				}
			}
		}
		return reflected;
	}
}
