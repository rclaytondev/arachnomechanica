import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Creature } from "./creatures/Creature.js";
import { DEBUG_SETTINGS } from "./Main.js";

type Tile = "solid" | "empty";

export class World {
	static TILE_SIZE = 50;
	static TILE_COLOR = "rgb(100, 100, 100)";

	tiles: Grid<Tile> = new Grid("empty");
	creatures: Creature[] = [];


	display(canvasIO: CanvasIO) {
		canvasIO.fillCanvas("white");
		this.displayTiles(canvasIO);
		this.displayCreatures(canvasIO);

		if(canvasIO.mouse.pressed && DEBUG_SETTINGS.PLACE_BLOCKS_WITH_CURSOR) {
			this.tiles.set(this.getTileCoordinates(canvasIO.mouse.position), "solid");
		}
	}
	displayTiles(canvasIO: CanvasIO) {
		for(const [tileType, position] of this.tiles.entries()) {
			if(tileType === "solid") {
				canvasIO.ctx.fillStyle = World.TILE_COLOR;
				canvasIO.ctx.fillRect(
					position.x * World.TILE_SIZE, 
					position.y * World.TILE_SIZE, 
					World.TILE_SIZE, World.TILE_SIZE
				);
			}
		}
	}
	displayCreatures(canvasIO: CanvasIO) {
		for(const creature of this.creatures) {
			creature.display(canvasIO);
		}
	}

	update() {
		this.updateCreatures();
	}
	updateCreatures() {
		for(const creature of this.creatures) {
			creature.update(this);
		}
	}

	getTileCoordinates(onscreenPosition: Vector) {
		return new Vector(
			Math.floor(onscreenPosition.x / World.TILE_SIZE), 
			Math.floor(onscreenPosition.y / World.TILE_SIZE)
		);
	}
	getTileAt(onscreenPosition: Vector) {
		return this.tiles.get(this.getTileCoordinates(onscreenPosition));
	}
}
