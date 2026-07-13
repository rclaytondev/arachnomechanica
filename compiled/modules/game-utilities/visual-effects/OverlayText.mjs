import { MathUtils } from "../../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../../constants/GameData.mjs";
import { Renderable } from "../../world/Renderer.mjs";
import { VisualEffect } from "./VisualEffect.mjs";
export class OverlayText extends VisualEffect {
    text;
    opacity;
    constructor(text) {
        super();
        this.text = text;
        this.opacity = 1;
    }
    render() {
        return [
            new Renderable(c => this.display(c), "overlay-text"),
        ];
    }
    display(canvasIO) {
        canvasIO.ctx.save();
        canvasIO.ctx.font = WorldData.OVERLAY_FONT;
        canvasIO.ctx.fillStyle = WorldData.OVERLAY_COLOR;
        canvasIO.ctx.globalAlpha = MathUtils.constrain(this.opacity, 0, 1);
        canvasIO.ctx.textAlign = "center";
        canvasIO.ctx.fillText(this.text, canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
        canvasIO.ctx.restore();
    }
    update(visualEffects) {
        this.opacity -= WorldData.OVERLAY_FADE_SPEED;
        if (this.opacity <= 0) {
            visualEffects.effectsList.delete(this);
        }
    }
}
//# sourceMappingURL=OverlayText.mjs.map