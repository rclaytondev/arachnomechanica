import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { VisualEffect } from "./VisualEffect.mjs";

export class VisualEffects {
	private effectsList: VisualEffect[] = [];

	add(effect: VisualEffect) {
		this.effectsList.push(effect);
	}
	allEffects() {
		return [...this.effectsList];
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

	display(canvasIO: CanvasIO, mode: "before" | "after") {
		for(const effect of this.effectsList.filter(e => e.renderingOrder === mode)) {
			effect.display(canvasIO);
		}
	}
}
