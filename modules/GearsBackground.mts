import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { BackgroundData, BackgroundGearLayerData, LevelGeneratorData, RoomData, WorldData } from "./constants/GameData.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { frameCount } from "./Main.js";

class BackgroundGear {
	position: Vector;
	size: number;
	teeth: number;
	innerRadiusRatio: number;
	speed: number;
	startAngle: number;
	color: string;

	constructor(position: Vector, size: number, teeth: number, innerRadiusRatio: number, speed: number, color: string, startAngle: number) {
		this.position = position;
		this.size = size;
		this.teeth = teeth;
		this.innerRadiusRatio = innerRadiusRatio;
		this.speed = speed;
		this.color = color;
		this.startAngle = startAngle;
	}

	display(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.ctx.save();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate((this.startAngle + this.speed * frameCount) * Math.PI / 180);
		canvasIO.ctx.beginPath();
		canvasIO.ctx.moveTo(this.size, 0);
		for(let i = 0; i < this.teeth; i ++) {
			const angle1 = 360 * (2 * i) / (2 * this.teeth);
			const angle2 = 360 * (2 * i + 1) / (2 * this.teeth);
			const angle3 = 360 * (2 * i + 2) / (2 * this.teeth);
			const point = new Vector(Math.cos(MathUtils.toRadians(angle2)), -Math.sin(MathUtils.toRadians(angle2))).multiply(this.size * this.innerRadiusRatio);
			canvasIO.ctx.arc(0, 0, this.size, -MathUtils.toRadians(angle1), -MathUtils.toRadians(angle2), true);
			canvasIO.ctx.lineTo(point.x, point.y);
			canvasIO.ctx.arc(0, 0, this.size * this.innerRadiusRatio, -MathUtils.toRadians(angle2), -MathUtils.toRadians(angle3), true);
		}
		canvasIO.ctx.fill();
		canvasIO.ctx.restore();
	}
	static isVisible(position: Vector, size: number, canvasIO: CanvasIO) {
		return (
			position.x + size > 0 && position.x - size < canvasIO.canvas.width &&
			position.y + size > 0 && position.y - size < canvasIO.canvas.height
		);
	}

	intersects(gear: BackgroundGear, parallax: number) {
		return Vector.dist(this.position, gear.position) * parallax < this.size + gear.size;
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

	display(playerPosition: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.filter = `blur(${this.blur}px)`;
		for(const gear of this.gears) {
			const position = gear.position.subtract(playerPosition).multiply(this.parallax).add(canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
			if(BackgroundGear.isVisible(position, gear.size, canvasIO)) {
				gear.display(position, canvasIO);
			}
		}
		canvasIO.ctx.restore();
	}

	static generate(info: BackgroundGearLayerData) {
		const gears: BackgroundGear[] = [];
		const numGears = LevelGeneratorData.WIDTH * LevelGeneratorData.HEIGHT * info.density;
		const region = new Rectangle(
			0, 0, 
			LevelGeneratorData.WIDTH * RoomData.SIZE * WorldData.TILE_SIZE, 
			LevelGeneratorData.HEIGHT * RoomData.SIZE * WorldData.TILE_SIZE
		);
		for(let i = 0; i < numGears; i ++) {
			let spawned = false;
			let attempts = 0;
			while(!spawned) {
				attempts ++;
				const position = GameUtils.randomEvenlySpaced(region, gears.map(g => g.position), info.evenness);
				const gear = new BackgroundGear(
					position,
					GameUtils.random(info.minSize,  info.maxSize),
					GameUtils.randomInt(info.minTeeth, info.maxTeeth),
					GameUtils.random(info.minInnerRadius, info.maxInnerRadius),
					GameUtils.random(info.minSpeed, info.maxSpeed),
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

	display(canvasIO: CanvasIO, playerPosition: Vector) {
		for(let i = this.layers.length - 1; i >= 0; i --) {
			this.layers[i].display(playerPosition, canvasIO);
		}
	}

	static generate() {
		return new GearsBackground(BackgroundData.LAYERS.map(l => GearLayer.generate(l)));
	}
}
