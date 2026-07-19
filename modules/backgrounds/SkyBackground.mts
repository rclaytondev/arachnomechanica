import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { BackgroundData } from "../constants/GameData.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { Background } from "./Background.mjs";

export class SkyBackground extends Background {
	zIndex: number = 0;

	stars: Vector[] = [];

	display(canvasIO: CanvasIO) {
		const gradient = canvasIO.ctx.createLinearGradient(0, 0, 0, canvasIO.canvas.height);
		for(const { color, y } of BackgroundData.SKY_BACKGROUND_COLORS) {
			gradient.addColorStop(y, color);
		}
		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.fillRect(0, 0, canvasIO.canvas.width, canvasIO.canvas.height);


		if(this.stars.length === 0) {
			this.initialize(canvasIO);
		}
		for(const star of this.stars) {
			canvasIO.ctx.fillStyle = "white";
			canvasIO.fillCircle(star.x, star.y, BackgroundData.STAR_SIZE);
		}
	}
	update() { }

	initialize(canvasIO: CanvasIO) {
		const amount = canvasIO.canvas.width * canvasIO.canvas.height * BackgroundData.STAR_DENSITY;
		this.stars = RandomUtils.randomEvenlySpaced({
			generate: () => new Vector(
				RandomUtils.random(0, canvasIO.canvas.width),
				RandomUtils.random(0, 1) ** 5 * canvasIO.canvas.height,
			),
			amount: amount,
			trials: BackgroundData.STAR_EVENNESS,
			previousPoints: this.stars,
			metric: Vector.dist,
		});
	}
}
