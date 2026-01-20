import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { VisualEffect } from "./VisualEffect.mjs";

export class ShakeEffect extends VisualEffect {
	readonly renderingOrder = "before";

	timeLeft: number = 0;
	intensity: number = 0;

	constructor(time: number, intensity: number) {
		super(() => {});
		this.timeLeft = time;
		this.intensity = intensity;
	}

	update() {
		this.timeLeft --;
	}

	display(canvasIO: CanvasIO): void {
		const amountX = GameUtils.random(-this.intensity, this.intensity);
		const amountY = GameUtils.random(-this.intensity, this.intensity);
		canvasIO.ctx.translate(amountX, amountY);
	}

	isComplete() {
		return this.timeLeft <= 0;
	}
}
