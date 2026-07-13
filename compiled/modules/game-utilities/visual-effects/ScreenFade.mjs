import { MathUtils } from "../../../utils-ts/modules/math/MathUtils.mjs";
import { Renderable } from "../../world/Renderer.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { VisualEffect } from "./VisualEffect.mjs";
export class ScreenFade extends VisualEffect {
    startOpacity;
    endOpacity;
    color;
    timeElapsed = 0;
    duration;
    type;
    onCompletion;
    constructor(duration, startOpacity, endOpacity, color, type, onCompletion = () => { }) {
        super();
        this.duration = duration;
        this.startOpacity = startOpacity;
        this.endOpacity = endOpacity;
        this.color = color;
        this.type = type;
        this.onCompletion = onCompletion;
    }
    update(visualEffects) {
        this.timeElapsed++;
        if (this.isComplete()) {
            visualEffects.effectsList.delete(this);
            this.onCompletion();
        }
    }
    opacity() {
        const opacity = GameUtils.lerp(this.timeElapsed, 0, this.duration, this.startOpacity, this.endOpacity);
        return MathUtils.constrain(opacity, 0, 1);
    }
    render() {
        return [
            new Renderable(c => this.display(c), "screen-fade"),
        ];
    }
    display(canvasIO) {
        canvasIO.ctx.save();
        canvasIO.ctx.globalAlpha = this.opacity();
        canvasIO.fillCanvas(this.color);
        canvasIO.ctx.restore();
    }
    isComplete() {
        return this.timeElapsed >= this.duration;
    }
    static sequence(fades, visualEffects) {
        for (let i = 0; i < fades.length - 1; i++) {
            const fade = fades[i];
            const next = fades[i + 1];
            const oldOnCompletion = fade.onCompletion;
            fade.onCompletion = () => {
                oldOnCompletion();
                visualEffects.effectsList.add(next);
            };
        }
        return fades[0];
    }
}
//# sourceMappingURL=ScreenFade.mjs.map