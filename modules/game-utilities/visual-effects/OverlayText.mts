import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { MathUtils } from "../../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../../constants/GameData.mjs";
import { VisualEffect } from "./VisualEffect.mjs";

export class OverlayText extends VisualEffect {
	text: string;
	opacity: number;
	constructor(text: string) {
		super(() => {});
		this.text = text;
		this.opacity = 1;
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.font = WorldData.OVERLAY_FONT;
		canvasIO.ctx.fillStyle = WorldData.OVERLAY_COLOR;
		canvasIO.ctx.globalAlpha = MathUtils.constrain(this.opacity, 0, 1);
		canvasIO.ctx.textAlign = "center";
		canvasIO.ctx.fillText(this.text, canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
		canvasIO.ctx.restore();
	}
	update() {
		this.opacity -= WorldData.OVERLAY_FADE_SPEED;
	}
	isComplete() {
		return this.opacity <= 0;
	}
}
