import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";

export abstract class VisualEffect {
	abstract update(): void;
	abstract display(canvasIO: CanvasIO): void;

	abstract readonly renderingOrder: "before" | "after";

	onCompletion: () => void;

	constructor(onCompletion: () => void) {
		this.onCompletion = onCompletion;
	}

	abstract isComplete(): boolean;
}
