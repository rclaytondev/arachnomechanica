import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Backgrounds } from "../backgrounds/Backgrounds.mjs";
import { GearsBackground } from "../backgrounds/GearsBackground.mjs";
import { SkyBackground } from "../backgrounds/SkyBackground.mjs";
import { PlayerData } from "../constants/GameData.mjs";
import { FadeType, ScreenFade } from "../game-utilities/visual-effects/ScreenFade.mjs";
import { VisualEffects } from "../game-utilities/visual-effects/VisualEffects.mjs";
import { DeathScreen } from "../user-interface/DeathScreen.mjs";
import { Camera } from "./Camera.mjs";
import { World } from "./World.mjs";

export class WorldScreen {
	world: World;
	backgrounds: Backgrounds = new Backgrounds([
		GearsBackground.generate(),
		new SkyBackground(),
	]);
	visualEffects: VisualEffects = new VisualEffects();
	camera: Camera = new Camera();
	deathScreen: DeathScreen | null = null;

	constructor(world: World) {
		this.world = world;
		this.world.worldScreen = this;
	}

	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO);
		this.camera.update(this.world.player.hitbox.center());
		this.visualEffects.update();
		this.deathScreen?.update(canvasIO, this);
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		this.backgrounds.display(canvasIO, this.camera);
		this.visualEffects.display(canvasIO, "before");
		this.world.display(canvasIO, this.camera);
		this.visualEffects.display(canvasIO, "after");
		canvasIO.ctx.restore();
		this.deathScreen?.display(canvasIO, this);
	}

	beginDeathTransition() {
		const delay = new ScreenFade(PlayerData.DEATH_RESET_DELAY, 0, 0, "black", "transition-start-delay");
		const fadeOut = new ScreenFade(PlayerData.FADE_DURATION, 0, 1, "black", "transition-fade-out");
		const pause = new ScreenFade(PlayerData.FADE_DELAY, 1, 1, "black", "transition-pause");
		const fadeIn = new ScreenFade(PlayerData.FADE_DURATION, 1, 0, "black", "transition-fade-in");
		this.visualEffects.add(ScreenFade.sequence([delay, fadeOut, pause, fadeIn], this));
	}
	isTransitioning() {
		const types: FadeType[] = ["transition-start-delay", "transition-fade-out", "transition-pause", "transition-fade-in"];
		return this.visualEffects.allEffects().some(e => (e instanceof ScreenFade && types.includes(e.type)));
	}
}
