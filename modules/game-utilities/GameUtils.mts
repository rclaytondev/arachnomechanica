import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { World } from "../World";
import { Particle, ParticleSettings } from "./Particle.mjs";

export class GameUtils {
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
			n => MathUtils.dist(min2, n)
		);
		return GameUtils.lerp(value, min1, max1, min2, closest);
	}
	static moveAngleTowards(angle: number, target: number, speed: number) {
		angle = MathUtils.generalizedModulo(angle, 2 * Math.PI);
		target = MathUtils.generalizedModulo(target, 2 * Math.PI);
		const closest = Utils.minValue(
			[target, target + 2 * Math.PI, target - 2 * Math.PI],
			n => MathUtils.dist(angle, n)
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
			num2 - modulo - num1
		], Math.abs);
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
	static randomEvenlySpacedNumbers(min: number, max: number, numTrials: number, previousValues: number[]) {
		if(previousValues.length === 0) {
			return GameUtils.random(min, max);
		}
		const values = new Array(numTrials).fill(0).map(_ => GameUtils.random(min, max));
		return Utils.maxValue(values, value => Utils.minOutput(previousValues, v => MathUtils.dist(value, v)));
	}
	static allRandomlyEvenlySpacedNumbers(min: number, max: number, amount: number, evenness: number) {
		const result: number[] = [];
		while(result.length < amount) {
			result.push(GameUtils.randomEvenlySpacedNumbers(min, max, evenness, result));
		}
		return result;
	}
	
	static hexColor(red: number, green: number, blue: number, alpha: number) {
		return "#" + red.toString(16).padStart(2, "0") + green.toString(16).padStart(2, "0") + blue.toString(16).padStart(2, "0") + alpha.toString(16).padStart(2, "0");
	}
	static glowCircle(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, red: number = 255, green: number = 255, blue: number = 255) {
		const gradient = GameUtils.glowCircleGradient(x, y, size, intensity, red, green, blue);
		canvasIO.ctx.save();
		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.fillCircle(x, y, size * 2);
		canvasIO.ctx.restore();
	}
	static glowArc(x: number, y: number, size: number, intensity: number, canvasIO: CanvasIO, startAngle: number, endAngle: number, red: number = 255, green: number = 255, blue: number = 255) {
		const gradient = GameUtils.glowCircleGradient(x, y, size, intensity, red, green, blue);
		canvasIO.ctx.save();
		canvasIO.ctx.fillStyle = gradient;
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.fillArc(x, y, size * 2, startAngle, endAngle);
		canvasIO.ctx.restore();
	}
	static glowCircleGradient(x: number, y: number, size: number, intensity: number, red: number = 255, green: number = 255, blue: number = 255) {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
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
	static shatterParticles(display: (canvasIO: CanvasIO) => void, world: World, position: Vector, pieces: number, maxVelocity: number, canvasIO: CanvasIO, angleEvenness: number, settings: ParticleSettings) {
		const angles = GameUtils.allRandomlyEvenlySpacedNumbers(0, 2 * Math.PI, pieces - 1, angleEvenness).sort((a, b) => a - b);

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

	static reachableNodes<T>(startNode: T, neighbors: (node: T) => T[], equals: (n1: T, n2: T) => boolean = (n1, n2) => n1 === n2) {
		const visited: T[] = [];
		const boundary = [startNode];
		while(boundary.length !== 0) {
			const node = boundary.pop()!;
			for(const neighbor of neighbors(node)) {
				if(![...visited, ...boundary].some(n => equals(n, neighbor))) {
					boundary.push(neighbor);
				}
			}
			visited.push(node);
		}
		return visited;
	}
}
