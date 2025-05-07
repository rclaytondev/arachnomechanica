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
	canSpawnWithExits: (exits: Direction[]) => boolean;
	exitTiles: Grid<Direction | "none">;
	traversability: Traversability;

	constructor(name: string, tiles: { x: number, y: number, type: Tile }[] | Grid<Tile>, exitTiles: { x: number, y: number, direction: Direction }[] | Grid<Direction>, canSpawnWithExits: (exits: Direction[]) => boolean, traversability?: Traversability) {
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
		this.canSpawnWithExits = canSpawnWithExits;
		this.traversability = GateState.deduplicateTraversability((traversability ?? RoomData.NO_GATE_TRAVERSABILITY));
	}

	canAdd(roomPlaceholder: RoomPlaceholder, matchTraversability: boolean = true) {
		const traversabilityMatches = GateState.traversabilityEquals(
			this.traversability,
			roomPlaceholder.traversability
		);
		return this.canSpawnWithExits(roomPlaceholder.exits) && (traversabilityMatches || !matchTraversability);
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
			(exits) => this.canSpawnWithExits(exits.map(Directions.opposite)),
			this.traversability.map(({ start, end }) => ({ 
				start: new GateState(null, Directions.reflectX(start.exit), start.toggled),
				end: new GateState(null, Directions.reflectX(end.exit), end.toggled)
			}))
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

	static gatelessPath(exit1: Direction, exit2: Direction) {
		return [
			{ start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
			{ start: new GateState(null, exit1, true), end: new GateState(null, exit2, true) },
			{ start: new GateState(null, exit2, false), end: new GateState(null, exit1, false) },
			{ start: new GateState(null, exit2, true), end: new GateState(null, exit1, true) }
		];
	}
	static onewayGatelessPath(exit1: Direction, exit2: Direction) {
		return [
			{ start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
			{ start: new GateState(null, exit1, true), end: new GateState(null, exit2, true) }
		];
	}
	static gatePath(exit1: Direction, exit2: Direction, open: boolean) {
		if(exit1 === exit2) {
			return [{ start: new GateState(null, exit1, !open), end: new GateState(null, exit2, open) } ];
		}
		return [
			{ start: new GateState(null, exit1, !open), end: new GateState(null, exit2, open) },
			{ start: new GateState(null, exit2, !open), end: new GateState(null, exit1, open) }
		];
	}
	static doubleGatePath(exit1: Direction, exit2: Direction) {
		return [
			{ start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
			{ start: new GateState(null, exit2, true), end: new GateState(null, exit1, true) },
		];
	}
	static getTraversability(connections: Traversability) {
		const checkPair = (i: number, j: number) => {
			const composite = { start: connections[i].start, end: connections[j].end };
			if(
				connections[i].end.equals(connections[j].start) &&
				!composite.start.equals(composite.end) &&
				!connections.some(c => c.start.equals(composite.start) && c.end.equals(composite.end))
			) { connections.push(composite); }
		};
		for(let max = 0; max < connections.length; max ++) {
			for(let i = 0; i < max; i ++) {
				checkPair(i, max);
				checkPair(max, i);
			}
		}
		return connections;
	}
}
