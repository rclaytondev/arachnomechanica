import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Backgrounds } from "../backgrounds/Backgrounds.mjs";
import { GearsBackground } from "../backgrounds/GearsBackground.mjs";
import { SkyBackground } from "../backgrounds/SkyBackground.mjs";
import { PlayerData } from "../constants/GameData.mjs";
import { ScreenFade } from "../game-utilities/visual-effects/ScreenFade.mjs";
import { VisualEffects } from "../game-utilities/visual-effects/VisualEffects.mjs";
import { World } from "./World.mjs";

export class WorldScreen {
	world: World;
	backgrounds: Backgrounds = new Backgrounds([
		GearsBackground.generate(),
		new SkyBackground(),
	]);
	visualEffects: VisualEffects = new VisualEffects();

	constructor(world: World) {
		this.world = world;
		this.world.worldScreen = this;
	}

	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);
		for(const effect of this.visualEffects) {
			effect.update();
			if(effect.isComplete()) {
				effect.onCompletion();
				this.visualEffects = this.visualEffects.filter(e => e !== effect);
			}
		}
	}

	display(canvasIO: CanvasIO) {
		this.backgrounds.display(canvasIO, this.world.camera);
		this.world.display(canvasIO);
		for(const effect of this.visualEffects) {
			effect.display(canvasIO);
		}
	}

	beginDeathTransition() {
		const delay = new ScreenFade(PlayerData.DEATH_RESET_DELAY, 0, 0, "black", "transition-start-delay");
		const fadeOut = new ScreenFade(PlayerData.FADE_DURATION, 0, 1, "black", "transition-fade-out");
		const pause = new ScreenFade(PlayerData.FADE_DELAY, 1, 1, "black", "transition-pause");
		const fadeIn = new ScreenFade(PlayerData.FADE_DURATION, 1, 0, "black", "transition-fade-in");
		this.visualEffects.push(ScreenFade.sequence([delay, fadeOut, pause, fadeIn], this));
	}
}
