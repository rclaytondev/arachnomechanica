import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { BackgroundData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Background } from "./Background.mjs";
export class SkyBackground extends Background {
    zIndex = 0;
    stars = [];
    display(canvasIO) {
        const gradient = canvasIO.ctx.createLinearGradient(0, 0, 0, canvasIO.canvas.height);
        for (const { color, y } of BackgroundData.SKY_BACKGROUND_COLORS) {
            gradient.addColorStop(y, color);
        }
        canvasIO.ctx.fillStyle = gradient;
        canvasIO.ctx.fillRect(0, 0, canvasIO.canvas.width, canvasIO.canvas.height);
        if (this.stars.length === 0) {
            this.initialize(canvasIO);
        }
        for (const star of this.stars) {
            canvasIO.ctx.fillStyle = "white";
            canvasIO.fillCircle(star.x, star.y, BackgroundData.STAR_SIZE);
        }
    }
    initialize(canvasIO) {
        const amount = canvasIO.canvas.width * canvasIO.canvas.height * BackgroundData.STAR_DENSITY;
        this.stars = GameUtils.randomEvenlySpaced({
            generate: () => new Vector(GameUtils.random(0, canvasIO.canvas.width), GameUtils.random(0, 1) ** 5 * canvasIO.canvas.height),
            amount: amount,
            trials: BackgroundData.STAR_EVENNESS,
            previousPoints: this.stars,
            metric: Vector.dist,
        });
    }
}
//# sourceMappingURL=SkyBackground.mjs.map