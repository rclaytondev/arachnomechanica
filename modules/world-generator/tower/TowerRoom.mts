import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../../utils-ts/modules/Grid.mjs";
import { RoomData, WorldData } from "../../constants/GameData.mjs";
import { GateState } from "./GateState.mjs";
import { RoomPlaceholder } from "./TowerLevelGenerator.mjs";
import { Gate } from "../../tiles/Gate.mjs";
import { Slope, Tile, World } from "../../World.js";
import { Portal } from "../../entities/Portal.mjs";
import { SolidTile } from "../../tiles/SolidTile.mjs";
import { Room } from "../Room.mjs";

export type Traversability = { start: GateState, end: GateState }[];

export class TowerRoom extends Room {
	traversability: Traversability;
	declare canSpawnWithExits: ((exits: Direction[]) => boolean);
	declare exitTiles: Grid<Direction | "none">;

	constructor(name: string, tiles: { x: number, y: number, type: Tile | "solid" | Slope }[] | Grid<Tile>, exitTiles: { x: number, y: number, direction: Direction }[] | Grid<Direction | "none">, entities: Portal[] = [], canSpawnWithExits: (exits: Direction[]) => boolean, traversability?: Traversability, weight: number = 1) {
		super(name, tiles, exitTiles, entities, canSpawnWithExits, RoomData.SIZE, RoomData.SIZE, weight);
		this.traversability = GateState.deduplicateTraversability((traversability ?? RoomData.NO_GATE_TRAVERSABILITY));
	}

	canAdd(roomPlaceholder: RoomPlaceholder, matchTraversability: boolean = true) {
		const traversabilityMatches = GateState.traversabilityEquals(
			this.traversability,
			roomPlaceholder.traversability
		);
		return this.canSpawnWithExits(roomPlaceholder.exits) && (traversabilityMatches || !matchTraversability);
	}

	reflect() {
		const [tiles, exitTiles] = this.reflectTiles();
		const reflected = new TowerRoom(
			`${this.name}-reflected`,
			tiles,
			exitTiles as Grid<Direction | "none">,
			this.entities.map(e => e.reflect()),
			(exits) => this.canSpawnWithExits(exits.map(e => Directions.reflectX[e])),
			this.traversability.map(({ start, end }) => ({ 
				start: new GateState(null, Directions.reflectX[start.exit], start.toggled),
				end: new GateState(null, Directions.reflectX[end.exit], end.toggled)
			}))
		);
		return reflected;
	}
	copy() {
		return new TowerRoom(
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
}
