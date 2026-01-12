import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Room } from "../level-generator/Room.mjs";
import { Rooms } from "../level-generator/Rooms.mjs";
import { Main } from "../Main.mjs";
import { World } from "../world/World.mjs";

Debug.initializeRNGOverride();
Rooms.initialize();
Room.addRoomVariants();
Main.screen = new World(true).initializeGeneration();

const FRAMERATE = 60;
window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	GameUtils.frameCount ++;
}, 1000 / FRAMERATE);
