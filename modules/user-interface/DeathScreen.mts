import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { DeathScreenData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

export class DeathScreen {
	display(canvasIO: CanvasIO, worldScreen: WorldScreen) {
		const deathText = "You Are Dead";
		const infoText = `Highest floor reached: ${worldScreen.world.worldGenerator?.levelsVisited}`;
		const instructionText = "Press any key to continue";

		const width1 = canvasIO.measureText(deathText, DeathScreenData.DEATH_TEXT_FONT).width;
		const width2 = canvasIO.measureText(infoText, DeathScreenData.DEATH_INFO_FONT).width;
		const width3 = canvasIO.measureText(instructionText, DeathScreenData.DEATH_INFO_FONT).width;
		const width = Math.max(width1, width2, width3) + DeathScreenData.OVERLAY_RECT_MARGIN_X;
		canvasIO.ctx.globalAlpha = DeathScreenData.OVERLAY_RECT_OPACITY;
		canvasIO.ctx.fillStyle = DeathScreenData.OVERLAY_RECT_COLOR;
		canvasIO.ctx.fillRect(
			canvasIO.canvas.width / 2 - width / 2,
			canvasIO.canvas.height / 2 + DeathScreenData.OVERLAY_RECT_TOP_OFFSET,
			width,
			DeathScreenData.OVERLAY_RECT_BOTTOM_OFFSET - DeathScreenData.OVERLAY_RECT_TOP_OFFSET,
		);
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

	update(canvasIO: CanvasIO, worldScreen: WorldScreen) {
		if(GameUtils.startedPressingKey(canvasIO) && !worldScreen.isTransitioning()) {
			worldScreen.beginDeathTransition();
		}
	}
}
