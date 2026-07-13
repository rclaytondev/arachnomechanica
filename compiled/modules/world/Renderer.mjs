import { RENDERING_ORDER } from "../constants/RenderingOrder.mjs";
export class Renderable {
    display;
    zIndex;
    constructor(display, renderingID) {
        this.display = display;
        this.zIndex = RENDERING_ORDER.indexOf(renderingID);
    }
}
export class Renderer {
    renderables = [];
    displayAll(canvasIO) {
        for (const renderable of this.renderables.sort((a, b) => a.zIndex - b.zIndex)) {
            renderable.display(canvasIO);
        }
    }
}
//# sourceMappingURL=Renderer.mjs.map