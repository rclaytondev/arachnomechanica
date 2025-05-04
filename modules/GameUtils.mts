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

	static pastKeys: { [ key: string ]: boolean } = {};
}
