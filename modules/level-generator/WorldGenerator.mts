import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { LevelGeneratorData, RoomData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";
import { World } from "../World";
import { GateState } from "./GateState.mjs";
import { Room } from "./Room.mjs";
import { RoomPlaceholder } from "./RoomPlaceholder.mjs";
import { ROOMS } from "./Rooms.mjs";

export class WorldGenerator {
	rooms: Grid<RoomPlaceholder | null> = new Grid(null);
	currentChunk: Vector = new Vector(0, 0);

	generateChunk(chunkPosition: Vector, world: World) {
		this.currentChunk = chunkPosition;
		this.initializeChunk();
		this.prunePhysicalConnections();
		this.connectRandomRooms();
		this.pruneConnections();
		this.addRooms(world);
		world.entitySpawner.generateChunk(chunkPosition, world);
	}

	initializeChunk() {
		for(let x = 0; x < LevelGeneratorData.CHUNK_SIZE; x ++) {
			for(let y = 0; y < LevelGeneratorData.CHUNK_SIZE; y ++) {
				const position = this.roomPosition(new Vector(x, y));
				const placeholder = new RoomPlaceholder([...Directions.DIRECTIONS], ROOMS.find(r => r.name === "control-room-junction")!);
				this.rooms.set(position, placeholder);
			}
		}
	}
	prunePhysicalConnections() {
		const connections: { position: Vector, direction: Direction }[] = [];
		for(let x = 0; x < LevelGeneratorData.CHUNK_SIZE; x ++) {
			for(let y = 0; y < LevelGeneratorData.CHUNK_SIZE; y ++) {
				const position = this.roomPosition(new Vector(x, y));
				connections.push({ position, direction: "right" });
				connections.push({ position, direction: "down" });
				if(x === 0) {
					connections.push({ position, direction: "left" });
				}
				if(y === 0) {
					connections.push({ position, direction: "up" });
				}
			}
		}
		const randomized = GameUtils.randomPermutation(connections);
		for(const { position, direction } of randomized) {
			const adjacent = position.add(Vector.unit(direction));
			const adjacentRoom = this.rooms.get(adjacent);
			if(adjacentRoom && adjacentRoom.generated) {
				this.setConnected(position, direction, adjacentRoom.exits.includes(Directions.opposite[direction]));
			}
			else {
				this.disconnect(position, direction);
				if(!this.isPhysicallyConnected()) {
					this.connect(position, direction);
				}
			}
		}
	}
	connectRandomRooms() {
		const edges = this.unconnectedEdges();
		const interior = edges.filter(({ position, direction }) => this.isInChunk(position) && this.isInChunk(position.add(Vector.unit(direction))));
		const boundary = edges.filter(e => !interior.includes(e));

		for(const { position, direction } of GameUtils.randomPermutation(interior).slice(0, LevelGeneratorData.INTERIOR_CONNECTIONS)) {
			this.connect(position, direction);
		}
		for(const direction of Directions.DIRECTIONS) {
			if(!this.isChunkGenerated(this.currentChunk.add(Vector.unit(direction)))) {
				const boundaryInDirection = boundary.filter(edge => edge.direction === direction);
				for(const { position } of GameUtils.randomPermutation(boundaryInDirection).slice(0, LevelGeneratorData.BOUNDARY_CONNECTIONS)) {
					this.connect(position, direction);
				}
			}
		}
	}
	pruneConnections() {
		const positions = this.chunkRectangle().squares();
		for(const position of positions.sort((a, b) => this.rooms.get(b)!.exits.length - this.rooms.get(a)!.exits.length)) {
			this.pruneRoom(this.rooms.get(position)!);
		}
	}
	pruneRoom(roomPlaceholder: RoomPlaceholder) {
		const originalRoom = roomPlaceholder.room;
		const connectivity = Room.connectivity(roomPlaceholder.room.traversability, roomPlaceholder.exits);
		const lessConnectiveRooms = Utils.groupBy(
			ROOMS.filter(r => (
				r.canSpawnWithExits(roomPlaceholder.exits)
				&& Room.connectivity(r.traversability, roomPlaceholder.exits) < connectivity)
			),
			r => Room.connectivity(r.traversability, roomPlaceholder.exits)
		)
		while(lessConnectiveRooms.size > 0) {
			const room = Utils.randomItem(lessConnectiveRooms.get(Math.min(...lessConnectiveRooms.keys()))!);
			roomPlaceholder.room = room;
			if(this.isConnected()) { return; }
			for(const connectedness of [...lessConnectiveRooms.keys()]) {
				const group = lessConnectiveRooms.get(connectedness)!;
				lessConnectiveRooms.set(connectedness, group.filter(r => !Utils.isSubset(
					Room.filterTraversability(r.traversability, roomPlaceholder.exits).map(s => `${s.end}, ${s.start}`),
					Room.filterTraversability(room.traversability, roomPlaceholder.exits).map(s => `${s.end}, ${s.start}`)
				)));
				if(lessConnectiveRooms.get(connectedness)!.length === 0) {
					lessConnectiveRooms.delete(connectedness);
				}
			}
		}
		roomPlaceholder.room = originalRoom;
	}
	addRooms(world: World) {
		for(const position of this.chunkRectangle().squares()) {
			const roomPlaceholder = this.rooms.get(position)!;
			roomPlaceholder.generated = true;
			roomPlaceholder.room.add(position.multiply(RoomData.SIZE), world, roomPlaceholder.exits);
		}
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
	isPhysicallyConnected() {
		const reachable = GameUtils.reachableNodes<Vector | Direction>(
			this.chunkCenter(),
			(position) => position instanceof Vector ? this.rooms.get(position)!.exits
				.map(e => position.add(Vector.unit(e)))
				.map(p => this.isInChunk(p) ? p : this.directionFromChunk(p)) : [],
			v => v.toString()
		);
		return reachable.length >= LevelGeneratorData.CHUNK_SIZE ** 2 + 4;
	}
	isConnected() {
		const edges = this.connectedEdges().length; // can be optimized: this is a constant.
		const chunkCenter = this.rooms.get(this.chunkCenter());
		const startState = new GateState(this.chunkCenter(), chunkCenter!.exits[0], false);
		for(const backwards of [true, false]) {
			const reachable = GameUtils.reachableNodes(
				startState,
				(state) => this.neighbors(state, backwards).filter(n => this.isEdgeInChunk(n.position!, n.exit)),
				v => v.normalize().toString(true)
			);
			if(reachable.length < edges * 2) {
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
			state.position.add(Vector.unit(state.exit))
		];
		for(const position of positions) {
			const room = this.rooms.get(position);
			if(!room) { continue; }
			for(let { start, end } of room.room.traversability) {
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
	connectedEdges(chunkPosition: Vector = this.currentChunk) {
		return this.edgesInChunk(chunkPosition).filter(
			({ position, direction }) => this.rooms.get(position)?.exits.includes(direction)
		);
	}
	unconnectedEdges(chunkPosition: Vector = this.currentChunk) {
		return this.edgesInChunk(chunkPosition).filter(
			({ position, direction }) => !(this.rooms.get(position)?.exits.includes(direction))
		);
	}



	chunkCenter(chunkPosition: Vector = this.currentChunk) {
		return chunkPosition.add(1/2, 1/2).multiply(LevelGeneratorData.CHUNK_SIZE).floor();
	}
	roomPosition(positionInChunk: Vector, chunkPosition: Vector = this.currentChunk) {
		return chunkPosition.multiply(LevelGeneratorData.CHUNK_SIZE).add(positionInChunk);
	}
	isInChunk(position: Vector, chunkPosition: Vector = this.currentChunk) {
		return position.divide(LevelGeneratorData.CHUNK_SIZE).floor().equals(chunkPosition);
	}
	isEdgeInChunk(position: Vector, edge: Direction, chunkPosition: Vector = this.currentChunk) {
		return this.isInChunk(position, chunkPosition) || this.isInChunk(position.add(Vector.unit(edge)), chunkPosition);
	}
	chunkRectangle(chunkPosition: Vector = this.currentChunk) {
		return Rectangle.square(
			chunkPosition.x * LevelGeneratorData.CHUNK_SIZE,
			chunkPosition.y * LevelGeneratorData.CHUNK_SIZE,
			LevelGeneratorData.CHUNK_SIZE,
		);
	}
	directionFromChunk(position: Vector, chunkPosition: Vector = this.currentChunk): Direction {
		if(position.x < chunkPosition.x * LevelGeneratorData.CHUNK_SIZE) {
			return "left";
		}
		else if(position.x >= (chunkPosition.x + 1) * LevelGeneratorData.CHUNK_SIZE) {
			return "right";
		}
		else if(position.y < chunkPosition.y * LevelGeneratorData.CHUNK_SIZE) {
			return "up";
		}
		else {
			return "down";
		}
	}
	isChunkGenerated(chunkPosition: Vector) {
		const roomPlaceholder = this.rooms.get(chunkPosition.multiply(LevelGeneratorData.CHUNK_SIZE));
		return roomPlaceholder != null && roomPlaceholder.room != null;
	}
	edgesInChunk(chunkPosition: Vector = this.currentChunk) {
		const edges: { position: Vector, direction: Direction }[] = [];
		for(let x = 0; x < LevelGeneratorData.CHUNK_SIZE; x ++) {
			for(let y = 0; y < LevelGeneratorData.CHUNK_SIZE; y ++) {
				const position = this.roomPosition(new Vector(x, y), chunkPosition);
				edges.push({ position, direction: "right" });
				edges.push({ position, direction: "down" });
				if(x === 0) {
					edges.push({ position, direction: "left" });
				}
				if(y === 0) {
					edges.push({ position, direction: "up" });
				}
			}
		}
		return edges;
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
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION.BORDER_SIZE
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
				DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE / RoomData.SIZE
			)
		}
	}
}
