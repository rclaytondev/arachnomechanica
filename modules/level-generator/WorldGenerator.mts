import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { LevelGeneratorData, RoomData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Room } from "./Room.mjs";
import { RoomPlaceholder } from "./RoomPlaceholder.mjs";

export class WorldGenerator {
	rooms: Grid<RoomPlaceholder> = new Grid(new RoomPlaceholder(
		[...Directions.DIRECTIONS],
		RoomData.ALL_TRAVERSABILITY
	));
	currentChunk: Vector = new Vector(0, 0);

	generateChunk(chunkPosition: Vector) {
		this.currentChunk = chunkPosition;
		this.initializeChunk();
		this.prunePhysicalConnections();
		this.connectRandomRooms();
	}

	initializeChunk() {
		for(let x = 0; x < LevelGeneratorData.CHUNK_SIZE; x ++) {
			for(let y = 0; y < LevelGeneratorData.CHUNK_SIZE; y ++) {
				const position = this.roomPosition(new Vector(x, y));
				const placeholder = new RoomPlaceholder([...Directions.DIRECTIONS], RoomData.ALL_TRAVERSABILITY);
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
			}
		}
		const randomized = GameUtils.randomPermutation(connections);
		for(const { position, direction } of randomized) {
			const adjacent = position.add(Vector.unit(direction));
			const adjacentRoom = this.rooms.get(adjacent);
			if(adjacentRoom.room != null) {
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
		const unconnected = [];
		const unconnectedBoundary = [];
		for(let x = 0; x < LevelGeneratorData.CHUNK_SIZE; x ++) {
			for(let y = 0; y < LevelGeneratorData.CHUNK_SIZE; y ++) {
				const position = this.roomPosition(new Vector(x, y));
				for(const direction of Directions.DIRECTIONS) {
					const adjacent = position.add(Vector.unit(direction));
					const adjacentRoom = this.rooms.get(adjacent);
					if(this.isInChunk(adjacent) && (direction === "right" || direction === "down") && !adjacentRoom.exits.includes(Directions.opposite[direction])) {
						unconnected.push({ position, direction });
					}
					else if(!this.isInChunk(adjacent) && !adjacentRoom.room) {
						unconnectedBoundary.push({ position, direction });
					}
				}
			}
		}

		for(const { position, direction } of GameUtils.randomPermutation(unconnected).slice(0, LevelGeneratorData.INTERIOR_CONNECTIONS)) {
			this.connect(position, direction);
		}
		for(const direction of Directions.DIRECTIONS) {
			if(!this.isChunkGenerated(this.currentChunk.add(Vector.unit(direction)))) {
				const boundary = unconnectedBoundary.filter(edge => edge.direction === direction);
				for(const { position } of GameUtils.randomPermutation(boundary).slice(0, LevelGeneratorData.BOUNDARY_CONNECTIONS)) {
					this.connect(position, direction);
				}
			}
		}
	}


	connect(roomPosition: Vector, direction: Direction) {
		const adjacentRoom = this.rooms.get(roomPosition.add(Vector.unit(direction)));
		const opposite = Directions.opposite[direction];
		const room = this.rooms.get(roomPosition);
		if(!room.exits.includes(direction)) {
			room.exits.push(direction);
		}
		if(!adjacentRoom.exits.includes(opposite)) {
			adjacentRoom.exits.push(opposite);
		}
	}
	disconnect(roomPosition: Vector, direction: Direction) {
		const adjacentRoom = this.rooms.get(roomPosition.add(Vector.unit(direction)));
		const opposite = Directions.opposite[direction];
		const room = this.rooms.get(roomPosition);
		room.exits = room.exits.filter(e => e !== direction);
		adjacentRoom.exits = adjacentRoom.exits.filter(e => e !== opposite);
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
			(position) => position instanceof Vector ? this.rooms.get(position).exits
				.map(e => position.add(Vector.unit(e)))
				.map(p => this.isInChunk(p) ? p : this.directionFromChunk(p)) : [],
			(v1, v2) => v1 === v2 || (v1 instanceof Vector && v2 instanceof Vector && v1.equals(v2))
		);
		return reachable.length >= LevelGeneratorData.CHUNK_SIZE ** 2 + 4;
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
		return roomPlaceholder.room != null;
	}


	visualize(canvasIO: CanvasIO) {
		canvasIO.fillCanvas("white");
		for(const [room, position] of this.rooms.entries()) {
			this.visualizeRoom(canvasIO, room, position);
		}

		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_COLOR;
		for(let i = 0; i < Math.max(canvasIO.canvas.width, canvasIO.canvas.height); i += DEBUG_SETTINGS.GENERATOR_VISUALIZATION.GRID_SIZE) {
			canvasIO.strokeLine(0, i, canvasIO.canvas.width, i);
			canvasIO.strokeLine(i, 0, i, canvasIO.canvas.height);
		}
	}
	visualizeRoom(canvasIO: CanvasIO, room: RoomPlaceholder, position: Vector) {
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
}
