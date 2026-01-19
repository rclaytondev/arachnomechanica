import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Room, RoomTile } from "./level-generator/Room.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { World } from "./world/World.mjs";
import { PortalData, WorldData } from "./constants/GameData.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { ROOMS } from "./level-generator/Rooms.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Portal } from "./entities/Portal.mjs";
import { BasicTile } from "./tiles/BasicTile.mjs";
import { EmptyTile } from "./tiles/EmptyTile.mjs";
import { Platform } from "./tiles/Platform.mjs";
import { Tile } from "./tiles/Tile.mjs";
import { Tiles } from "./world/Tiles.mjs";
import { HealthPickup } from "./entities/HealthPickup.mjs";
import { SpawnPoint } from "./entities/SpawnPoint.mjs";

export class RoomEditor {
	room: Room;
	world: World = new World(false);
	mode: "solid" | "platform" | "exit" | "gate-open" | "gate-closed" | "portal" | "slope" = "solid";
	direction: Direction | Diagonal = "right";
	static readonly MODES = ["solid", "platform", "exit", "gate-open", "gate-closed", "portal", "slope"] as const;

	constructor(room: Room = new Room("editor room", [], [], [], () => false, [])) {
		this.room = room;
		this.world = new World(false);
		for(const [tile, position] of this.room.tiles.entries()) {
			this.world.tiles.set(position, tile);
		}
		for(const entity of this.room.entities) {
			this.world.entities.add(entity);
		}
	}


	update(canvasIO: CanvasIO) {
		this.world.camera = new Vector(canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
		this.world.update(canvasIO);
		this.checkForClicks(canvasIO);
		this.checkForKeyPresses(canvasIO);
		this.world.originalTiles = this.world.tiles;

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
		const position = Tiles.getTileCoordinates(canvasIO.mouse.position);
		if(canvasIO.mouse.button === "left") {
			if(this.mode === "solid") {
				this.setTile(position, canvasIO.mouse.button === "left" ? new BasicTile("full", "tower") : EmptyTile.EMPTY);
			}
			else if(this.mode === "platform") {
				this.setTile(position, canvasIO.mouse.button === "left" ? Platform.PLATFORM : EmptyTile.EMPTY);
			}
			else if(this.mode === "exit" && Directions.isDirection(this.direction)) {
				this.room.exitTiles.set(position, this.direction);
			}
			else if((this.mode === "gate-open" || this.mode === "gate-closed") && Directions.isDirection(this.direction)) {
				const gateExists = Gate.isGateAt(position, this.world);
				if(!gateExists) {
					const gate = Gate.atTile(position, this.direction, (this.mode === "gate-open"));
					this.addEntity(gate);
				}
			}
			else if(this.mode === "portal") {
				const portalPosition = this.getPortalPosition(position);
				if(!this.room.entities.some(p => p instanceof Portal && p.position.equals(portalPosition))) {
					this.addEntity(new Portal(portalPosition));
				}
			}
			else if(this.mode === "slope" && Directions.isDiagonal(this.direction)) {
				const tile = ({
					"up-left": "slope-ceiling-left",
					"up-right": "slope-ceiling-right",
					"down-left": "slope-floor-left",
					"down-right": "slope-floor-right",
				} as const)[this.direction];
				this.setTile(position, new BasicTile(tile, "tower"));
			}
		}
		else {
			if(this.mode === "exit") {
				this.room.exitTiles.set(position, "none");
			}
			else if(this.mode !== "portal") {
				this.setTile(position, EmptyTile.EMPTY);
			}
			else {
				const portalPosition = this.getPortalPosition(position);
				this.filterEntities(e => !(e instanceof Portal && e.position.equals(portalPosition)));
			}
			this.filterEntities(e => !(e instanceof Gate && e.tilePosition().equals(position)));
		}
	}
	getPortalPosition(tilePosition: Vector) {
		return Tiles.getTileCoordinates(tilePosition.multiply(WorldData.TILE_SIZE).add(PortalData.WIDTH / 2, 0))
			.add(0, 1).multiply(WorldData.TILE_SIZE);
	}
	setTile(position: Vector, tile: RoomTile) {
		this.world.tiles.set(position, tile);
		this.room.tiles.set(position, tile);
	}
	checkForKeyPresses(canvasIO: CanvasIO) {
		if(canvasIO.keys[DEBUG_SETTINGS.LOG_BLOCKS_KEY]) {
			this.logBlocks();
		}
		this.updateDirection(canvasIO);
		if(canvasIO.keys.Equal && !GameUtils.pastKeys.Equal) {
			this.loadNextRoom();
		}
		else if(canvasIO.keys.Minus && !GameUtils.pastKeys.Minus) {
			this.loadPreviousRoom();
		}
	}
	updateDirection(canvasIO: CanvasIO) {
		const KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
		if(KEYS.some(k => canvasIO.keys[k] && !GameUtils.pastKeys[k])) {
			this.direction = canvasIO.keyDirection(true) ?? this.direction;
		}
	}
	loadRoom(room: Room) {
		this.room = room;
		this.world = new World(false);
		room.add(new Vector(0, 0), this.world, new Set<Direction>(["left", "right", "up", "down"]));
	}
	loadNextRoom() {
		const index = ROOMS.indexOf(this.room);
		if(index < ROOMS.length - 1) {
			this.loadRoom(ROOMS[index + 1]);
			// eslint-disable-next-line no-console
			console.log(`loaded room ${index + 1} (${ROOMS[index + 1].name}) in the editor`);
		}
	}
	loadPreviousRoom() {
		const index = ROOMS.indexOf(this.room);
		if(index > 0) {
			this.loadRoom(ROOMS[index - 1]);
			// eslint-disable-next-line no-console
			console.log(`loaded room ${index - 1} (${ROOMS[index - 1].name}) in the editor`);
		}
	}

	display(canvasIO: CanvasIO) {
		this.world.display(
			canvasIO,
			new Rectangle(0, 0, canvasIO.canvas.width / WorldData.TILE_SIZE, canvasIO.canvas.height / WorldData.TILE_SIZE),
		);
		this.displayHoveredTile(canvasIO);
		this.displayExits(canvasIO);
		this.displayGates(canvasIO);
		this.displayInfo(canvasIO);
	}

	addEntity(entity: Portal | HealthPickup | SpawnPoint | Gate) {
		this.room.entities.push(entity);
		this.world.entities.add(entity);
	}
	filterEntities(callback: (entity: Portal | HealthPickup | SpawnPoint | Gate) => boolean) {
		this.room.entities = this.room.entities.filter(callback);
		for(const entity of this.world.entities) {
			const valid = (entity instanceof Portal || entity instanceof HealthPickup || entity instanceof SpawnPoint || entity instanceof Gate);
			if(valid && !callback(entity)) {
				this.world.entities.delete(entity);
			}
		}
	}


	displayHoveredTile(canvasIO: CanvasIO) {
		const position = Tiles.getTileCoordinates(canvasIO.mouse.position).multiply(WorldData.TILE_SIZE);
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HOVERED_TILE_COLOR;
		canvasIO.ctx.strokeRect(position.x, position.y, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
	displayArrow(canvasIO: CanvasIO, position: Vector, direction: Direction) {
		canvasIO.drawArrow(
			position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
			WorldData.TILE_SIZE / 3,
			direction,
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
		if(tile instanceof EmptyTile){
			return "\"empty\"";
		}
		else if(tile instanceof Platform){
			return "\"platform\"";
		}
		else if(tile instanceof BasicTile) {
			return `"${tile.shape === "full" ? "solid" : tile.shape}"`;
		}
		else {
			throw new Error("Found unexpected tile in level editor.");
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
		result += "],\n[\n";
		for(const entity of this.room.entities) {
			if(entity instanceof Portal) {
				result += `\tnew Portal(new Vector${entity.position}),\n`;
			}
			else if(entity instanceof Gate) {
				const position = entity.tilePosition();
				result += `\tGate.atTile(new Vector(${position.x}, ${position.y}), "${entity.direction}", ${entity.toggled}),\n`;
			}
		}
		result += "],";
		// eslint-disable-next-line no-console
		console.log(result);
	}
}
