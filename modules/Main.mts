import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { Debug } from "./game-utilities/Debug.mjs";
import { WorldScreen } from "./world/WorldScreen.mjs";
import { StartScreen } from "./user-interface/StartScreen.mjs";
import { Renderable, Renderer } from "./world/Renderer.mjs";
import { VisualEffects } from "./game-utilities/visual-effects/VisualEffects.mjs";


export class Main {
	static screen: WorldScreen | RoomEditor | StartScreen | null = null;

	static visualEffects: VisualEffects = new VisualEffects();

	static update(canvasIO: CanvasIO) {
		Main.visualEffects.update();
		this.screen?.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
		Debug.checkRNGLogging(canvasIO);
		Debug.updateFramerate();
	}
	static display(canvasIO: CanvasIO) {
		const renderer = new Renderer();
		this.screen?.render(canvasIO, renderer);
		Main.visualEffects.render(renderer);

		renderer.renderables.push(new Renderable(
			() => Debug.displayFramerate(canvasIO),
			"debug-fps",
		));

		renderer.displayAll(canvasIO);
	}
}
