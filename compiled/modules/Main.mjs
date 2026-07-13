import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Debug } from "./game-utilities/Debug.mjs";
import { Renderable, Renderer } from "./world/Renderer.mjs";
import { VisualEffects } from "./game-utilities/visual-effects/VisualEffects.mjs";
export class Main {
    static screen = null;
    static visualEffects = new VisualEffects();
    static update(canvasIO) {
        Main.visualEffects.update();
        this.screen?.update(canvasIO);
        Object.assign(GameUtils.pastKeys, canvasIO.keys);
        Debug.checkRNGLogging(canvasIO);
        Debug.updateFramerate();
    }
    static display(canvasIO) {
        const renderer = new Renderer();
        this.screen?.render(canvasIO, renderer);
        Main.visualEffects.render(renderer);
        renderer.renderables.push(new Renderable(() => Debug.displayFramerate(canvasIO), "debug-fps"));
        renderer.displayAll(canvasIO);
    }
}
//# sourceMappingURL=Main.mjs.map