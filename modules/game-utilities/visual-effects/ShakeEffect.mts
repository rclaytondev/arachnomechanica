import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Renderable } from "../../world/Renderer.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { VisualEffect } from "./VisualEffect.mjs";
import { VisualEffects } from "./VisualEffects.mjs";

export class ShakeEffect extends VisualEffect {
	timeLeft: number = 0;
	intensity: number = 0;

	constructor(time: number, intensity: number) {
		super();
		this.timeLeft = time;
		this.intensity = intensity;
	}

	update(visualEffects: VisualEffects) {
		this.timeLeft --;
		if(this.timeLeft <= 0) {
			visualEffects.effectsList.delete(this);
		}
	}

	render() {
		return [
			new Renderable(c => this.display(c), "shake"),
			new Renderable(c => c.ctx.restore(), "reset-shake"),
		];
	}
	display(canvasIO: CanvasIO): void {
		const amountX = GameUtils.random(-this.intensity, this.intensity);
		const amountY = GameUtils.random(-this.intensity, this.intensity);
		canvasIO.ctx.translate(amountX, amountY);
	}
}
