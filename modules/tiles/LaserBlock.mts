import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { LaserBlockData, WorldData } from "../constants/GameData.mjs";

export class LaserBlock {
	lasers: number;
	speed: number;
	angle: number;

	constructor(lasers: number, speed: number, angle: number) {
		this.lasers = lasers;
		this.speed = speed;
		this.angle = angle;
	}

	copy() {
		return new LaserBlock(this.lasers, this.speed, this.angle);
	}

	display(canvasIO: CanvasIO, x: number, y: number) {
		canvasIO.ctx.fillStyle = LaserBlockData.COLOR;
		canvasIO.ctx.fillRect(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
}
