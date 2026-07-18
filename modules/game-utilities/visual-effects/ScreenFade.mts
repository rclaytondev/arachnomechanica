import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { MathUtils } from "../../../utils-ts/modules/math/MathUtils.mjs";
import { Renderable } from "../../world/Renderer.mjs";
import { GeomUtils } from "../GeomUtils.mjs";
import { VisualEffect } from "./VisualEffect.mjs";
import { VisualEffects } from "./VisualEffects.mjs";

export type FadeType = "damage-flash" | "transition-start-delay" | "transition-pause" | "transition-fade-out" | "transition-fade-in";

export class ScreenFade extends VisualEffect {
	startOpacity: number;
	endOpacity: number;
	color: string;
	timeElapsed: number = 0;
	duration: number;
	type: FadeType;
	onCompletion: () => void;

	constructor(duration: number, startOpacity: number, endOpacity: number, color: string, type: FadeType, onCompletion: () => void = () => {}) {
		super();
		this.duration = duration;
		this.startOpacity = startOpacity;
		this.endOpacity = endOpacity;
		this.color = color;
		this.type = type;
		this.onCompletion = onCompletion;
	}

	update(visualEffects: VisualEffects) {
		this.timeElapsed ++;
		if(this.isComplete()) {
			visualEffects.effectsList.delete(this);
			this.onCompletion();
		}
	}
	opacity() {
		const opacity = GeomUtils.lerp(
			this.timeElapsed,
			0, this.duration,
			this.startOpacity, this.endOpacity,
		);
		return MathUtils.constrain(opacity, 0, 1);
	}
	render() {
		return [
			new Renderable(c => this.display(c), "screen-fade"),
		];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.globalAlpha = this.opacity();
		canvasIO.fillCanvas(this.color);
		canvasIO.ctx.restore();
	}
	isComplete(): boolean {
		return this.timeElapsed >= this.duration;
	}

	static sequence(fades: ScreenFade[], visualEffects: VisualEffects) {
		for(let i = 0; i < fades.length - 1; i ++) {
			const fade = fades[i];
			const next = fades[i+1];
			const oldOnCompletion = fade.onCompletion;
			fade.onCompletion = () => {
				oldOnCompletion();
				visualEffects.effectsList.add(next);
			};
		}
		return fades[0];
	}
}
