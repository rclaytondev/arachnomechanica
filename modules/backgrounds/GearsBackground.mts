import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { BackgroundData, BackgroundGearLayerData, LevelGeneratorData, RoomData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { frameCount } from "../Main.js";

class BackgroundGear {
	position: Vector;
	size: number;
	teeth: number;
	innerRadiusRatio: number;
	speed: number;
	startAngle: number;
	color: string;
	image: HTMLCanvasElement | null = null;

	constructor(position: Vector, size: number, teeth: number, innerRadiusRatio: number, speed: number, color: string, startAngle: number) {
		this.position = position;
		this.size = size;
		this.teeth = teeth;
		this.innerRadiusRatio = innerRadiusRatio;
		this.speed = speed;
		this.color = color;
		this.startAngle = startAngle;
	}

	getRenderImage(blur: number) {
		const margin = blur;
		const canvas = document.createElement("canvas");
		canvas.width = 2 * (this.size + margin);
		canvas.height = 2 * (this.size + margin);
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = this.color;
		ctx.save();
		ctx.filter = `blur(${blur}px)`;
		ctx.translate(this.size + margin, this.size + margin);
		ctx.beginPath();
		ctx.moveTo(this.size, 0);
		for(let i = 0; i < this.teeth; i ++) {
			const angle1 = 360 * (2 * i) / (2 * this.teeth);
			const angle2 = 360 * (2 * i + 1) / (2 * this.teeth);
			const angle3 = 360 * (2 * i + 2) / (2 * this.teeth);
			const point = new Vector(Math.cos(MathUtils.toRadians(angle2)), -Math.sin(MathUtils.toRadians(angle2))).multiply(this.size * this.innerRadiusRatio);
			ctx.arc(0, 0, this.size, -MathUtils.toRadians(angle1), -MathUtils.toRadians(angle2), true);
			ctx.lineTo(point.x, point.y);
			ctx.arc(0, 0, this.size * this.innerRadiusRatio, -MathUtils.toRadians(angle2), -MathUtils.toRadians(angle3), true);
		}
		ctx.fill();
		ctx.restore();
		return canvas;
	}
	display(position: Vector, blur: number, canvasIO: CanvasIO) {
		if(!this.image) {
			this.image = this.getRenderImage(blur);
		}
		canvasIO.ctx.save();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate((this.startAngle + this.speed * frameCount) * Math.PI / 180);
		canvasIO.ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
		canvasIO.ctx.restore();
	}
	static isVisible(position: Vector, size: number, canvasIO: CanvasIO) {
		return (
			position.x + size > 0 && position.x - size < canvasIO.canvas.width &&
			position.y + size > 0 && position.y - size < canvasIO.canvas.height
		);
	}

	intersects(gear: BackgroundGear, parallax: number) {
		const distX = GameUtils.signedModularDistance(this.position.x, gear.position.x, BackgroundData.BACKGROUND_REPEAT_SIZE);
		const distY = GameUtils.signedModularDistance(this.position.y, gear.position.y, BackgroundData.BACKGROUND_REPEAT_SIZE);
		const distance = Math.sqrt(distX ** 2 + distY ** 2);
		return distance * parallax < this.size + gear.size;
	}
}

class GearLayer {
	parallax: number;
	blur: number;
	gears: BackgroundGear[];

	constructor(parallax: number, blur: number, gears: BackgroundGear[]) {
		this.parallax = parallax;
		this.blur = blur;
		this.gears = gears;
	}

	display(cameraPosition: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		for(const gear of this.gears) {
			const repeatedPosition = new Vector(
				cameraPosition.x + GameUtils.signedModularDistance(cameraPosition.x, gear.position.x, BackgroundData.BACKGROUND_REPEAT_SIZE),
				cameraPosition.y + GameUtils.signedModularDistance(cameraPosition.y, gear.position.y, BackgroundData.BACKGROUND_REPEAT_SIZE)
			);
			const position = repeatedPosition.subtract(cameraPosition).multiply(this.parallax).add(canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
			if(BackgroundGear.isVisible(position, gear.size, canvasIO)) {
				gear.display(position, this.blur, canvasIO);
			}
		}
		canvasIO.ctx.restore();
	}

	static generate(info: BackgroundGearLayerData) {
		const gears: BackgroundGear[] = [];
		const numGears = BackgroundData.BACKGROUND_REPEAT_SIZE ** 2 * info.density;
		const region = Rectangle.square(0, 0, BackgroundData.BACKGROUND_REPEAT_SIZE);
		for(let i = 0; i < numGears; i ++) {
			let spawned = false;
			let attempts = 0;
			while(!spawned) {
				attempts ++;
				const [position] = GameUtils.randomEvenlySpaced({
					generate: () => GameUtils.randomInRect(Rectangle.square(0, 0, BackgroundData.BACKGROUND_REPEAT_SIZE), GameUtils.randomInt),
					metric: (v1, v2) => GameUtils.toroidalDistance(v1, v2, BackgroundData.BACKGROUND_REPEAT_SIZE),
					amount: 1,
					trials: info.evenness
				});
				const gear = new BackgroundGear(
					position,
					GameUtils.random(info.minSize,  info.maxSize),
					GameUtils.randomInt(info.minTeeth, info.maxTeeth),
					GameUtils.random(info.minInnerRadius, info.maxInnerRadius),
					GameUtils.random(info.minSpeed, info.maxSpeed) * (Math.random() < 0.5 ? 1 : -1),
					info.color,
					GameUtils.randomInt(0, 360)
				);
				if(!gears.some(g => g.intersects(gear, info.parallax))) {
					gears.push(gear);
					spawned = true;
				}
				else if(attempts > BackgroundData.MAX_GEAR_SPAWN_ATTEMPTS) {
					spawned = true;
				}
			}
		}
		return new GearLayer(info.parallax, info.blur, gears);
	}
}

export class GearsBackground {
	layers: GearLayer[];
	constructor(layers: GearLayer[]) {
		this.layers = layers;
	}

	display(canvasIO: CanvasIO, cameraPosition: Vector) {
		for(let i = this.layers.length - 1; i >= 0; i --) {
			this.layers[i].display(cameraPosition, canvasIO);
		}
	}

	static generate() {
		return new GearsBackground(BackgroundData.LAYERS.map(l => GearLayer.generate(l)));
	}
}
