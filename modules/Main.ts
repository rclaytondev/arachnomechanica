import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";

const FRAMERATE = 60;
window.setInterval(() => {
	canvasIO!.ctx.fillStyle = "green";
	canvasIO!.fillCircle(100, 100, 100);
}, 1000 / FRAMERATE);
