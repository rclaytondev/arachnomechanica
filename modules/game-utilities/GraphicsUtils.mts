import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GeomUtils } from "./GeomUtils.mjs";
import { RGB } from "./RGB.mjs";

export class GraphicsUtils {
	static hexColor(color: RGB, alpha: number) {
		return `#${[color.red, color.green, color.blue, alpha].map(n => Math.floor(n).toString(16).padStart(2, "0")).join("")}`;
	}
	static glowCircle(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, color: RGB = new RGB(255, 255, 255)) {
		GraphicsUtils.glowArc(x, y, 0, size, intensity, canvasIO, 0, 2 * Math.PI, color);
	}
	static glowCircleOutline(x: number, y: number, size: number, thickness: number, intensity: number, canvasIO: CanvasIO, color: RGB = new RGB(255, 255, 255)) {
		GraphicsUtils.glowArc(x, y, size, size + thickness, intensity, canvasIO, 0, 2 * Math.PI, color);
		GraphicsUtils.glowArc(x, y, size, size - thickness, intensity, canvasIO, 0, 2 * Math.PI, color);
	}
	static glowArc(x: number, y: number, size1: number, size2: number, intensity: number, canvasIO: CanvasIO, startAngle: number, endAngle: number, color: RGB = new RGB(255, 255, 255)) {
		const gradient = GraphicsUtils.glowCircleGradient(size1, size2, intensity, color);
		canvasIO.ctx.save();
		canvasIO.ctx.translate(x, y);
		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.globalCompositeOperation = "lighter";
		if(size1 !== 0 && size1 < size2) {
			canvasIO.ctx.beginPath();
			canvasIO.circle(0, 0, size2);
			canvasIO.circle(0, 0, size1);
			canvasIO.ctx.clip("evenodd");
		}
		canvasIO.fillArc(0, 0, Math.max(size1, size2), startAngle, endAngle);
		canvasIO.ctx.restore();
	}
	static glowLine(x1: number, y1: number, x2: number, y2: number, size: number, intensity: number, canvasIO: CanvasIO, color: RGB = new RGB(255, 255, 255)) {
		const offset = new Vector(x2 - x1, y2 - y1);
		const length = offset.magnitude();
		canvasIO.ctx.save();
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.ctx.translate(x1, y1);
		canvasIO.ctx.rotate(offset.angle());
		canvasIO.ctx.fillStyle = GraphicsUtils.glowLineGradient(size, intensity, color);
		canvasIO.ctx.fillRect(0, -size, length, size);
		canvasIO.ctx.restore();
	}
	static glowOutline(x1: number, y1: number, x2: number, y2: number, size: number, intensity: number, canvasIO: CanvasIO, color: RGB = new RGB(255, 255, 255)) {
		GraphicsUtils.glowLine(x1, y1, x2, y2, size, intensity, canvasIO, color);
		GraphicsUtils.glowLine(x2, y2, x1, y1, size, intensity, canvasIO, color);

		const length = Math.hypot(x1 - x2, y1 - y2);
		canvasIO.ctx.save();
		canvasIO.ctx.translate(x1, y1);
		canvasIO.ctx.rotate(new Vector(x2 - x1, y2 - y1).angle());
		GraphicsUtils.glowArc(0, 0, 0, size, intensity, canvasIO, Math.PI / 2, 3 * Math.PI / 2, color);
		GraphicsUtils.glowArc(length, 0, 0, size, intensity, canvasIO, -Math.PI / 2, Math.PI / 2, color);
		canvasIO.ctx.restore();
	}
	static glowCircleGradients = new Map<string, CanvasGradient>();
	static glowLineGradients = new Map<string, CanvasGradient>();
	static glowCircleGradient(size1: number, size2: number, intensity: number, color: RGB = new RGB(255, 255, 255)) {
		const argsString = `${size1}, ${size2} ${intensity}, ${color}`;
		const cachedResult = GraphicsUtils.glowCircleGradients.get(argsString);
		if(cachedResult) { return cachedResult; }
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const gradient = ctx.createRadialGradient(0, 0, size1, 0, 0, size2);
		for(let i = 0; i < 1; i += 1 / Math.abs(size2 - size1)) {
			const opacity = Math.floor(intensity * 255 * (1 - i) ** 2);
			const colorStr = GraphicsUtils.hexColor(color, opacity);
			gradient.addColorStop(i, colorStr);
		}
		GraphicsUtils.glowCircleGradients.set(argsString, gradient);
		return gradient;
	}
	static glowLineGradient(length: number, intensity: number, color: RGB = new RGB(255, 255, 255)) {
		length = Math.floor(length);
		const argsString = `${length}, ${intensity}, ${color}`;
		const cachedResult = GraphicsUtils.glowLineGradients.get(argsString);
		if(cachedResult) { return cachedResult; }
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const gradient = ctx.createLinearGradient(0, 0, 0, -length);
		for(let i = 0; i < 1; i += 1 / length) {
			const colorStr = GraphicsUtils.hexColor(color, Math.floor(intensity * 255 * (1 - i) ** 2));
			gradient.addColorStop(i, colorStr);
		}
		GraphicsUtils.glowLineGradients.set(argsString, gradient);
		return gradient;
	}
	static lerpColor(value: number, min: number, max: number, color1: RGB, color2: RGB) {
		if(value < min) {
			return color1;
		}
		if(value > max) {
			return color2;
		}
		return new RGB(
			GeomUtils.lerp(value, min, max, color1.red, color2.red),
			GeomUtils.lerp(value, min, max, color1.green, color2.green),
			GeomUtils.lerp(value, min, max, color1.blue, color2.blue),
		);
	}

	static loadImage(filePath: string, width: number, height: number) {
		const element = document.createElement("img");
		element.src = filePath;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d")!;
		element.onload = () => {
			ctx.drawImage(element, 0, 0, width, height);
		};
		return canvas;
	}
}
