import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { Traversability } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { LevelGeneratorData, LizardData, RoomData, WorldData } from "./constants/GameData.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";

export type RoomPlaceholder = { exits: Direction[], traversability: Traversability };

export class LevelGenerator {
	path: Vector[] = [];
	rooms: Grid<RoomPlaceholder | null> = new Grid(null);
	totalConnectivity: number = 0;

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

	isConnected() {
		// TODO: rewrite this!
		return true;
	}
	pruneRoom(position: Vector) {
		const oldRoom = this.rooms.get(position);
		if(!oldRoom) { return false; }
		const connectivity = LevelGenerator.connectivity(oldRoom.exits, oldRoom.traversability);
		const lessConnectiveRooms = ROOMS.filter(r => 
			LevelGenerator.connectivity(oldRoom.exits, r.traversability) < connectivity
			&& r.canAdd(oldRoom.exits)
		);
		for(const room of GameUtils.randomPermutation(lessConnectiveRooms)) {
			this.rooms.set(position, { exits: oldRoom.exits, traversability: room.traversability });
			if(this.isConnected()) {
				this.totalConnectivity += LevelGenerator.connectivity(oldRoom.exits, room.traversability) - connectivity;
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
		this.totalConnectivity = this.numRooms();
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
		const connections = traversability.filter(
			({ start, end }) => exits.includes(start.exit) && exits.includes(end.exit)
		).length;
		return connections / ((2 * exits.length) * (2 * exits.length - 1) / 2);
	}
}
