import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../../constants/GameData.mjs";
import { Renderable } from "../../world/Renderer.mjs";
import { VisualEffect } from "./VisualEffect.mjs";
import { VisualEffects } from "./VisualEffects.mjs";

type OverlayOptions = {
	offset?: Vector;
	font?: string;
	fadeSpeed?: number;
	initialOpacity?: number;
}

export class OverlayText extends VisualEffect {
	text: string;
	opacity: number;
	offset: Vector;
	font: string;
	fadeSpeed: number;

	constructor(text: string, options: OverlayOptions = {}) {
		super();
		this.text = text;
		this.opacity = options.initialOpacity ?? 1;
		this.offset = options.offset ?? new Vector(0, 0);
		this.font = options.font ?? WorldData.OVERLAY_FONT;
		this.fadeSpeed = options.fadeSpeed ?? WorldData.OVERLAY_FADE_SPEED;
	}

	render() {
		return [
			new Renderable(c => this.display(c), "overlay-text"),
		];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.font = this.font;
		canvasIO.ctx.fillStyle = WorldData.OVERLAY_COLOR;
		canvasIO.ctx.globalAlpha = MathUtils.constrain(this.opacity, 0, 1);
		canvasIO.ctx.textAlign = "center";
		canvasIO.ctx.fillText(this.text, canvasIO.canvas.width / 2 + this.offset.x, canvasIO.canvas.height / 2 + this.offset.y);
		canvasIO.ctx.restore();
	}
	update(visualEffects: VisualEffects) {
		this.opacity -= this.fadeSpeed;
		if(this.opacity <= 0) {
			visualEffects.effectsList.delete(this);
		}
	}
}
