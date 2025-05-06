import { canvasIO, CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Room } from "./Room.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { Tile, World } from "./World.js";
import { WorldData } from "./constants/GameData.mjs";

export class RoomEditor {
	room: Room;
	world: World = new World();
	mode: "solid" | "platform" | "exit" | "gate-open" | "gate-closed" = "solid";
	direction: Direction = "right";
	static readonly MODES = ["solid", "platform", "exit", "gate-open", "gate-closed"] as const;

	constructor(room: Room = new Room("editor room", [], [], [], [])) {
		this.room = room;
		this.world = new World();
		for(const [tile, position] of this.room.tiles.entries()) {
			if(World.isTile(tile)) {
				this.world.tiles.set(position, tile);
			}
		}
	}


	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);
		this.checkForClicks(canvasIO);
		this.checkForKeyPresses(canvasIO);

		const numberKeys = canvasIO.numberKeys();
		if(numberKeys.length !== 0) {
			const key = numberKeys[0];
			if(key > 0 && key <= RoomEditor.MODES.length) {
				this.mode = RoomEditor.MODES[key - 1];
			}
		}
	}
	checkForClicks(canvasIO: CanvasIO) {
		if(!canvasIO.mouse.pressed) { return; }
		const position = this.world.getTileCoordinates(canvasIO.mouse.position);
		if(canvasIO.mouse.button === "left") {
			if(this.mode === "solid" || this.mode === "platform") {
				this.setTile(position, canvasIO.mouse.button === "left" ? this.mode : "empty");
			}
			else if(this.mode === "exit") {
				this.room.exitTiles.set(position, this.direction);
			}
			else if(this.mode === "gate-open") {
				this.setTile(position, new Gate(this.direction, true));
			}
			else if(this.mode === "gate-closed") {
				this.setTile(position, new Gate(this.direction, false));
			}
		}
		else {
			if(this.mode === "exit") {
				this.room.exitTiles.set(position, "none");
			}
			else {
				this.setTile(position, "empty");
			}
		}
	}
	setTile(position: Vector, tile: Tile) {
		this.world.tiles.set(position, tile);
		this.room.tiles.set(position, tile);
	}
	checkForKeyPresses(canvasIO: CanvasIO) {
		if(canvasIO.keys[DEBUG_SETTINGS.LOG_BLOCKS_KEY]) {
			this.logBlocks();
		}

		this.direction = (canvasIO.keyDirection() ?? this.direction);
	}

	display(canvasIO: CanvasIO) {
		this.world.display(canvasIO);
		this.displayHoveredTile(canvasIO);
		this.displayExits(canvasIO);
		this.displayGates(canvasIO);
		this.displayInfo(canvasIO);
	}

	
	displayHoveredTile(canvasIO: CanvasIO) {
		const position = this.world.getTileCoordinates(canvasIO.mouse.position).multiply(WorldData.TILE_SIZE);
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HOVERED_TILE_COLOR;
		canvasIO.ctx.strokeRect(position.x, position.y, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
	displayArrow(canvasIO: CanvasIO, position: Vector, direction: Direction) {
		canvasIO.drawArrow(
			position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
			WorldData.TILE_SIZE / 3,
			direction
		);
	}
	displayExits(canvasIO: CanvasIO) {
		for(const [tile, position] of this.room.exitTiles.entries()) {
			canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.EXIT_TILE_COLOR;
			this.displayArrow(canvasIO, position, tile as Direction);
		}
	}
	displayGates(canvasIO: CanvasIO) {
		for(const [tile, position] of this.room.tiles.entries()) {
			if(tile instanceof Gate) {
				canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.GATE_VISUALIZATION_COLOR;
				this.displayArrow(canvasIO, position, tile.direction);
			}
		}
	}
	displayInfo(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = DEBUG_SETTINGS.EDITOR_UI_COLOR;
		canvasIO.ctx.textAlign = "right";
		canvasIO.ctx.textBaseline = "top";
		canvasIO.ctx.font = "30px monospace";
		canvasIO.ctx.fillText(this.mode, canvasIO.canvas.width, 0);
		canvasIO.ctx.fillText(this.direction, canvasIO.canvas.width, 30);
	}

	getTileString(tile: Tile) {
		if(typeof tile === "string"){
			return `"${tile}"`;
		}
		else {
			return `new Gate("${tile.direction}", ${tile.open})`;
		}
	}
	logBlocks() {
		let result = "[\n";
		for(const [tile, position] of this.room.tiles.entries()) {
			result += `\t{ x: ${position.x}, y: ${position.y}, type: ${this.getTileString(tile)} },\n`;
		}
		result += "],\n[\n";
		for(const [direction, position] of this.room.exitTiles.entries()) {
			result += `\t{ x: ${position.x}, y: ${position.y}, direction: "${direction}" },\n`;
		}
		result += "],";
		console.log(result);
	}
}
