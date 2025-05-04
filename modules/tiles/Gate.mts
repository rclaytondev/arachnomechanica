import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { World } from "../World.js";

export class Gate {
	static COLOR = "rgb(59, 67, 70)";
	
	direction: Direction; // which way the gate moves when closing
	openness: number;

	constructor(direction: Direction, open: boolean) {
		this.direction = direction;
		this.openness = open ? 1 : 0;
	}

	get closedness() {
		return 1 - this.openness;
	}

	getPhysicsBox(x: number, y: number) {
		if(this.direction === "down") {
			return new Rectangle(
				x * World.TILE_SIZE, y * World.TILE_SIZE,
				World.TILE_SIZE, this.closedness * World.TILE_SIZE
			);
		}
		else if(this.direction === "up") {
			return new Rectangle(
				x * World.TILE_SIZE, (y + this.closedness) * World.TILE_SIZE,
				World.TILE_SIZE, this.closedness * World.TILE_SIZE
			);
		}
		else if(this.direction === "left") {
			return new Rectangle(
				(x + this.closedness) * World.TILE_SIZE, y * World.TILE_SIZE,
				this.closedness * World.TILE_SIZE, World.TILE_SIZE
			)
		}
		else {
			return new Rectangle(
				x * World.TILE_SIZE, y * World.TILE_SIZE,
				this.closedness * World.TILE_SIZE, World.TILE_SIZE
			);
		}
	}

	display(canvasIO: CanvasIO, x: number, y: number) {
		const box = this.getPhysicsBox(x, y);
		canvasIO.ctx.fillStyle = Gate.COLOR;
		canvasIO.fillRect(box);
	}
	update() {

	}
}
