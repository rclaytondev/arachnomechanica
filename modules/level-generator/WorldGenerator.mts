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
import { SolidTile } from "../tiles/SolidTile.mjs";
import { World } from "../world/World";
import { GateState } from "./GateState.mjs";
import { Room } from "./Room.mjs";
import { RoomPlaceholder } from "./RoomPlaceholder.mjs";
import { ROOMS } from "./Rooms.mjs";

export class WorldGenerator {
	path: Vector[] = [];
	rooms: Grid<RoomPlaceholder | null> = new Grid(null);
	currentChunk: Vector = new Vector(0, 0);
	position: Vector;

	constructor(position: Vector = new Vector(0, 0)) {
		this.position = position;
	}

	generateLevel(world: World) {
		this.generatePath();
		this.generateBranchesOffPath();
		this.generateRoomsOffPath();
		this.pruneConnections();
		this.addRooms(world);
		this.addBorders(world);
	}

	generatePath() {
		const defaultRoom = ROOMS.find(r => r.name === "control-room-junction")!;

		let x = GameUtils.randomInt(0, LevelGeneratorData.WIDTH - 1);
		let y = 0;
		this.path.push(new Vector(x, y));
		const portalRoom = new RoomPlaceholder([], ROOMS.find(r => r.name === "level-exit")!);
		portalRoom.generated = true;
		this.rooms.set(x, y, portalRoom);
		while(y < LevelGeneratorData.HEIGHT - 1) {
			const nextDirection = Utils.randomItem(this.possibleNextDirections(x, y));
			const nextPosition = Vector.unit(nextDirection).add(x, y);
			this.path.push(nextPosition);
			this.rooms.set(nextPosition, new RoomPlaceholder([Directions.opposite[nextDirection]], defaultRoom));
			this.rooms.get(x, y)!.exits.push(nextDirection);
			[x, y] = [nextPosition.x, nextPosition.y];
		}
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
	generateBranchesOffPath() {
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
				) { room.exits.push(exit); }
			}
		}
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
				&& this.isInBounds(adjacentPosition)
				&& this.rooms.get(adjacentPosition) === null
			) { exits.push(exit); }
		}
		this.rooms.set(position, new RoomPlaceholder(exits, ROOMS.find(r => r.name === "control-room-junction")!));
		return true;
	}


	pruneConnections() {
		const rooms = (this.levelRectangle().squares()
			.map(p => this.rooms.get(p))
			.filter(p => p != null)
			.filter(p => !p.generated)
			.sort((a, b) => a.exits.length - b.exits.length)
		);
		for(const room of rooms) {
			this.pruneRoom(room);
		}
	}
	pruneRoom(roomPlaceholder: RoomPlaceholder) {
		const originalRoom = roomPlaceholder.room;
		const connectivity = Room.connectivity(roomPlaceholder.room.traversability, roomPlaceholder.exits);
		const lessConnectiveRooms = Utils.groupBy(
			ROOMS.filter(r => (
				r.canSpawnWithExits(roomPlaceholder.exits)
				&& Room.connectivity(r.traversability, roomPlaceholder.exits) < connectivity)
				&& r.originalName !== "level-exit",
			),
			r => Room.connectivity(r.traversability, roomPlaceholder.exits),
		);
		while(lessConnectiveRooms.size > 0) {
			const room = Utils.randomItem(lessConnectiveRooms.get(Math.min(...lessConnectiveRooms.keys()))!);
			roomPlaceholder.room = room;
			if(this.isConnected()) { return; }
			for(const connectedness of [...lessConnectiveRooms.keys()]) {
				const group = lessConnectiveRooms.get(connectedness)!;
				lessConnectiveRooms.set(connectedness, group.filter(r => !Utils.isSubset(
					Room.filterTraversability(r.traversability, roomPlaceholder.exits).map(s => `${s.end}, ${s.start}`),
					Room.filterTraversability(room.traversability, roomPlaceholder.exits).map(s => `${s.end}, ${s.start}`),
				)));
				if(lessConnectiveRooms.get(connectedness)!.length === 0) {
					lessConnectiveRooms.delete(connectedness);
				}
			}
		}
		roomPlaceholder.room = originalRoom;
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
				world.tiles.fillRect(rectangle, new SolidTile("solid", "tower"));
				world.originalTiles.fillRect(rectangle, new SolidTile("solid", "tower"));
			}
		}
	}
	addBorders(world: World) {
		const fillSolidRect = (x: number, y: number, w: number, h: number) => {
			world.tiles.fillRect(new Rectangle(x, y, w, h), new SolidTile("solid", "tower"));
			world.originalTiles.fillRect(new Rectangle(x, y, w, h), new SolidTile("solid", "tower"));
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
	connect(roomPosition: Vector, direction: Direction) {
		const adjacentRoom = this.rooms.get(roomPosition.add(Vector.unit(direction)));
		const opposite = Directions.opposite[direction];
		const room = this.rooms.get(roomPosition);
		if(room && !room.exits.includes(direction)) {
			room.exits.push(direction);
		}
		if(adjacentRoom && !adjacentRoom.exits.includes(opposite)) {
			adjacentRoom.exits.push(opposite);
		}
	}
	disconnect(roomPosition: Vector, direction: Direction) {
		const adjacentRoom = this.rooms.get(roomPosition.add(Vector.unit(direction)));
		const opposite = Directions.opposite[direction];
		const room = this.rooms.get(roomPosition);
		if(room) {
			room.exits = room.exits.filter(e => e !== direction);
		}
		if(adjacentRoom) {
			adjacentRoom.exits = adjacentRoom.exits.filter(e => e !== opposite);
		}
	}
	setConnected(room: Vector, direction: Direction, connected: boolean) {
		if(connected) {
			this.connect(room, direction);
		}
		else {
			this.disconnect(room, direction);
		}
	}
	isConnected() {
		const edges = this.connectedEdges();
		const startRoom = this.rooms.get(this.path[this.path.length - 1]);
		const startState = new GateState(this.path[this.path.length - 1], startRoom!.exits[0], false);
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
				if(!room.exits.includes(start.exit) || !room.exits.includes(end.exit)) { continue; }
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

	levelRectangle() {
		return new Rectangle(0, 0, LevelGeneratorData.WIDTH, LevelGeneratorData.HEIGHT);
	}
	connectedEdges() {
		return MathUtils.sum(this.levelRectangle().squares().map(s => this.rooms.get(s)?.exits?.length ?? 0));
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
			room.exits.includes("up") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x, position.y,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			room.exits.includes("left") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x, position.y + DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			room.exits.includes("down") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x + DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE, position.y,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE,
			room.exits.includes("right") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE,
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
			if(tile instanceof SolidTile || tile === "platform" || (exitTile !== "none" && !roomPlaceholder.exits.includes(exitTile as Direction))) {
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
}
