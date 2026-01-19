import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Main } from "../Main.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { LoadingManager } from "./LoadingManager.mjs";

LoadingManager.loaded();
Main.screen = new WorldScreen(new World(true).initializeGeneration());

const FRAMERATE = 60;
window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	GameUtils.frameCount ++;
}, 1000 / FRAMERATE);
