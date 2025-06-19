import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Traversability } from "./Room.mjs";
import { GateState } from "./GateState.mjs";
import { ROOMS } from "./Rooms.mjs";
import { LevelGeneratorData, LizardData, RoomData, WorldData } from "../constants/GameData.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";

export type RoomPlaceholder = { exits: Direction[], traversability: Traversability };

export class LevelGenerator {
	path: Vector[] = [];
	rooms: Grid<RoomPlaceholder | null> = new Grid(null);

	static initializeRooms() {
		const length = ROOMS.length;
		for(let i = 0; i < length; i ++) {
			ROOMS.push(ROOMS[i].reflect());
		}
		for(let i = 0; i < 2 * length; i ++) {
			ROOMS.push(ROOMS[i].toggleGates());
		}
	}

	generatePath() {
		let x = GameUtils.randomInt(0, LevelGeneratorData.WIDTH - 1);
		let y = 0;
		this.path.push(new Vector(x, y));
		this.rooms.set(x, y, { exits: [], traversability: RoomData.ALL_TRAVERSABILITY });
		while(y < LevelGeneratorData.HEIGHT - 1) {
			const nextDirection = Utils.randomItem(this.possibleNextDirections(x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			this.path.push(nextPosition);
			this.rooms.set(nextPosition, {
				exits: [Directions.opposite[nextDirection]] as const,
				traversability: RoomData.ALL_TRAVERSABILITY
			});
			this.rooms.get(x, y)!.exits.push(nextDirection);
			[x, y] = [nextPosition.x, nextPosition.y];
		}
		const startRoom = this.rooms.get(this.path[this.path.length - 1])!;
		startRoom.traversability = RoomData.NO_GATE_TRAVERSABILITY;
		const endRoom = this.rooms.get(this.path[0])!;
		endRoom.traversability = RoomData.NO_GATE_TRAVERSABILITY;
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
	generateBranchesOffPath() {
		for(const position of this.path) {
			const room = this.rooms.get(position)!;
			const exits = Directions.DIRECTIONS.filter(dir => (
				this.rooms.get(position.add(Vector.unit(dir))) === null &&
				LevelGenerator.isInBounds(position.add(Vector.unit(dir)))
			));
			for(const exit of exits) {
				if(
					(Directions.isHorizontal(exit) && Math.random() < LevelGeneratorData.MAIN_PATH_BRANCH_PROBABILITY_X) ||
					(Directions.isVertical(exit) && Math.random() < LevelGeneratorData.MAIN_PATH_BRANCH_PROBABILITY_Y)
				) { room.exits.push(exit); }
			}
		}
	}

	generateRoom(position: Vector) {
		const exits = Directions.DIRECTIONS.filter(dir => (
			this.rooms.get(position.add(Vector.unit(dir)))?.exits.includes(Directions.opposite[dir])
		));
		if(exits.length === 0) {
			return false;
		}
		const otherExits = Directions.DIRECTIONS.filter(dir => !exits.includes(dir));
		for(const exit of otherExits) {
			const adjacentPosition = position.add(Vector.unit(exit));
			if(
				(
					(Directions.isHorizontal(exit) && Math.random() < LevelGeneratorData.OFF_PATH_BRANCH_PROBABILITY_X)
					|| (Directions.isVertical(exit) && Math.random() < LevelGeneratorData.OFF_PATH_BRANCH_PROBABILITY_Y)
				)
				&& LevelGenerator.isInBounds(adjacentPosition)
				&& this.rooms.get(adjacentPosition) === null
			) { exits.push(exit); }
		}
		this.rooms.set(position, { exits, traversability: RoomData.ALL_TRAVERSABILITY });
		return true;
	}
	generateRoomsOffPath() {
		const positions = [];
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				if(this.rooms.get(x, y) === null) {
					positions.push(new Vector(x, y));
				}
			}
		}
		let stillGenerating = true;
		while(stillGenerating) {
			stillGenerating = false;
			for(let i = 0; i < positions.length; i ++) {
				const generated = this.generateRoom(positions[i]);
				if(generated) {
					positions.splice(i, 1);
					i --;
					stillGenerating = true;
				}
			}
		}
	}

	neighborStates(state: GateState, backwards: boolean = false) {
		if(!state.position) {
			throw new Error("Cannot get next states if the state does not have a position set.");
		}
		const result = [];
		const rooms = [
			
		].filter(r => r !== null);
		const positions = [
			state.position,
			state.position.add(Vector.unit(state.exit))
		];
		for(const position of positions) {
			const room = this.rooms.get(position);
			if(!room) { continue; }
			for(let { start, end } of room.traversability) {
				if(!room.exits.includes(start.exit) || !room.exits.includes(end.exit)) { continue; }
				start = start.translate(position);
				end = end.translate(position);
				if(!backwards && start.equals(state)) {
					result.push(end);
				}
				if(backwards && end.equals(state)) {
					result.push(start);
				}
			}
		}
		return result;
	}
	reachableStates(startStates: GateState[], backwards: boolean = false) {
		const visited: GateState[] = [];
		const toVisit = [...startStates];
		while(toVisit.length !== 0) {
			const current = toVisit.pop()!;
			visited.push(current);
			for(const next of this.neighborStates(current, backwards)) {
				if(![...visited, ...toVisit].some(v => v.equals(next))) {
					toVisit.push(next);
				}
			}
		}
		return visited;
	}
	isConnected() {
		const startPosition = this.path[this.path.length - 1];
		const startRoom = this.rooms.get(startPosition);
		const startStates = startRoom!.exits.map(e => new GateState(startPosition, e, false));
		const reachableStates = this.reachableStates(startStates);
		const returnableStates = this.reachableStates(startStates, true);

		if(!this.roomPositions().every(
			room => this.rooms.get(room)!.exits.every(
				exit => reachableStates.some(
					state => state.equals(new GateState(room, exit, true)) || state.equals(new GateState(room, exit, false))
				)
			)
		)) { return false; }

		if(!reachableStates.every(s => returnableStates.some(s2 => s2.equals(s)))) {
			return false;
		}
		
		const endPosition = this.path[0];
		return reachableStates.some(s => s.isAdjacentTo(endPosition));
	}
	pruneRoom(position: Vector) {
		const oldRoom = this.rooms.get(position);
		if(!oldRoom) { return false; }
		const connectivity = LevelGenerator.connectivity(oldRoom.exits, oldRoom.traversability);
		const lessConnectiveRooms = ROOMS.filter(r => 
			LevelGenerator.connectivity(oldRoom.exits, r.traversability) < connectivity
			&& r.canAdd(oldRoom, false)
		);
		for(const room of GameUtils.randomPermutation(lessConnectiveRooms)) {
			this.rooms.set(position, { exits: oldRoom.exits, traversability: room.traversability });
			if(this.isConnected()) {
				return true;
			}
		}
		this.rooms.set(position, oldRoom);
		return false;
	}
	averageConnectivity() {
		let count = 0;
		let total = 0;
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				const room = this.rooms.get(x, y);
				if(room) {
					count ++;
					total += LevelGenerator.connectivity(room.exits, room.traversability);
				}
			}
		}
		return total / count;
	}
	pruneAll() {
		while(this.averageConnectivity() > LevelGeneratorData.MAX_CONNECTIVITY) {
			let prunedSome = false;
			const positions = new Rectangle(0, 0, LevelGeneratorData.WIDTH, LevelGeneratorData.HEIGHT).squares();
			for(const position of GameUtils.randomPermutation(positions)) {
				if(position.equals(this.path[this.path.length - 1]) || position.equals(this.path[0])) { continue; }
				const pruned = this.pruneRoom(position);
				if(pruned) { prunedSome = true; }
			}
			if(!prunedSome) { return; }
		}
	}

	generate() {
		this.generatePath();
		this.generateBranchesOffPath();
		this.generateRoomsOffPath();
		this.pruneAll();
	}

	roomPositions() {
		const positions = [];
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				if(this.rooms.get(x, y) !== null) {
					positions.push(new Vector(x, y))
				}
			}
		}
		return positions;
	}
	numRooms() {
		let count = 0;
		for(let x = 0; x < LevelGeneratorData.WIDTH; x ++) {
			for(let y = 0; y < LevelGeneratorData.HEIGHT; y ++) {
				if(this.rooms.get(x, y) !== null) {
					count ++;
				}
			}
		}
		return count;
	}
	static connectivity(exits: Direction[], traversability: Traversability) {
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
	static isInBounds(position: Vector) {
		return (
			0 <= position.x && position.x < LevelGeneratorData.WIDTH &&
			0 <= position.y && position.y < LevelGeneratorData.HEIGHT
		)
	}
}
