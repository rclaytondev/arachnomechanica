import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { DEBUG_SETTINGS } from "./Main.js";
import { Room } from "./Room.mjs";
import { World } from "./World.js";

export class RoomEditor {
	room: Room = new Room("editor room", new Grid("empty"), [], []);
	world: World = new World();


	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);

		if(canvasIO.mouse.pressed) {
			const position = this.world.getTileCoordinates(canvasIO.mouse.position)
			this.world.tiles.set(position, "solid");
			this.room.tiles.set(position, "solid");
		}

		if(canvasIO.keys[DEBUG_SETTINGS.LOG_BLOCKS_KEY]) {
			this.logBlocks();
		}
	}
	display(canvasIO: CanvasIO) {
		this.world.display(canvasIO);
		this.displayHoveredTile(canvasIO);
	}

	
	displayHoveredTile(canvasIO: CanvasIO) {
		const position = this.world.getTileCoordinates(canvasIO.mouse.position).multiply(World.TILE_SIZE);
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HOVERED_TILE_COLOR;
		canvasIO.ctx.strokeRect(position.x, position.y, World.TILE_SIZE, World.TILE_SIZE);
	}

	logBlocks() {
		let result = "";
		for(const position of this.world.tiles.positions()) {
			result += `${position.toString()},\n`;
		}
		console.log(result);
	}
}
