import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";

export class GameUtils {
	static moveTowards(value: number, target: number, speed: number) {
		if(value < target) {
			return Math.min(value + speed, target);
		}
		else {
			return Math.max(value - speed, target);
		}
	}
	static lerp(value: number, min1: number, max1: number, min2: number, max2: number) {
		return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
	}
	static lerpAngle(value: number, min1: number, max1: number, min2: number, max2: number) {
		/* As `value` moves from `min1` to `max1`, the output will move from `min2` to `max2`, taking the shorter path around the circle. */
		const closest = Utils.minValue(
			[max2, max2 + 2 * Math.PI, max2 - 2 * Math.PI],
			n => MathUtils.dist(min2, n)
		);
		return GameUtils.lerp(value, min1, max1, min2, closest);
	}
	static diagonalAngle(direction1: Direction, direction2: Direction) {
		if((direction1 === "right" && direction2 === "up") || (direction1 === "up" && direction2 === "right")) {
			return Math.PI / 4;
		}
		else if((direction1 === "up" && direction2 === "left") || (direction1 === "left" && direction2 === "up")) {
			return 3 * Math.PI / 4;
		}
		else if((direction1 === "left" && direction2 === "down") || (direction1 === "down" && direction2 === "left")) {
			return 5 * Math.PI / 4;
		}
		else if((direction1 === "down" && direction2 === "right") || (direction1 === "right" && direction2 === "down")) {
			return 7 * Math.PI / 4;
		}
		else {
			return Directions.angle(direction1);
		}
	}

	static randomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	static random(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}
	static randomPermutation<T>(items: T[]) {
		items = [...items];
		const result = [];
		while(items.length > 0) {
			const index = Utils.randomIndex(items);
			result.push(items[index]);
			items.splice(index, 1);
		}
		return result;
	}

	static pastKeys: { [ key: string ]: boolean } = {};

	static randomEvenlySpaced(region: Rectangle, previousPoints: Vector[], numTrials: number, type: "int" | "float" = "float") {
		/* Implements Mitchell's Best-Candidate Algorithm. */
		const random = (type === "int") ? GameUtils.randomInt : GameUtils.random;
		const randomPoint = () => new Vector(
			random(region.left(), region.right()),
			random(region.top(), region.bottom())
		);
		if(previousPoints.length === 0) { return randomPoint(); }
		const points = new Array(numTrials).fill(0).map(randomPoint);
		return Utils.maxValue(points, point => Utils.minOutput(previousPoints, p => Vector.dist(point, p)));
	}
	
	static hexColor(red: number, green: number, blue: number, alpha: number) {
		return "#" + red.toString(16).padStart(2, "0") + green.toString(16).padStart(2, "0") + blue.toString(16).padStart(2, "0") + alpha.toString(16).padStart(2, "0");
	}
	static glowCircle(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		const gradient = canvasIO.ctx.createRadialGradient(x, y, 0, x, y, size);
		for(let i = 0; i < 1; i += 1 / size) {
			const color = GameUtils.hexColor(255, 255, 255, Math.floor(intensity * 255 * (1 - i) ** 2));
			gradient.addColorStop(i, color);
		}

		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.fillCircle(x, y, size * 2);
		canvasIO.ctx.restore();
	}
}
