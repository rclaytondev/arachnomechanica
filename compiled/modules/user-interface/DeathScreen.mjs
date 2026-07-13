import { DeathScreenData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { StaticEntity } from "../game-utilities/StaticEntity.mjs";
import { Renderable } from "../world/Renderer.mjs";
export class DeathScreen extends StaticEntity {
    timeOnScreen = 0;
    render(world) {
        return [
            new Renderable(c => {
                if (world.worldScreen) {
                    this.display(c, world.worldScreen);
                }
            }, "overlay-text"),
        ];
    }
    display(canvasIO, worldScreen) {
        const deathText = "You Are Dead";
        const infoText = `Highest floor reached: ${worldScreen.world.worldGenerator?.towerGenerator.levelsVisited}`;
        const instructionText = "Press any key to continue";
        const width1 = canvasIO.measureText(deathText, DeathScreenData.DEATH_TEXT_FONT).width;
        const width2 = canvasIO.measureText(infoText, DeathScreenData.DEATH_INFO_FONT).width;
        const width3 = canvasIO.measureText(instructionText, DeathScreenData.DEATH_INFO_FONT).width;
        const width = Math.max(width1, width2, width3) + DeathScreenData.OVERLAY_RECT_MARGIN_X;
        canvasIO.ctx.globalAlpha = DeathScreenData.OVERLAY_RECT_OPACITY;
        canvasIO.ctx.fillStyle = DeathScreenData.OVERLAY_RECT_COLOR;
        canvasIO.ctx.fillRect(canvasIO.canvas.width / 2 - width / 2, canvasIO.canvas.height / 2 + DeathScreenData.OVERLAY_RECT_TOP_OFFSET, width, DeathScreenData.OVERLAY_RECT_BOTTOM_OFFSET - DeathScreenData.OVERLAY_RECT_TOP_OFFSET);
        canvasIO.ctx.globalAlpha = 1;
        canvasIO.ctx.fillStyle = DeathScreenData.DEATH_TEXT_COLOR;
        canvasIO.ctx.font = DeathScreenData.DEATH_TEXT_FONT;
        canvasIO.ctx.textAlign = "center";
        canvasIO.ctx.fillText(deathText, canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
        canvasIO.ctx.font = DeathScreenData.DEATH_INFO_FONT;
        canvasIO.ctx.textAlign = "center";
        canvasIO.ctx.fillText(infoText, canvasIO.canvas.width / 2, canvasIO.canvas.height / 2 + DeathScreenData.DEATH_INFO_Y_OFFSET);
        canvasIO.ctx.fillText(instructionText, canvasIO.canvas.width / 2, canvasIO.canvas.height / 2 + DeathScreenData.DEATH_INSTRUCTION_TEXT_Y_OFFSET);
    }
    update(world, canvasIO) {
        this.timeOnScreen++;
        if (this.timeOnScreen > DeathScreenData.TIME_BEFORE_CONTINUE
            && GameUtils.startedPressingKey(canvasIO)
            && world.worldScreen && !world.worldScreen.isTransitioning()) {
            world.worldScreen.beginDeathTransition();
        }
    }
    static show(world) {
        if (!world.staticEntities.entitiesList.some(e => e instanceof DeathScreen)) {
            world.staticEntities.add(new DeathScreen());
        }
    }
    static hide(world) {
        world.staticEntities.entitiesList = world.staticEntities.entitiesList.filter(e => !(e instanceof DeathScreen));
    }
}
//# sourceMappingURL=DeathScreen.mjs.map