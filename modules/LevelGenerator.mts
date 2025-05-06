import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { GameUtils } from "./GameUtils.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";
import { LevelGeneratorData, LizardData, RoomData, WorldData } from "./constants/GameData.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { GateState } from "./tiles/Gate.mjs";
import { HashPartition } from "./game-utilities/HashPartition.mjs";

export type RoomPlaceholder = { exits: Direction[], traversability: GateState[][] };

type PositionalGateState = { position: Vector, direction: "right" | "down", toggled: boolean };

export class LevelGenerator {
	path: Vector[] = [];
	rooms: Grid<RoomPlaceholder | null> = new Grid(null);
	totalConnectivity: number = 56 * LevelGeneratorData.WIDTH * LevelGeneratorData.HEIGHT;

	static initializeRooms() {
		const length = ROOMS.length;
		for(let i = 0; i < length; i ++) {
			ROOMS.push(ROOMS[i].reflect());
		}
	}

	generatePath() {
		let x = GameUtils.randomInt(0, LevelGeneratorData.WIDTH - 1);
		let y = 0;
		this.path.push(new Vector(x, y));
		while(y < LevelGeneratorData.HEIGHT - 1) {
			const nextDirection = Utils.randomItem(this.possibleNextDirections(x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			this.path.push(nextPosition);
			this.rooms.set(nextPosition, {
				exits: [Directions.opposite(nextDirection)] as const,
				traversability: RoomData.ALL_TRAVERSABILITY
			});
			this.rooms.get(x, y)!.exits.push(nextDirection);
			[x, y] = [nextPosition.x, nextPosition.y];
		}
	}
	possibleNextDirections(x: number, y: number): Direction[] {
		if(this.path.length <= 1) {
			return [
				...((x > 0) ? ["left"] as const : []),
				...((x < LevelGeneratorData.WIDTH - 1) ? ["right"] as const : []), 
				"down"
			];
		}
		const lastRoom = this.path[this.path.length - 2];
		const directions: Direction[] = ["down"];
		if(x > 0 && !(x === lastRoom.x + 1 && y === lastRoom.y)) {
			directions.push("left");
		}
		if(x < LevelGeneratorData.WIDTH - 1 && !(x === lastRoom.x - 1 && y === lastRoom.y)) {
			directions.push("right");
		}
		return directions;
	}

	generateRoom(position: Vector) {
		const exits = Directions.DIRECTIONS.filter(dir => (
			this.rooms.get(position.add(Vector.unit(dir)))?.exits.includes(Directions.opposite(dir))
		));
		const otherExits = Directions.DIRECTIONS.filter(dir => !exits.includes(dir));
		for(const exit of otherExits) {
			if(Math.random() < LevelGeneratorData.OFF_PATH_BRANCH_PROBABILITY) {
				exits.push(exit);
			}
		}
		this.rooms.set(position, { exits, traversability: RoomData.ALL_TRAVERSABILITY });
	}
	generateRoomsOffPath() {
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				if(this.rooms.get(x, y) === null) {
					this.generateRoom(new Vector(x, y));
				}
			}
		}
	}

	getPositionalGateState(x: number, y: number, gateState: GateState): PositionalGateState {
		return {
			position: (
				gateState.direction === "left" ? new Vector(x - 1, y)
				: gateState.direction === "up" ? new Vector(x, y - 1)
				: new Vector(x, y)
			),
			direction: Directions.isHorizontal(gateState.direction) ? "right" : "down",
			toggled: gateState.toggled
		};
	}
	isConnected() {
		const partition = HashPartition.empty<PositionalGateState>(state => `${state.position}, ${state.direction}, ${state.toggled}`);
		for(let x = 0; x < LevelGeneratorData.WIDTH - 1; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT - 1; y ++) {
				if(this.rooms.get(x, y) != null) {
					partition.add({ position: new Vector(x, y), direction: "right", toggled: false });
					partition.add({ position: new Vector(x, y), direction: "right", toggled: true });
					partition.add({ position: new Vector(x, y), direction: "down", toggled: false });
					partition.add({ position: new Vector(x, y), direction: "down", toggled: true });
				}
			}
		}
		for(let x = 0; x < LevelGeneratorData.WIDTH - 1; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT - 1; y ++) {
				const room = this.rooms.get(x, y);
				if(!room) { continue; }
				for(const component of room.traversability) {
					const first = component[0];
					const positionalGateState = this.getPositionalGateState(x, y, first);
					for(const state of component) {
						partition.merge(positionalGateState, this.getPositionalGateState(x, y, state));
					}
				}
				if(partition.numSets === 1) { return true; }
			}
		}
		return false;
	}
	pruneRoom(position: Vector) {
		const oldRoom = this.rooms.get(position);
		if(!oldRoom) { return false; }
		const connectivity = Room.connectivity(this.rooms.get(position)!.traversability,  oldRoom.exits);
		const lessConnectiveRooms = ROOMS.filter(r => 
			Room.connectivity(r.traversability, oldRoom.exits) < connectivity
			&& r.canAdd(oldRoom.exits, oldRoom.traversability)
		);
		for(const room of GameUtils.randomPermutation(lessConnectiveRooms)) {
			this.rooms.set(position, { exits: oldRoom.exits, traversability: room.traversability });
			if(this.isConnected()) {
				this.totalConnectivity += Room.connectivity(room.traversability, oldRoom.exits) - connectivity;
				return true;
			}
		}
		this.rooms.set(position, oldRoom);
		return false;
	}
	averageConnectivity() {
		return this.totalConnectivity / (LevelGeneratorData.WIDTH * LevelGeneratorData.HEIGHT);
	}
	pruneAll() {
		const prunables = [];
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				prunables.push(new Vector(x, y));
			}
		}
		while(this.averageConnectivity() > LevelGeneratorData.MAX_CONNECTIVITY && prunables.length > 0) {
			const index = Utils.randomIndex(prunables);
			const position = prunables[index];
			const pruned = this.pruneRoom(position);
			if(!pruned) { prunables.splice(index, 1); }
		}
	}

	generate() {
		this.generatePath();
		this.generateRoomsOffPath();
		this.pruneAll();
	}
}
