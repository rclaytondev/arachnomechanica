import { Renderable } from "../../world/Renderer.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { VisualEffect } from "./VisualEffect.mjs";
export class ShakeEffect extends VisualEffect {
    timeLeft = 0;
    intensity = 0;
    constructor(time, intensity) {
        super();
        this.timeLeft = time;
        this.intensity = intensity;
    }
    update(visualEffects) {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
            visualEffects.effectsList.delete(this);
        }
    }
    render() {
        return [
            new Renderable(c => this.display(c), "shake"),
            new Renderable(c => c.ctx.restore(), "reset-shake"),
        ];
    }
    display(canvasIO) {
        const amountX = GameUtils.random(-this.intensity, this.intensity);
        const amountY = GameUtils.random(-this.intensity, this.intensity);
        canvasIO.ctx.translate(amountX, amountY);
    }
}
//# sourceMappingURL=ShakeEffect.mjs.map