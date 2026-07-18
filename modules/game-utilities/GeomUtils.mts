import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";

export class GeomUtils {
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
		if(min1 === max1) {
			throw new Error("Cannot lerp because the source range had a length of zero.");
		}
		return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
	}
	static lerpAngle(value: number, min1: number, max1: number, min2: number, max2: number) {
		/* As `value` moves from `min1` to `max1`, the output will move from `min2` to `max2`, taking the shorter path around the circle. */
		const closest = ArrayUtils.minValue(
			[max2, max2 + 2 * Math.PI, max2 - 2 * Math.PI],
			n => MathUtils.dist(min2, n),
		);
		return GeomUtils.lerp(value, min1, max1, min2, closest);
	}
	static moveAngleTowards(angle: number, target: number, speed: number) {
		angle = MathUtils.generalizedModulo(angle, 2 * Math.PI);
		target = MathUtils.generalizedModulo(target, 2 * Math.PI);
		const closest = ArrayUtils.minValue(
			[target, target + 2 * Math.PI, target - 2 * Math.PI],
			n => MathUtils.dist(angle, n),
		);
		return GeomUtils.moveTowards(angle, closest, speed);
	}
	static angleDistance(angle1: number, angle2: number) {
		return Math.abs(GeomUtils.signedAngleDistance(angle1, angle2));
	}
	static signedAngleDistance(angle1: number, angle2: number) {
		return GeomUtils.signedModularDistance(angle1, angle2, 2 * Math.PI);
	}
	static signedModularDistance(num1: number, num2: number, modulo: number) {
		num1 = MathUtils.generalizedModulo(num1, modulo);
		num2 = MathUtils.generalizedModulo(num2, modulo);
		return ArrayUtils.minValue([
			num2 - num1,
			num2 + modulo - num1,
			num2 - modulo - num1,
		], Math.abs);
	}
	static toroidalDistance(point1: Vector, point2: Vector, width: number, height: number = width) {
		return Math.sqrt(
			GeomUtils.signedModularDistance(point1.x, point2.x, width) ** 2
			+ GeomUtils.signedModularDistance(point1.y, point2.y, height) ** 2,
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
		const distance = GeomUtils.rayIntersectsHorizontal(rayStart, rayDirection, horizontalLineY);
		const intersectionX = rayStart.x + distance * rayDirection.x;
		return (xStart <= intersectionX && intersectionX <= xEnd) ? distance : Infinity;
	}
	static rayIntersectsVSegment(rayStart: Vector, rayDirection: Vector, verticalLineX: number, yStart: number, yEnd: number) {
		const distance = GeomUtils.rayIntersectsVertical(rayStart, rayDirection, verticalLineX);
		const intersectionY = rayStart.y + distance * rayDirection.y;
		return (yStart <= intersectionY && intersectionY <= yEnd) ? distance : Infinity;
	}
	static rayIntersectsRectangle(rayStart: Vector, rayDirection: Vector, rectangle: Rectangle) {
		if(rectangle.contains(rayStart)) {
			return 0;
		}
		return Math.min(
			GeomUtils.rayIntersectsHSegment(rayStart, rayDirection, rectangle.top, rectangle.left, rectangle.right),
			GeomUtils.rayIntersectsHSegment(rayStart, rayDirection, rectangle.bottom, rectangle.left, rectangle.right),
			GeomUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.left, rectangle.top, rectangle.bottom),
			GeomUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.right, rectangle.top, rectangle.bottom),
		);
	}
	static rayIntersectsSegment(rayStart: Vector, rayDirection: Vector, endpoint1: Vector, endpoint2: Vector) {
		if(endpoint1.x === endpoint2.x) {
			return GeomUtils.rayIntersectsVSegment(
				rayStart, rayDirection, endpoint1.x,
				Math.min(endpoint1.y, endpoint2.y),
				Math.max(endpoint1.y, endpoint2.y),
			);
		}
		if(endpoint1.y === endpoint2.y) {
			return GeomUtils.rayIntersectsHSegment(
				rayStart, rayDirection, endpoint1.y,
				Math.min(endpoint1.x, endpoint2.x),
				Math.max(endpoint1.x, endpoint2.x),
			);
		}
		const lineDirection = endpoint2.subtract(endpoint1);
		const distance = (endpoint1.y + (rayStart.x - endpoint1.x) / lineDirection.x * lineDirection.y - rayStart.y) / (rayDirection.y - rayDirection.x / lineDirection.x * lineDirection.y);
		const intersection = rayStart.add(rayDirection.multiply(distance));
		if(
			distance >= 0
			&& Rectangle.fromOppositeCorners(endpoint1, endpoint2).contains(intersection)
		) { return distance; }
		return Infinity;
	}
	static rayIntersectsPoint(rayStart: Vector, rayDirection: Vector, point: Vector) {
		if(point.equals(rayStart)) { return 0; }
		if(rayDirection.x === 0) {
			const intersects = rayDirection.y !== 0 && point.x === rayStart.x && Math.sign(point.y - rayStart.y) === Math.sign(rayDirection.y);
			return intersects ? (point.y - rayStart.y) / rayDirection.y : Infinity;
		}
		if(rayDirection.y === 0) {
			const intersects = rayDirection.x !== 0 && point.y === rayStart.y && Math.sign(point.x - rayStart.x) === Math.sign(rayDirection.x);
			return intersects ? (point.x - rayStart.x) / rayDirection.x : Infinity;
		}
		const multiplierX = (point.x - rayStart.x) / rayDirection.x;
		const multiplierY = (point.y - rayStart.y) / rayDirection.y;
		const intersects = multiplierX === multiplierY && multiplierX > 0;
		return intersects ? multiplierX : Infinity;
	}
	static gridSquaresContaining(point: Vector, gridSize: number = 1) {
		point = point.divide(gridSize);
		const result: Vector[] = [];
		for(const x of new Set([Math.floor(point.x), Math.ceil(point.x) - 1])) {
			for(const y of new Set([Math.floor(point.y), Math.ceil(point.y) - 1])) {
				result.push(new Vector(x, y));
			}
		}
		return result;
	}
	static gridSquaresOnRay(rayStart: Vector, rayDirection: Vector, maxDistance: number, gridSize: number = 1) {
		rayStart = rayStart.divide(gridSize);
		rayDirection = rayDirection.divide(gridSize);

		const result: Vector[] = [];
		const add = (v: Vector) => {
			if(!result.some(w => w.equals(v))) {
				result.push(v);
			}
		};

		let point = rayStart;
		while(Vector.dist(point, rayStart) < maxDistance * rayDirection.magnitude()) {
			GeomUtils.gridSquaresContaining(point).forEach(add);
			let distance = Infinity;
			if(rayDirection.x > 0) {
				distance = Math.min(distance, GeomUtils.rayIntersectsVertical(point, rayDirection, Math.floor(point.x) + 1));
			}
			else if(rayDirection.x < 0) {
				distance = Math.min(distance, GeomUtils.rayIntersectsVertical(point, rayDirection, Math.ceil(point.x) - 1));
			}
			if(rayDirection.y > 0) {
				distance = Math.min(distance, GeomUtils.rayIntersectsHorizontal(point, rayDirection, Math.floor(point.y) + 1));
			}
			else if(rayDirection.y < 0) {
				distance = Math.min(distance, GeomUtils.rayIntersectsHorizontal(point, rayDirection, Math.ceil(point.y) - 1));
			}
			distance = Math.max(distance, 10 ** -10); // prevent it from getting stuck due to floating point errors
			if(distance === Infinity) {
				throw new Error("The ray did not intersect any grid squares. (This may happen if rayDirection = 0).");
			}
			point = point.add(rayDirection.multiply(distance));
		}
		return result;
	}
	static rectIntersectionDistance(rect: Rectangle, direction: Direction, target: Rectangle) {
		if(rect.intersects(target)) { return 0; }
		if(Directions.isHorizontal(direction)) {
			if(!(rect.bottom > target.y && rect.y < target.bottom)) {
				return Infinity;
			}
			const distance = (direction === "right") ? target.x - rect.right : rect.x - target.right;
			return distance >= 0 ? distance : Infinity;
		}
		else {
			if(!(rect.right > target.x && rect.x < target.right)) {
				return Infinity;
			}
			const distance = (direction === "down") ? target.y - rect.bottom : rect.y - target.bottom;
			return distance >= 0 ? distance : Infinity;
		}
	}
}
