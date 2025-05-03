import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Creature } from "./creatures/Creature.js";
import { DEBUG_SETTINGS } from "./Main.js";
import { Player } from "./Player.mjs";

export type Tile = "solid" | "empty";

export class World {
	static TILE_SIZE = 50;
	static TILE_COLOR = "rgb(100, 100, 100)";

	tiles: Grid<Tile> = new Grid("empty");
	creatures: Creature[] = [];

	player: Player = new Player();


	display(canvasIO: CanvasIO) {
		canvasIO.fillCanvas("white");
		this.displayTiles(canvasIO);
		this.displayCreatures(canvasIO);
		this.player.display(canvasIO);
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

	update(canvasIO: CanvasIO) {
		this.updateCreatures();
		this.player.update(this, canvasIO);
	}
	updateCreatures() {
		for(const creature of this.creatures) {
			creature.update(this);
		}
	}

	getTileX(onscreenX: number) {
		return Math.floor(onscreenX / World.TILE_SIZE);
	}
	getTileY(onscreenY: number) {
		return Math.floor(onscreenY / World.TILE_SIZE);
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
	isInSolid(rectangle: Rectangle) {
		const left = this.getTileX(rectangle.left());
		const right = this.getTileX(rectangle.right() - 1);
		const top = this.getTileY(rectangle.top());
		const bottom = this.getTileY(rectangle.bottom() - 1);
		for(let x = left; x <= right; x ++) {
			for(let y = top; y <= bottom; y ++) {
				if(this.tiles.get(x, y) === "solid") {
					return true;
				}
			}
		}
		return false;
	}
}
