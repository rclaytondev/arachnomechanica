import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Main } from "../Main.mjs";
import { LoadingManager } from "./LoadingManager.mjs";

import "../entities/enemies/Spider.mjs";
import "../entities/enemies/Lizard.mjs";
import "../entities/hazards/LaserBlock.mjs";
import "../entities/hazards/SpikeballBlock.mjs";
import "../entities/enemies/TeleportingCreature.mjs";
import { StartScreen } from "../user-interface/StartScreen.mjs";
import { canvasIO } from "./CanvasIOInitializer.mjs";

LoadingManager.loaded();

Main.screen = new StartScreen();

canvasIO.attach();
canvasIO.addEventListeners();

const FRAMERATE = 60;
window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	GameUtils.frameCount ++;
}, 1000 / FRAMERATE);
