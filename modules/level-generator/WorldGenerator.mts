import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
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

	}


	isPhysicallyConnected() {
		// const reachable = GameUtils.reachableNodes(
		// 	this.chunkCenter(),
		// 	(position) => (this.rooms.get(position) as )
		// );
	}



	chunkCenter(chunkPosition: Vector = this.currentChunk) {
		return chunkPosition.add(1/2, 1/2).multiply(LevelGeneratorData.CHUNK_SIZE).floor();
	}
	roomPosition(positionInChunk: Vector, chunkPosition: Vector = this.currentChunk) {
		return chunkPosition.multiply(LevelGeneratorData.CHUNK_SIZE).add(positionInChunk);
	}


	visualize(canvasIO: CanvasIO) {
		canvasIO.fillCanvas("white");
		for(const [room, position] of this.rooms.entries()) {
			this.visualizeRoom(canvasIO, room, position);
		}
	}
	visualizeRoom(canvasIO: CanvasIO, room: RoomPlaceholder, position: Vector) {
		position = position.multiply(DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE);
		canvasIO.ctx.fillStyle = "black";
		canvasIO.ctx.fillRect(
			position.x, position.y,
			room.exits.includes("up") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x, position.y,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
			room.exits.includes("left") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x, position.y + DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
			room.exits.includes("down") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x + DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE, position.y,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
			room.exits.includes("right") ? DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE : DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE,
		);
		canvasIO.ctx.fillRect(
			position.x + DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
			position.y + DEBUG_SETTINGS.GENERATOR_VISUALIZATION_SIZE - DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE,
			DEBUG_SETTINGS.GENERATOR_VISUALIZATION_BORDER_SIZE
		);
	}
}
