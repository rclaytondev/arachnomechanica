import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { RoomData, WorldData } from "../constants/GameData.mjs";
import { GateState } from "./GateState.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { Slope, Tile, World } from "../World.js";
import { Portal } from "../entities/Portal.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";
import { RoomPlaceholder } from "./RoomPlaceholder.mjs";
import { ROOMS } from "./Rooms.mjs";

export type Traversability = { start: GateState, end: GateState }[];

export class Room {
	name: string;
	tiles: Grid<Tile>;
	canSpawnWithExits: (exits: Direction[]) => boolean;
	exitTiles: Grid<Direction | "none">;
	traversability: Traversability;
	weight: number;
	entities: Portal[];

	constructor(name: string, tiles: { x: number, y: number, type: Tile | "solid" | Slope }[] | Grid<Tile>, exitTiles: { x: number, y: number, direction: Direction }[] | Grid<Direction | "none">, entities: Portal[] = [], canSpawnWithExits: (exits: Direction[]) => boolean, traversability?: Traversability, weight: number = 1) {
		this.name = name;
		if(tiles instanceof Grid) {
			this.tiles = tiles;
		}
		else {
			this.tiles = new Grid("empty");
			for(const { x, y, type } of tiles) {
				const tile = (type === "solid" || World.isSlope(type as string)) ? new SolidTile(type as "solid" | Slope, "tower") : type;
				this.tiles.set(x, y, tile as Tile);
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
		this.weight = weight;
		this.entities = entities;
	}

	hasPortal() {
		return this.entities.some(e => e instanceof Portal);
	}

	add(position: Vector, world: World, exits: Direction[]) {
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const tile = this.tiles.get(x, y);
				const tileCopy = (typeof tile === "string") ? tile : tile.copy();
				const worldPosition = position.add(x, y);
				world.addTile(worldPosition, tileCopy);

				const direction = this.exitTiles.get(x, y);
				if(direction !== "none" && !exits.includes(direction)) {
					world.addTile(worldPosition, new SolidTile("solid", "tower"));
				}
			}
		}
		for(const entity of this.entities) {
			world.entities.push(entity.translate(position.multiply(WorldData.TILE_SIZE)));
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
			this.entities.map(e => e.reflect()),
			(exits) => this.canSpawnWithExits(exits.map(e => Directions.reflectX[e])),
			this.traversability.map(({ start, end }) => ({ 
				start: new GateState(null, Directions.reflectX[start.exit], start.toggled),
				end: new GateState(null, Directions.reflectX[end.exit], end.toggled)
			}))
		);
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const reflectedX = RoomData.SIZE - x - 1;
				const tile = this.tiles.get(x, y);
				reflected.tiles.set(reflectedX, y, World.reflectTile(tile));

				const exitTile = this.exitTiles.get(x, y);
				if(exitTile !== "none") {
					reflected.exitTiles.set(reflectedX, y, Directions.reflectX[exitTile]);
				}
			}
		}
		return reflected;
	}
	copy() {
		return new Room(
			this.name,
			this.tiles.map(tile => typeof tile === "string" ? tile : tile.copy()),
			this.exitTiles.map(v => v),
			this.entities.map(v => v.copy()),
			this.canSpawnWithExits,
			this.traversability.map(({ start, end }) => ({ start: start.copy(), end: end.copy() }))
		);
	}
	toggleGates() {
		const copy = this.copy();
		copy.name += "-toggled";
		for(const position of copy.tiles.positions()) {
			const tile = copy.tiles.get(position);
			if(tile instanceof Gate) {
				const gateCopy = tile.copy();
				gateCopy.open = !gateCopy.open;
				gateCopy.openness = 1 - gateCopy.openness;
				copy.tiles.set(position, gateCopy);
			}
		}
		copy.traversability = copy.traversability.map(({ start, end }) => ({
			start: new GateState(start.position, start.exit, !start.toggled),
			end: new GateState(end.position, end.exit, !end.toggled)
		}));
		return copy;
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

	static connectivity(traversability: Traversability, exits: Direction[]) {
		let total = 0;
		for(const exit of exits) {
			for(const toggled of [true, false]) {
				const reachableStates = traversability.filter(({ start }) => (
					start.exit === exit && start.toggled === toggled
				));
				const reachableDirections = new Set(reachableStates.map(s => s.end.exit).filter(s => exits.includes(s)));
				reachableDirections.delete(exit);
				total += reachableDirections.size;
				if(reachableStates.some(s => s.end.exit === exit && s.end.toggled === !toggled)) {
					total ++;
				}
			}
		}
		const average = total / (2 * exits.length);
		return average;
	}

	static addRoomVariants() {
		const length = ROOMS.length;
		for(let i = 0; i < length; i ++) {
			ROOMS.push(ROOMS[i].reflect());
		}
		for(let i = 0; i < 2 * length; i ++) {
			ROOMS.push(ROOMS[i].toggleGates());
		}
	}
}
