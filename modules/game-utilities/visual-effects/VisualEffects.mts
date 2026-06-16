import { Renderer } from "../../world/Renderer.mjs";
import { VisualEffect } from "./VisualEffect.mjs";

export class VisualEffects {
	effectsList: Set<VisualEffect> = new Set();

	update() {
		for(const effect of this.effectsList) {
			effect.update(this);
		}
	}

	render(renderer: Renderer) {
		for(const effect of this.effectsList) {
			renderer.renderables.push(...effect.render());
		}
	}
}
