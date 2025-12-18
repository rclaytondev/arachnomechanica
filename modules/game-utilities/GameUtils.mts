import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { HashSet } from "../../utils-ts/modules/HashSet.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { World } from "../world/World";
import { Particle, ParticleSettings } from "./Particle.mjs";

type RandomEvenlySpacedOptions<T> = {
	generate: () => T,
	metric: (v1: T, v2: T) => number,
	amount: number,
	trials: number,
	previousPoints?: T[]
};

type Color = { red: number, green: number, blue: number };

export class GameUtils {
	static frameCount = 0;

	static moveTowards(value: number, target: number, speed: number) {
		if(value < target) {
			return Math.min(value + speed, target);
		}
		else {
			return Math.max(value - speed, target);
		}
	}
	static moveVectorTowards(value: Vector, target: Vector, speed: number) {
		const distance = Vector.dist(value, target);
		if(distance <= speed) {
			return target;
		}
		const direction = target.subtract(value).normalize();
		return value.add(direction.multiply(speed));
	}
	static lerp(value: number, min1: number, max1: number, min2: number, max2: number) {
		return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
	}
	static lerpAngle(value: number, min1: number, max1: number, min2: number, max2: number) {
		/* As `value` moves from `min1` to `max1`, the output will move from `min2` to `max2`, taking the shorter path around the circle. */
		const closest = Utils.minValue(
			[max2, max2 + 2 * Math.PI, max2 - 2 * Math.PI],
			n => MathUtils.dist(min2, n),
		);
		return GameUtils.lerp(value, min1, max1, min2, closest);
	}
	static moveAngleTowards(angle: number, target: number, speed: number) {
		angle = MathUtils.generalizedModulo(angle, 2 * Math.PI);
		target = MathUtils.generalizedModulo(target, 2 * Math.PI);
		const closest = Utils.minValue(
			[target, target + 2 * Math.PI, target - 2 * Math.PI],
			n => MathUtils.dist(angle, n),
		);
		return GameUtils.moveTowards(angle, closest, speed);
	}
	static angleDistance(angle1: number, angle2: number) {
		return Math.abs(GameUtils.signedAngleDistance(angle1, angle2));
	}
	static signedAngleDistance(angle1: number, angle2: number) {
		return GameUtils.signedModularDistance(angle1, angle2, 2 * Math.PI);
	}
	static signedModularDistance(num1: number, num2: number, modulo: number) {
		num1 = MathUtils.generalizedModulo(num1, modulo);
		num2 = MathUtils.generalizedModulo(num2, modulo);
		return Utils.minValue([
			num2 - num1,
			num2 + modulo - num1,
			num2 - modulo - num1,
		], Math.abs);
	}
	static toroidalDistance(point1: Vector, point2: Vector, width: number, height: number = width) {
		return Math.sqrt(
			GameUtils.signedModularDistance(point1.x, point2.x, width) ** 2
			+ GameUtils.signedModularDistance(point1.y, point2.y, height) ** 2,
		);
	}
	static taxicabDistance(point1: Vector, point2: Vector) {
		return MathUtils.dist(point1.x, point2.x) + MathUtils.dist(point1.y, point2.y);
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
			return Directions.angle[direction1];
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
		if(weights.every(w => w === 0)) {
			return Utils.randomItem(items);
		}

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
	static randomInCircle(centerX: number, centerY: number, radius: number) {
		const angle = GameUtils.random(0, 360);
		const distance = Math.sqrt(Math.random()) * radius;
		return new Vector(centerX, centerY).add(new Vector(0, distance).rotate(angle));
	}
	static randomInRect(rectangle: Rectangle, random: (min: number, max: number) => number = GameUtils.random) {
		return new Vector(
			random(rectangle.left(), rectangle.right()),
			random(rectangle.top(), rectangle.bottom()),
		);
	}

	static pastKeys: { [ key: string ]: boolean } = {};

	static randomEvenlySpaced<T>(options: RandomEvenlySpacedOptions<T>) {
		const result: T[] = [];
		while(result.length < options.amount) {
			const candidates = new Array(options.trials).fill(0).map(options.generate);
			const previous = [...result, ...(options.previousPoints ?? [])];
			if(previous.length === 0) {
				result.push(candidates[0]);
			}
			else {
				result.push(Utils.maxValue(
					candidates,
					point => Utils.minOutput(previous, p => options.metric(point, p))),
				);
			}
		}
		return result;
	}

	static hexColor(red: number, green: number, blue: number, alpha: number) {
		return `#${[red, green, blue, alpha].map(n => Math.floor(n).toString(16).padStart(2, "0")).join("")}`;
	}
	static glowCircle(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, red: number = 255, green: number = 255, blue: number = 255) {
		GameUtils.glowArc(x, y, size, intensity, canvasIO, 0, 2 * Math.PI, red, green, blue);
	}
	static glowArc(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, startAngle: number, endAngle: number, red: number = 255, green: number = 255, blue: number = 255) {
		const gradient = GameUtils.glowCircleGradient(size, intensity, red, green, blue);
		canvasIO.ctx.save();
		canvasIO.ctx.translate(x, y);
		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.fillArc(0, 0, size, startAngle, endAngle);
		canvasIO.ctx.restore();
	}
	static glowLine(x1: number, y1: number, x2: number, y2: number, size: number, intensity: number, canvasIO: CanvasIO, red: number = 255, green: number = 255, blue: number = 255) {
		const offset = new Vector(x2 - x1, y2 - y1);
		const length = offset.magnitude();
		canvasIO.ctx.save();
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.ctx.translate(x1, y1);
		canvasIO.ctx.rotate(offset.angle());
		canvasIO.ctx.fillStyle = GameUtils.glowLineGradient(size, intensity, red, green, blue);
		canvasIO.ctx.fillRect(0, -size, length, size);
		canvasIO.ctx.restore();
	}
	static glowOutline(x1: number, y1: number, x2: number, y2: number, size: number, intensity: number, canvasIO: CanvasIO, red: number = 255, green: number = 255, blue: number = 255) {
		GameUtils.glowLine(x1, y1, x2, y2, size, intensity, canvasIO, red, green, blue);
		GameUtils.glowLine(x2, y2, x1, y1, size, intensity, canvasIO, red, green, blue);

		const length = Math.hypot(x1 - x2, y1 - y2);
		canvasIO.ctx.save();
		canvasIO.ctx.translate(x1, y1);
		canvasIO.ctx.rotate(new Vector(x2 - x1, y2 - y1).angle());
		GameUtils.glowArc(0, 0, size, intensity, canvasIO, Math.PI / 2, 3 * Math.PI / 2, red, green, blue);
		GameUtils.glowArc(length, 0, size, intensity, canvasIO, -Math.PI / 2, Math.PI / 2, red, green, blue);
		canvasIO.ctx.restore();
	}
	static glowCircleGradients = new Map<string, CanvasGradient>();
	static glowLineGradients = new Map<string, CanvasGradient>();
	static glowCircleGradient(size: number, intensity: number, red: number = 255, green: number = 255, blue: number = 255) {
		const argsString = `${size}, ${intensity}, ${red}, ${green}, ${blue}`;
		const cachedResult = GameUtils.glowCircleGradients.get(argsString);
		if(cachedResult) { return cachedResult; }
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
		for(let i = 0; i < 1; i += 1 / size) {
			const color = GameUtils.hexColor(red, green, blue, Math.floor(intensity * 255 * (1 - i) ** 2));
			gradient.addColorStop(i, color);
		}
		GameUtils.glowCircleGradients.set(argsString, gradient);
		return gradient;
	}
	static glowLineGradient(length: number, intensity: number, red: number = 255, green: number = 255, blue: number = 255) {
		length = Math.floor(length);
		const argsString = `${length}, ${intensity}, ${red}, ${green}, ${blue}`;
		const cachedResult = GameUtils.glowLineGradients.get(argsString);
		if(cachedResult) { return cachedResult; }
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const gradient = ctx.createLinearGradient(0, 0, 0, -length);
		for(let i = 0; i < 1; i += 1 / length) {
			const color = GameUtils.hexColor(red, green, blue, Math.floor(intensity * 255 * (1 - i) ** 2));
			gradient.addColorStop(i, color);
		}
		GameUtils.glowLineGradients.set(argsString, gradient);
		return gradient;
	}
	static shatterParticles(display: (canvasIO: CanvasIO) => void, world: World, position: Vector, pieces: number, maxVelocity: number, canvasIO: CanvasIO, angleEvenness: number, settings: ParticleSettings) {
		const angles = GameUtils.randomEvenlySpaced({
			generate: () => GameUtils.random(0, 2 * Math.PI),
			metric: MathUtils.dist,
			amount: pieces - 1,
			trials: angleEvenness,
		}).sort((a, b) => a - b);

		for(const [i, angle] of [0, ...angles, 2 * Math.PI].entries()) {
			const next = angles[i + 1];
			if(typeof next !== "number") { break; }
			const velocity = new Vector(Math.cos(-(angle + next) / 2), -Math.sin(-(angle + next) / 2)).multiply(maxVelocity);
			const displaySector = () => {
				canvasIO.ctx.save();
				canvasIO.clipArc(0, 0, 100, angle, next);
				canvasIO.ctx.translate(-position.x, -position.y);
				display(canvasIO);
				canvasIO.ctx.restore();
			};
			world.addParticle(new Particle(position, velocity, { ...settings, shape: displaySector, rotation: 0 }), canvasIO);
		}
	}
	static lerpColor(value: number, min: number, max: number, color1: Color, color2: Color): Color {
		if(value < min) {
			return color1;
		}
		if(value > max) {
			return color2;
		}
		return {
			red: GameUtils.lerp(value, min, max, color1.red, color2.red),
			green: GameUtils.lerp(value, min, max, color1.green, color2.green),
			blue: GameUtils.lerp(value, min, max, color1.blue, color2.blue),
		};
	}
	static formatColor(color: Color) {
		return `rgb(${color.red}, ${color.green}, ${color.blue})`;
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
			GameUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.right(), rectangle.top(), rectangle.bottom()),
		);
	}
	static rayIntersectsSegment(rayStart: Vector, rayDirection: Vector, endpoint1: Vector, endpoint2: Vector) {
		const lineDirection = endpoint2.subtract(endpoint1);
		const distance = (endpoint1.y + (rayStart.x - endpoint1.x) / lineDirection.x * lineDirection.y - rayStart.y) / (rayDirection.y - rayDirection.x / lineDirection.x * lineDirection.y);
		const intersection = rayStart.add(rayDirection.multiply(distance));
		if(
			distance >= 0
			&& Rectangle.fromOppositeCorners(endpoint1, endpoint2).contains(intersection)
		) { return distance; }
		return Infinity;
	}

	static reachableNodes<T>(startNode: T, neighbors: (node: T) => T[], hashFunction: (value: T) => string) {
		const visited = new HashSet<T>([startNode], hashFunction);
		const boundary = [startNode];
		while(boundary.length !== 0) {
			const node = boundary.pop()!;
			for(const neighbor of neighbors(node)) {
				if(!visited.has(neighbor)) {
					boundary.push(neighbor);
				}
				visited.add(neighbor);
			}
			visited.add(node);
		}
		return [...visited];
	}
}
