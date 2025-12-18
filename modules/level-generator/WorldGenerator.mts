import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { LevelGeneratorData, RoomData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.js";
import { GateState } from "./GateState.mjs";
import { Room } from "./Room.mjs";
import { RoomPlaceholder } from "./RoomPlaceholder.mjs";
import { ROOMS } from "./Rooms.mjs";
import { Portal } from "../entities/Portal.mjs";
import { SpawnPoint } from "../entities/SpawnPoint.mjs";
import { HealthPickup } from "../entities/HealthPickup.mjs";

export class WorldGenerator {
	path: Vector[] = [];
	rooms: Grid<RoomPlaceholder | null> = new Grid(null);
	position: Vector;

	constructor(position: Vector = new Vector(0, 0)) {
		this.position = position;
	}

	generateLevel(world: World) {
		this.generatePath();
		this.generateExitsOnPath();
		this.generateExitsOffPath();
		this.generateHealthPickupRooms();
		this.generateRooms();
		this.addRooms(world);
		this.addBorders(world);
	}

	generatePath() {
		const defaultRoom = ROOMS.find(r => r.name === "control-room-junction")!;

		let x = GameUtils.randomInt(0, LevelGeneratorData.WIDTH - 1);
		let y = 0;
		this.path.push(new Vector(x, y));
		const portalRoom = new RoomPlaceholder([], ROOMS.find(r => r.entities.some(e => e instanceof Portal))!);
		portalRoom.generated = true;
		this.rooms.set(x, y, portalRoom);
		while(y < LevelGeneratorData.HEIGHT - 1) {
			const nextDirection = Utils.randomItem(this.possibleNextDirections(x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			this.path.push(nextPosition);
			this.rooms.set(nextPosition, new RoomPlaceholder([Directions.opposite[nextDirection]], defaultRoom));
			this.rooms.get(x, y)!.exits.add(nextDirection);
			[x, y] = [nextPosition.x, nextPosition.y];
		}
		const startRoom = this.rooms.get(this.path[this.path.length - 1])!;
		startRoom.room = Utils.randomItem(ROOMS.filter(r => r.entities.some(e => e instanceof SpawnPoint)));
		startRoom.generated = true;
	}
	possibleNextDirections(x: number, y: number): Direction[] {
		if(this.path.length <= 1) {
			return [
				...((x > 0) ? ["left"] as const : []),
				...((x < LevelGeneratorData.WIDTH - 1) ? ["right"] as const : []),
				"down",
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
	generateExitsOnPath() {
		for(const position of this.path) {
			const room = this.rooms.get(position)!;
			const exits = Directions.DIRECTIONS.filter(dir => (
				this.rooms.get(position.add(Vector.unit(dir))) === null &&
				this.isInBounds(position.add(Vector.unit(dir)))
			));
			for(const exit of exits) {
				if(
					(Directions.isHorizontal(exit) && Math.random() < LevelGeneratorData.MAIN_PATH_BRANCH_PROBABILITY_X) ||
					(Directions.isVertical(exit) && Math.random() < LevelGeneratorData.MAIN_PATH_BRANCH_PROBABILITY_Y)
				) { room.exits.add(exit); }
			}
		}
	}
	generateExitsOffPath() {
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
				const generated = this.generateExits(positions[i]);
				if(generated) {
					positions.splice(i, 1);
					i --;
					stillGenerating = true;
				}
			}
		}
	}
	generateExits(position: Vector) {
		const exits = Directions.DIRECTIONS.filter(dir => (
			this.rooms.get(position.add(Vector.unit(dir)))?.exits.has(Directions.opposite[dir])
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
				&& this.isInBounds(adjacentPosition)
				&& this.rooms.get(adjacentPosition) === null
			) { exits.push(exit); }
		}
		this.rooms.set(position, new RoomPlaceholder(exits, ROOMS.find(r => r.name === "control-room-junction")!));
		return true;
	}

	generateHealthPickupRooms() {
		const allPositions = this.levelRectangle().squares();
		const offPath = allPositions.filter(p => !this.path.some(q => p.equals(q)));
		const positions = [
			...GameUtils.randomPermutation(offPath),
			...GameUtils.randomPermutation(this.path),
		];
		const healthPickupRooms = ROOMS.filter(r => r.entities.some(e => e instanceof HealthPickup));
		for(const room of GameUtils.randomPermutation(healthPickupRooms)) {
			for(const position of positions) {
				const roomPlaceholder = this.rooms.get(position);
				if(roomPlaceholder != null && room.canSpawnWithExits(roomPlaceholder.exits)) {
					roomPlaceholder.room = room;
					roomPlaceholder.generated = true;
					return;
				}
			}
		}
	}


	generateRooms() {
		const rooms = (this.levelRectangle().squares()
			.map(p => this.rooms.get(p))
			.filter(p => p != null)
			.filter(p => !p.generated)
			.sort((a, b) => a.exits.size - b.exits.size)
		);
		for(const room of rooms) {
			this.generateRoom(room);
		}
	}
	generateRoom(roomPlaceholder: RoomPlaceholder) {
		const originalRoom = roomPlaceholder.room;
		const possibleRooms = Utils.groupBy(
			ROOMS.filter(r => (
				r.canSpawnWithExits(roomPlaceholder.exits)
				&& r.entities.length === 0
			)),
			r => Room.connectivity(r.traversability, roomPlaceholder.exits),
		);
		while(possibleRooms.size > 0) {
			const room = this.getRoomCandidate(possibleRooms);
			roomPlaceholder.room = room;
			if(this.isConnected()) { return; }
			for(const connectedness of [...possibleRooms.keys()]) {
				const group = possibleRooms.get(connectedness)!;
				possibleRooms.set(connectedness, group.filter(r => !Utils.isSubset(
					Room.filterTraversability(r.traversability, roomPlaceholder.exits).map(s => `${s.end}, ${s.start}`),
					Room.filterTraversability(room.traversability, roomPlaceholder.exits).map(s => `${s.end}, ${s.start}`),
				)));
				if(possibleRooms.get(connectedness)!.length === 0) {
					possibleRooms.delete(connectedness);
				}
			}
		}
		roomPlaceholder.room = originalRoom;
	}
	getRoomCandidate(roomsWithConnectivities: Map<number, Room[]>) {
		const minConnectivity = Math.min(...roomsWithConnectivities.keys());
		const rooms = roomsWithConnectivities.get(minConnectivity)!;
		const weights = rooms.map(r => this.getWeight(r, minConnectivity));
		return GameUtils.weightedRandom(rooms, weights);
	}
	// getRoomCandidate(roomsWithConnectivities: Map<number, Room[]>) {
	// 	const connectivities = [...roomsWithConnectivities.keys()];
	// 	const rooms = connectivities.flatMap(c => roomsWithConnectivities.get(c)!);
	// 	const weights = connectivities.flatMap(c => roomsWithConnectivities.get(c)!.flatMap(r => this.getWeight(r, c)));
	// 	console.log(rooms.map((r, i) => [r.originalName, weights[i]]));
	// 	const result = GameUtils.weightedRandom(rooms, weights);
	// 	if(weights[rooms.indexOf(result)] === 0) { debugger; }
	// 	return result;
	// }
	getWeight(room: Room, connectivity: number) {
		const generatability = room.getGeneratability();
		return (
			LevelGeneratorData.GENERATABILITY_MULTIPLIER * (1 - generatability)
			+ LevelGeneratorData.CONNECTIVITY_MULTIPLIER * (1 - connectivity)
			+ LevelGeneratorData.WEIGHT_BONUS
		) * (this.hasGenerated(room) ? LevelGeneratorData.DUPLICATE_PENALTY_MULTIPLIER : 1);
	}
	addRooms(world: World) {
		for(const position of this.levelRectangle().squares()) {
			const roomPlaceholder = this.rooms.get(position)!;
			if(roomPlaceholder) {
				roomPlaceholder.generated = true;
				roomPlaceholder.room.add(this.position.add(position.multiply(RoomData.SIZE)), world, roomPlaceholder.exits);
			}
			else {
				const rectangle = Rectangle.square(
					this.position.x + position.x * RoomData.SIZE,
					this.position.y + position.y * RoomData.SIZE,
					RoomData.SIZE,
				);
				world.tiles.fillRect(rectangle, new BasicTile("full", "tower"));
				world.originalTiles.fillRect(rectangle, new BasicTile("full", "tower"));
			}
		}
	}
	addBorders(world: World) {
		const fillSolidRect = (x: number, y: number, w: number, h: number) => {
			world.tiles.fillRect(new Rectangle(x, y, w, h), new BasicTile("full", "tower"));
			world.originalTiles.fillRect(new Rectangle(x, y, w, h), new BasicTile("full", "tower"));
		};

		fillSolidRect(
			this.position.x - LevelGeneratorData.BORDER_X, this.position.y - LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.WIDTH * RoomData.SIZE + LevelGeneratorData.BORDER_X,
			LevelGeneratorData.BORDER_Y,
		);
		fillSolidRect(
			this.position.x - LevelGeneratorData.BORDER_X, this.position.y,
			LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * RoomData.SIZE,
		);
		fillSolidRect(
			this.position.x + LevelGeneratorData.WIDTH * RoomData.SIZE, this.position.y - LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * RoomData.SIZE + LevelGeneratorData.BORDER_Y,
		);
		fillSolidRect(
			this.position.x - LevelGeneratorData.BORDER_X, this.position.y + LevelGeneratorData.HEIGHT * RoomData.SIZE,
			LevelGeneratorData.WIDTH * RoomData.SIZE + 2 * LevelGeneratorData.BORDER_X,
			LevelGeneratorData.BORDER_Y,
		);
	}


	isInBounds(position: Vector) {
		return (
			0 <= position.x && position.x < LevelGeneratorData.WIDTH &&
			0 <= position.y && position.y < LevelGeneratorData.HEIGHT
		);
	}
	isEdgeInBounds(position: Vector, direction: Direction) {
		return this.isInBounds(position) && this.isInBounds(position.add(Vector.unit(direction)));
	}
	setConnected(roomPosition: Vector, direction: Direction, connected: boolean) {
		const adjacentRoom = this.rooms.get(roomPosition.add(Vector.unit(direction)));
		const opposite = Directions.opposite[direction];
		const room = this.rooms.get(roomPosition);
		if(connected) {
			room?.exits.add(direction);
			adjacentRoom?.exits.add(opposite);
		}
		else {
			room?.exits.delete(direction);
			adjacentRoom?.exits.delete(opposite);
		}
	}
	isConnected() {
		const edges = this.connectedEdges();
		const startRoom = this.rooms.get(this.path[this.path.length - 1])!;
		const startState = new GateState(this.path[this.path.length - 1], [...startRoom.exits][0], false);
		for(const backwards of [true, false]) {
			const reachable = GameUtils.reachableNodes(
				startState,
				(state) => this.neighbors(state, backwards).filter(n => this.isEdgeInBounds(n.position!, n.exit)),
				v => v.normalize().toString(true),
			);
			if(reachable.length < edges) {
				return false;
			}
		}
		return true;
	}
	neighbors(state: GateState, backwards: boolean = false) {
		if(!state.position) {
			throw new Error("Cannot get next states if the state does not have a position set.");
		}
		const result = [];
		const positions = [
			state.position,
			state.position.add(Vector.unit(state.exit)),
		];
		for(const position of positions) {
			const room = this.rooms.get(position);
			if(!room) { continue; }
			for(const { start, end } of room.room.traversability) {
				if(!room.exits.has(start.exit) || !room.exits.has(end.exit)) { continue; }
				if(!backwards && start.translate(position).equals(state)) {
					result.push(end.translate(position));
				}
				if(backwards && end.translate(position).equals(state)) {
					result.push(start.translate(position));
				}
			}
		}
		return result;
	}
	hasGenerated(room: Room) {
		const rooms = [...this.rooms.values()];
		return rooms.some(r => r?.room.originalName === room.originalName);
	}

	levelRectangle() {
		return new Rectangle(0, 0, LevelGeneratorData.WIDTH, LevelGeneratorData.HEIGHT);
	}
	connectedEdges() {
		return MathUtils.sum(this.levelRectangle().squares().map(s => this.rooms.get(s)?.exits.size ?? 0));
	}


	visualize(canvasIO: CanvasIO, pauseDebugger: boolean = true) {
		canvasIO.fillCanvas("white");
		for(const [room, position] of this.rooms.entries()) {
			if(room) {
				this.visualizeRoom(canvasIO, room, position);
			}
		}

		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_COLOR;
		for(let i = 0; i < Math.max(canvasIO.canvas.width, canvasIO.canvas.height); i += DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE) {
			canvasIO.strokeLine(0, i, canvasIO.canvas.width, i);
			canvasIO.strokeLine(i, 0, i, canvasIO.canvas.height);
		}
		if(pauseDebugger) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
	}
	visualizeExits(canvasIO: CanvasIO, room: RoomPlaceholder, position: Vector) {
		position = position.multiply(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE);
		canvasIO.ctx.fillStyle = "black";
		canvasIO.ctx.fillRect(
			position.x, position.y,
			room.exits.has("up") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x, position.y,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			room.exits.has("left") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x, position.y + DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			room.exits.has("down") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x + DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE, position.y,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			room.exits.has("right") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x + DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			position.y + DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
		);
	}
	visualizeRoom(canvasIO: CanvasIO, roomPlaceholder: RoomPlaceholder, position: Vector) {
		for(const tilePosition of Rectangle.square(0, 0, RoomData.SIZE).squares()) {
			const tile = roomPlaceholder.room.tiles.get(tilePosition);
			const exitTile = roomPlaceholder.room.exitTiles.get(tilePosition);
			if(tile instanceof BasicTile || tile === "platform" || (exitTile !== "none" && !roomPlaceholder.exits.has(exitTile as Direction))) {
				canvasIO.ctx.fillStyle = "black";
			}
			else if(tile instanceof Gate) {
				canvasIO.ctx.fillStyle = tile.open ? "green" : "red";
			}
			else { continue; }
			canvasIO.fillSquare(
				DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE * (position.x + tilePosition.x / RoomData.SIZE),
				DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE * (position.y + tilePosition.y / RoomData.SIZE),
				DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE / RoomData.SIZE,
			);
		}
	}

	static roomFrequencies(numTrials: number) {
		const counts = new Map<string, number>();
		for(let i = 0; i < numTrials; i ++) {
			const world = new World(false);
			const generator = new WorldGenerator();
			generator.generateLevel(world);
			for(const room of [...generator.rooms.values()].filter(r => r !== null)) {
				counts.set(room.room.originalName, (counts.get(room.room.originalName) ?? 0) + 1);
			}
		}
		return counts;
	}
}
