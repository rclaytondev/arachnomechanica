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
	static weightedRandom<T>(items: T[], weights: number[]) {
		const sum = MathUtils.sum(weights);
		const randomValue = GameUtils.random(0, sum);
		let partialSum = 0;
		for(let i = 0; i < items.length; i ++) {
			partialSum += weights[i];
			if(partialSum >= randomValue) {
				return items[i];
			}
		}
		throw new Error("Unexpected: unreachable code reached in weightedRandom.");
	}

	static pastKeys: { [ key: string ]: boolean } = {};

	static randomEvenlySpaced(region: Rectangle, previousPoints: Vector[], numTrials: number, type: "int" | "float" = "float", randomGenerator?: () => Vector) {
		/* Implements Mitchell's Best-Candidate Algorithm. */
		const random = (type === "int") ? GameUtils.randomInt : GameUtils.random;
		const randomPoint = randomGenerator ?? (() => new Vector(
			random(region.left(), region.right()),
			random(region.top(), region.bottom())
		));
		if(previousPoints.length === 0) { return randomPoint(); }
		const points = new Array(numTrials).fill(0).map(randomPoint);
		return Utils.maxValue(points, point => Utils.minOutput(previousPoints, p => Vector.dist(point, p)));
	}
	
	static hexColor(red: number, green: number, blue: number, alpha: number) {
		return "#" + red.toString(16).padStart(2, "0") + green.toString(16).padStart(2, "0") + blue.toString(16).padStart(2, "0") + alpha.toString(16).padStart(2, "0");
	}
	static glowCircle(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, red: number = 255, green: number = 255, blue: number = 255) {
		const gradient = GameUtils.glowCircleGradient(x, y, size, intensity, canvasIO, red, green, blue);
		canvasIO.ctx.save();
		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.fillCircle(x, y, size * 2);
		canvasIO.ctx.restore();
	}
	static glowCircleGradient(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, red: number = 255, green: number = 255, blue: number = 255) {
		const gradient = canvasIO.ctx.createRadialGradient(x, y, 0, x, y, size);
		for(let i = 0; i < 1; i += 1 / size) {
			const color = GameUtils.hexColor(red, green, blue, Math.floor(intensity * 255 * (1 - i) ** 2));
			gradient.addColorStop(i, color);
		}
		return gradient;
	}
	static glowLineGradient(x1: number, y1: number, x2: number, y2: number, intensity: number, red: number = 255, green: number = 255, blue: number = 255) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
		for(let i = 0; i < 1; i += 1 / Math.floor(Vector.dist(new Vector(x1, y1), new Vector(x2, y2)))) {
			const color = GameUtils.hexColor(red, green, blue, Math.floor(intensity * 255 * (1 - i) ** 2));
			gradient.addColorStop(i, color);
		}
		return gradient;
	}

	static rayIntersectsVertical(rayStart: Vector, rayDirection: Vector, verticalLineX: number) {
		if((rayDirection.x < 0 && rayStart.x < verticalLineX) || (rayDirection.x > 0 && rayStart.x > verticalLineX)) {
			return Infinity;
		}
		return (verticalLineX - rayStart.x) / rayDirection.x;
	}
	static rayIntersectsHorizontal(rayStart: Vector, rayDirection: Vector, horizontalLineY: number) {
		if((rayDirection.y < 0 && rayStart.y < horizontalLineY) || (rayDirection.y > 0 && rayStart.y > horizontalLineY)) {
			return Infinity;
		}
		return (horizontalLineY - rayStart.y) / rayDirection.y;
	}
	static rayIntersectsHSegment(rayStart: Vector, rayDirection: Vector, horizontalLineY: number, xStart: number, xEnd: number) {
		const distance = GameUtils.rayIntersectsHorizontal(rayStart, rayDirection, horizontalLineY);
		const intersectionX = rayStart.x + distance * rayDirection.x;
		return (xStart <= intersectionX && intersectionX <= xEnd) ? distance : Infinity;
	}
	static rayIntersectsVSegment(rayStart: Vector, rayDirection: Vector, verticalLineX: number, yStart: number, yEnd: number) {
		const distance = GameUtils.rayIntersectsVertical(rayStart, rayDirection, verticalLineX);
		const intersectionY = rayStart.y + distance * rayDirection.y;
		return (yStart <= intersectionY && intersectionY <= yEnd) ? distance : Infinity;
	}
	static rayIntersectsRectangle(rayStart: Vector, rayDirection: Vector, rectangle: Rectangle) {
		return Math.min(
			GameUtils.rayIntersectsHSegment(rayStart, rayDirection, rectangle.top(), rectangle.left(), rectangle.right()),
			GameUtils.rayIntersectsHSegment(rayStart, rayDirection, rectangle.bottom(), rectangle.left(), rectangle.right()),
			GameUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.left(), rectangle.top(), rectangle.bottom()),
			GameUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.right(), rectangle.top(), rectangle.bottom())
		);
	}
}
