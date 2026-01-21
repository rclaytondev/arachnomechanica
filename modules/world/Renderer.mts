import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { RENDERING_ORDER, RenderingID } from "../constants/RenderingOrder.mjs";

export class Renderable {
	readonly display: (canvasIO: CanvasIO) => void;
	readonly zIndex: number;

	constructor(display: (canvasIO: CanvasIO) => void, renderingID: RenderingID) {
		this.display = display;
		this.zIndex = RENDERING_ORDER.indexOf(renderingID);
	}
}

export class Renderer {
	renderables: Renderable[] = [];

	displayAll(canvasIO: CanvasIO) {
		for(const renderable of this.renderables.sort((a, b) => a.zIndex - b.zIndex)) {
			renderable.display(canvasIO);
		}
	}
}
