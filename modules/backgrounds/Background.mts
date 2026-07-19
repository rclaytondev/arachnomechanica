import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Camera } from "../world/Camera.mjs";

export abstract class Background {
	abstract zIndex: number;

	abstract display(canvasIO: CanvasIO, camera: Camera): void;
	abstract update(): void;
}
