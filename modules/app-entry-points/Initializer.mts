import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Main } from "../Main.mjs";
import { LoadingManager } from "./LoadingManager.mjs";

import "../entities/Spider.mjs";
import "../entities/Lizard.mjs";
import "../entities/LaserBlock.mjs";
import "../entities/SpikeballBlock.mjs";
import "../entities/TeleportingCreature.mjs";
import { StartScreen } from "../user-interface/StartScreen.mjs";

LoadingManager.loaded();

Main.screen = new StartScreen();

const FRAMERATE = 60;
window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	GameUtils.frameCount ++;
}, 1000 / FRAMERATE);
