import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { DEBUG_SETTINGS } from "./Main.js";
import { Room } from "./Room.mjs";
import { World } from "./World.js";

export class RoomEditor {
	room: Room = new Room("editor room", [], [], []);
	world: World = new World();


	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);

		if(canvasIO.mouse.pressed) {
			const position = this.world.getTileCoordinates(canvasIO.mouse.position)
			this.world.tiles.set(position, canvasIO.mouse.button === "left" ? "solid" : "empty");
			this.room.tiles.set(position, canvasIO.mouse.button === "left" ? "solid" : "empty");
		}

		if(canvasIO.keys[DEBUG_SETTINGS.LOG_BLOCKS_KEY]) {
			this.logBlocks();
		}
		this.addExits(canvasIO);
	}
	addExits(canvasIO: CanvasIO) {
		const position = this.world.getTileCoordinates(canvasIO.mouse.position);
		if(canvasIO.keys.ArrowLeft) {
			this.room.tiles.set(position, "left");
		}
		if(canvasIO.keys.ArrowRight) {
			this.room.tiles.set(position, "right");
		}
		if(canvasIO.keys.ArrowUp) {
			this.room.tiles.set(position, "up");
		}
		if(canvasIO.keys.ArrowDown) {
			console.log("hlelo")
			this.room.tiles.set(position, "down");
		}
	}

	display(canvasIO: CanvasIO) {
		this.world.display(canvasIO);
		this.displayHoveredTile(canvasIO);
		this.displayExits(canvasIO);
	}

	
	displayHoveredTile(canvasIO: CanvasIO) {
		const position = this.world.getTileCoordinates(canvasIO.mouse.position).multiply(World.TILE_SIZE);
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HOVERED_TILE_COLOR;
		canvasIO.ctx.strokeRect(position.x, position.y, World.TILE_SIZE, World.TILE_SIZE);
	}
	displayExits(canvasIO: CanvasIO) {
		for(const [tile, position] of this.room.tiles.entries()) {
			if(Directions.isDirection(tile)) {
				canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.EXIT_TILE_COLOR;
				canvasIO.drawArrow(
					position.add(1/2, 1/2).multiply(World.TILE_SIZE),
					World.TILE_SIZE / 3,
					tile
				);
			}
		}
	}

	logBlocks() {
		let result = "";
		for(const [tile, position] of this.room.tiles.entries()) {
			result += `{ x: ${position.x}, y: ${position.y}, type: "${tile}" },\n`;
		}
		console.log(result);
	}
}
