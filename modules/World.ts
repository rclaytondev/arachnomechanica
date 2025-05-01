import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Lizard } from "./creatures/Lizard";

type Tile = "solid" | "empty";

export class World {
	static TILE_SIZE = 50;
	static TILE_COLOR = "rgb(100, 100, 100)";

	tiles: Grid<Tile> = new Grid("empty");
	creatures: Lizard[] = [];


	display(canvasIO: CanvasIO) {
		canvasIO.fillCanvas("white");
		this.displayTiles(canvasIO);
		this.displayCreatures(canvasIO);
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
			creature.update();
		}
	}
}
