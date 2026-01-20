import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";

export abstract class Background {
	abstract zIndex: number;

	abstract display(canvasIO: CanvasIO, cameraPosition: Vector): void;
}
