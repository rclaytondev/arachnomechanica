import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { BackgroundData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";

export class SkyBackground {
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

	initialize(canvasIO: CanvasIO) {
		const amount = canvasIO.canvas.width * canvasIO.canvas.height * BackgroundData.STAR_DENSITY;
		for(let i = 0; i < amount; i ++) {
			const next = GameUtils.randomEvenlySpaced(
				canvasIO.boundingBox(),
				this.stars,
				BackgroundData.STAR_EVENNESS,
				"float",
				() => new Vector(GameUtils.random(0, canvasIO.canvas.width), GameUtils.random(0, 1) ** 5 * canvasIO.canvas.height)
			);
			this.stars.push(next);
		}
	}
}
