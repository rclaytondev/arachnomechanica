import { PlayerData, StartScreenData, WorldUIData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { OverlayText } from "../game-utilities/visual-effects/OverlayText.mjs";
import { ScreenFade } from "../game-utilities/visual-effects/ScreenFade.mjs";
import { Main } from "../Main.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
export class StartScreen {
    timeInScreen = 0;
    display(canvasIO) {
        canvasIO.fillCanvas(StartScreenData.BACKGROUND_COLOR);
        canvasIO.ctx.font = StartScreenData.TITLE_FONT;
        canvasIO.ctx.fillStyle = StartScreenData.TITLE_COLOR;
        canvasIO.ctx.textAlign = "center";
        canvasIO.ctx.fillText(StartScreenData.TITLE_TEXT, canvasIO.canvas.width / 2, canvasIO.canvas.height / 4);
        canvasIO.ctx.font = StartScreenData.INSTRUCTIONS_FONT;
        canvasIO.ctx.fillStyle = StartScreenData.INSTRUCTIONS_COLOR;
        canvasIO.ctx.textAlign = "center";
        canvasIO.ctx.fillText(StartScreenData.INSTRUCTIONS_TEXT, canvasIO.canvas.width / 2, canvasIO.canvas.height * 3 / 4);
    }
    render(canvasIO, renderer) {
        renderer.renderables.push(new Renderable(() => this.display(canvasIO), "start-screen-ui"));
    }
    update(canvasIO) {
        this.timeInScreen++;
        const transitioning = false; // TODO
        if (this.timeInScreen > StartScreenData.TIME_BEFORE_CONTINUE
            && GameUtils.startedPressingKey(canvasIO)
            && !transitioning) {
            this.beginTransition();
        }
    }
    beginTransition() {
        const fadeOut = new ScreenFade(PlayerData.FADE_DURATION, 0, 1, "black", "transition-fade-out");
        const pause = new ScreenFade(PlayerData.FADE_DELAY, 1, 1, "black", "transition-pause", () => {
            const worldScreen = new WorldScreen(new World(true));
            worldScreen.resetWorld();
            Main.screen = worldScreen;
            worldScreen.visualEffects.effectsList.add(new OverlayText(WorldUIData.CONTROLS_TEXT.TEXT, {
                offset: WorldUIData.CONTROLS_TEXT.OFFSET,
                font: WorldUIData.CONTROLS_TEXT.FONT,
                fadeSpeed: WorldUIData.CONTROLS_TEXT.FADE_SPEED,
                initialOpacity: WorldUIData.CONTROLS_TEXT.OPACITY,
            }));
        });
        const fadeIn = new ScreenFade(PlayerData.FADE_DURATION, 1, 0, "black", "transition-fade-in");
        Main.visualEffects.effectsList.add(ScreenFade.sequence([fadeOut, pause, fadeIn], Main.visualEffects));
    }
}
//# sourceMappingURL=StartScreen.mjs.map