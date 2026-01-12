import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { ScreenFade } from "./game-utilities/ScreenFade.mjs";
import { PlayerData } from "./constants/GameData.mjs";
import { Debug } from "./game-utilities/Debug.mjs";
import { WorldScreen } from "./world/WorldScreen.mjs";


export class Main {
	static screen: WorldScreen | RoomEditor | null = null;

	static screenFades: ScreenFade[] = [];

	static update(canvasIO: CanvasIO) {
		this.screen?.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
		Debug.checkRNGLogging(canvasIO);
		Main.updateScreenFades();
		Debug.updateFramerate();
	}
	static updateScreenFades() {
		for(const screenFade of Main.screenFades) {
			screenFade.update();
		}
	}
	static display(canvasIO: CanvasIO) {
		this.screen?.display(canvasIO);
		Main.displayScreenFades(canvasIO);
		Debug.displayFramerate(canvasIO);
	}
	static displayScreenFades(canvasIO: CanvasIO) {
		for(const screenFade of this.screenFades) {
			screenFade.display(canvasIO);
		}
	}

	static beginDeathTransition() {
		const delay = new ScreenFade(PlayerData.DEATH_RESET_DELAY, 0, 0, "black", "transition-start-delay");
		const fadeOut = new ScreenFade(PlayerData.FADE_DURATION, 0, 1, "black", "transition-fade-out");
		const pause = new ScreenFade(PlayerData.FADE_DELAY, 1, 1, "black", "transition-pause");
		const fadeIn = new ScreenFade(PlayerData.FADE_DURATION, 1, 0, "black", "transition-fade-in");
		Main.screenFades.push(ScreenFade.sequence(delay, fadeOut, pause, fadeIn));
	}
}
