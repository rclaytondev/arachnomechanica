import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { VisualEffect } from "./VisualEffect.mjs";

export class VisualEffects {
	private effectsList: VisualEffect[] = [];

	add(effect: VisualEffect) {
		this.effectsList.push(effect);
	}

	update() {
		for(const effect of this.effectsList) {
			effect.update();
			if(effect.isComplete()) {
				effect.onCompletion();
				this.effectsList = this.effectsList.filter(e => e !== effect);
			}
		}
	}

	display(canvasIO: CanvasIO) {
		for(const effect of this.effectsList) {
			effect.display(canvasIO);
		}
	}
}
