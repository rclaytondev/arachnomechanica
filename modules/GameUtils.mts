import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
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
}
