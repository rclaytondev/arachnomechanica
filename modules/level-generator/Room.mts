import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { RoomData, WorldData } from "../constants/GameData.mjs";
import { GateState } from "./GateState.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { Slope, World } from "../world/World.mjs";
import { Portal } from "../entities/Portal.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { Rooms, ROOMS } from "./Rooms.mjs";
import { SpawnPoint } from "../entities/SpawnPoint.mjs";
import { HealthPickup } from "../entities/HealthPickup.mjs";
import { GenUtils } from "../../utils-ts/modules/core-extensions/GenUtils.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";

export type Traversability = { start: GateState, end: GateState }[];
export type RoomTile = EmptyTile | Platform | BasicTile;
export type RoomEntity = Portal | SpawnPoint | HealthPickup | Gate;

export class Room {
	originalName: string;
	name: string;
	tiles: Grid<RoomTile>;
	canSpawnWithExits: (exits: Set<Direction>) => boolean;
	exitTiles: Grid<Direction | "none">;
	traversability: Traversability;
	entities: RoomEntity[];

	constructor(name: string, tiles: { x: number, y: number, type: | "solid" | "platform" | Slope }[] | Grid<RoomTile>, exitTiles: { x: number, y: number, direction: Direction }[] | Grid<Direction | "none">, entities: RoomEntity[] = [], canSpawnWithExits: (exits: Set<Direction>) => boolean, traversability?: Traversability) {
		this.originalName = name;
		this.name = name;
		if(tiles instanceof Grid) {
			this.tiles = tiles;
		}
		else {
			this.tiles = new Grid(EmptyTile.EMPTY);
			for(const { x, y, type } of tiles) {
				const tile = (
					type === "solid" ? new BasicTile("full", "tower")
					: World.isSlope(type as string) ? new BasicTile(type as Slope, "tower")
					: Platform.PLATFORM
				);
				this.tiles.set(x, y, tile);
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
		this.entities = entities;
	}

	hasPortal() {
		return this.entities.some(e => e instanceof Portal);
	}

	add(position: Vector, world: World, exits: Set<Direction>) {
		let entities = this.entities;
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const tile = this.tiles.get(x, y);
				const tileCopy = (typeof tile === "string") ? tile : tile.copy();
				const worldPosition = position.add(x, y);
				world.addOriginalTile(worldPosition, tileCopy);

				const direction = this.exitTiles.get(x, y);
				if(direction !== "none" && !exits.has(direction)) {
					world.addOriginalTile(worldPosition, new BasicTile("full", "tower"));
					entities = entities.filter(e => !(e instanceof Gate && e.tilePosition().equals(x, y)));
				}
			}
		}
		for(const entity of entities) {
			world.entities.add(entity.copyAndTranslate(position.multiply(WorldData.TILE_SIZE)));
		}
	}

	getExitCoordinates(direction: Direction, coordinate: "x" | "y") {
		return [...this.exitTiles.positions()].filter(p => this.exitTiles.get(p) === direction).map(p => p[coordinate]);
	}

	reflect() {
		const reflected = new Room(
			this.name,
			[],
			[],
			this.entities.map(e => e.reflect()),
			(exits) => this.canSpawnWithExits(new Set([...exits].map(e => Directions.reflectX[e]))),
			this.traversability.map(({ start, end }) => ({
				start: new GateState(null, Directions.reflectX[start.exit], start.toggled),
				end: new GateState(null, Directions.reflectX[end.exit], end.toggled),
			})),
		);
		reflected.name = `${this.name}-reflected`;
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const reflectedX = RoomData.SIZE - x - 1;
				const tile = this.tiles.get(x, y);
				reflected.tiles.set(reflectedX, y, tile.reflect());

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
			this.traversability.map(({ start, end }) => ({ start: start.copy(), end: end.copy() })),
		);
	}
	equals(room: Room) {
		return this.tiles.equals(room.tiles, (t1, t2) => t1.equals(t2));
	}
	toggleGates() {
		const copy = this.copy();
		copy.name += "-toggled";
		for(const entity of copy.entities) {
			if(entity instanceof Gate) {
				entity.toggled = !entity.toggled;
			}
		}
		copy.traversability = copy.traversability.map(({ start, end }) => ({
			start: new GateState(start.position, start.exit, !start.toggled),
			end: new GateState(end.position, end.exit, !end.toggled),
		}));
		return copy;
	}

	isOrdinaryRoom() {
		return !this.entities.some(e => e instanceof Portal || e instanceof HealthPickup || e instanceof SpawnPoint);
	}

	static gatelessPath(exit1: Direction, exit2: Direction) {
		return [
			{ start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
			{ start: new GateState(null, exit1, true), end: new GateState(null, exit2, true) },
			{ start: new GateState(null, exit2, false), end: new GateState(null, exit1, false) },
			{ start: new GateState(null, exit2, true), end: new GateState(null, exit1, true) },
		];
	}
	static onewayGatelessPath(exit1: Direction, exit2: Direction) {
		return [
			{ start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
			{ start: new GateState(null, exit1, true), end: new GateState(null, exit2, true) },
		];
	}
	static gatePath(exit1: Direction, exit2: Direction, open: boolean) {
		if(exit1 === exit2) {
			return [{ start: new GateState(null, exit1, !open), end: new GateState(null, exit2, open) } ];
		}
		return [
			{ start: new GateState(null, exit1, !open), end: new GateState(null, exit2, open) },
			{ start: new GateState(null, exit2, !open), end: new GateState(null, exit1, open) },
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

	generatability: number | null = null;
	getGeneratability() {
		if(this.generatability) { return this.generatability; }
		return this.generatability = (
			[...GenUtils.subsets(new Set(Directions.DIRECTIONS))]
			.filter(s => this.canSpawnWithExits(s))
			.length
		) / (2 ** 4);
	}
	static connectivity(traversability: Traversability, exits: Set<Direction>) {
		let total = 0;
		for(const exit of exits) {
			for(const toggled of [true, false]) {
				const reachableStates = traversability.filter(({ start }) => (
					start.exit === exit && start.toggled === toggled
				));
				const reachableDirections = new Set(reachableStates.map(s => s.end.exit).filter(s => exits.has(s)));
				reachableDirections.delete(exit);
				total += reachableDirections.size;
				if(reachableStates.some(s => s.end.exit === exit && s.end.toggled === !toggled)) {
					total ++;
				}
			}
		}
		return total / (2 * exits.size * exits.size);
	}
	static filterTraversability(traversability: Traversability, exits: Set<Direction>) {
		return traversability.filter(({ start, end }) => exits.has(start.exit) && exits.has(end.exit));
	}

	static addRoomVariants() {
		for(const room of [...ROOMS]) {
			const variants = [room];
			for(const variant of [room.reflect(), room.toggleGates(), room.reflect().toggleGates()]) {
				if(!variants.some(r => r.equals(variant))) {
					variants.push(variant);
					ROOMS.push(variant);
				}
			}
		}
	}
}

LoadingManager.onload(() => {
	Rooms.initialize();
	Room.addRoomVariants();
});
