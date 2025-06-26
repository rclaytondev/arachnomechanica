import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Line } from "../../utils-ts/modules/geometry/Line.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { frameCount } from "../Main.js";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../World";

export class Surface {
	start: Vector;
	outwardNormal: Direction | Diagonal;
	constructor(start: Vector, outwardNormal: Direction | Diagonal) {
		this.start = start;
		this.outwardNormal = outwardNormal;
	}

	tangentDirectionCW() {
		return Directions.rotateClockwise[this.outwardNormal];
	}
	tangentVectorCW() {
		return Vector.unit(this.tangentDirectionCW());
	}

	nextSurfaceCW(world: World) {
		const tangent = this.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateClockwise45[tangent];
		const angle = TowerTile.angle(
			this.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
				tileTangent,
			world
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateClockwise45[newTangent];
		}
		return new Surface(
			this.end(),
			Directions.rotateCounterclockwise[newTangent]
		);
	}
	nextSurfaceCCW(world: World) {
		const tangent = this.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateCounterclockwise45[tangent];
		const angle = TowerTile.angle(
			this.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
			Directions.opposite[tileTangent],
			world
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateCounterclockwise45[newTangent];
		}
		return new Surface(
			this.start.subtract(Vector.gridUnit(newTangent)),
			Directions.rotateCounterclockwise[newTangent]
		);
	}

	tilePosition() {
		const positions = {
			"right": this.start,
			"up-right": this.start.add(0, -1),
			"up": this.start.add(0, -1),
			"up-left": this.start.add(-1, -1),
			"left": this.start.add(-1, -1),
			"down-left": this.start.add(-1, 0),
			"down": this.start.add(-1, 0),
			"down-right": this.start
		};
		return positions[this.tangentDirectionCW()];
	}

	end() {
		return this.start.add(Vector.gridUnit(this.tangentDirectionCW()));
	}
	length() {
		return WorldData.TILE_SIZE * (Directions.isDirection(this.outwardNormal) ? 1 : Math.SQRT2);
	}
	line() {
		return new Line(this.start.multiply(WorldData.TILE_SIZE), this.end().multiply(WorldData.TILE_SIZE));
	}

	copy() {
		return new Surface(this.start.clone(), this.outwardNormal);
	}
}

export class PointOnSurface {
	surface: Surface;
	distance: number;
	constructor(surface: Surface, distance: number) {
		this.surface = surface;
		this.distance = distance;
	}

	position() {
		return this.surface.start.multiply(WorldData.TILE_SIZE).add(this.surface.tangentVectorCW().multiply(this.distance));
	}
	
	moveAlongSurface(amount: number, world: World) {
		let point = this.copy();
		point.distance += amount;
		while(point.distance > point.surface.length()) {
			point = new PointOnSurface(
				point.surface.nextSurfaceCW(world),
				point.distance - point.surface.length()
			);
		}
		while(point.distance < 0) {
			const nextSurface = point.surface.nextSurfaceCCW(world);
			point = new PointOnSurface(
				nextSurface,
				nextSurface.length() + point.distance
			);
		}
		return point;
	}

	copy() {
		return new PointOnSurface(this.surface.copy(), this.distance);
	}
}

export class SpiderLeg {
	minDistance: number;
	maxDistance: number;
	distance: number;
	destination: number;
	attachmentOffset: Vector;
	length: number;

	constructor(length: number, attachmentOffset: Vector, minDistance: number, maxDistance: number) {
		this.length = length;
		this.attachmentOffset = attachmentOffset;
		this.distance = minDistance;
		this.destination = maxDistance;
		this.minDistance = minDistance;
		this.maxDistance = maxDistance;
	}

	update() {
		if(Math.abs(this.distance) <= this.minDistance || Math.sign(this.distance) !== Math.sign(this.attachmentOffset.x)) {
			this.destination = this.maxDistance * Math.sign(this.attachmentOffset.x);
		}
		else if(Math.abs(this.distance) >= this.maxDistance && Math.sign(this.distance) === Math.sign(this.attachmentOffset.x)) {
			this.destination = this.minDistance * Math.sign(this.attachmentOffset.x);
		}

		this.distance = GameUtils.moveTowards(this.distance, this.destination, SpiderData.LEG_SPEED);
	}
	position(spider: Spider, world: World) {
		return spider.basepoint!.moveAlongSurface(this.distance, world).position();
	}
	jointPosition(spider: Spider, position: Vector) {
		const center = spider.physicsObject.hitbox().center();
		const distance = Vector.dist(position, center);
		const horizontal = position.subtract(center).normalize();
		const up = horizontal.rotate(this.attachmentOffset.x < 0 ? 90 : -90);
		const height = Math.sqrt(this.length ** 2 - (distance / 2) ** 2);
		return center.add(horizontal.multiply(distance / 2)).add(up.multiply(height));
	}

	display(spider: Spider, canvasIO: CanvasIO, world: World) {
		const attachment = this.attachment(spider);
		const position = this.position(spider, world);
		const joint = this.jointPosition(spider, position);
		canvasIO.ctx.strokeStyle = "green";
		canvasIO.strokeLine(attachment.x, attachment.y, joint.x, joint.y);
		canvasIO.strokeLine(joint.x, joint.y, position.x, position.y);
	}
	displayDebug(canvasIO: CanvasIO) {
		// Unimplemented
	}

	attachment(spider: Spider) {
		const center = spider.physicsObject.hitbox().center();
		return center.add(this.attachmentOffset.rotate(MathUtils.toDegrees(spider.angle)));
	}
}

export class Spider {
	physicsObject: PhysicsObject;
	movement: "clockwise" | "counterclockwise" = "clockwise";
	basepoint: PointOnSurface | null = null;
	angle: number = 0;

	legs: SpiderLeg[];

	constructor(position: Vector) {
		this.physicsObject = new PhysicsObject(
			position.subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2).floor(),
			new Rectangle(0, 0, SpiderData.HITBOX_SIZE, SpiderData.HITBOX_SIZE)
		);
		this.legs = this.initializeLegs();
	}
	initializeLegs() {
		return [
			new SpiderLeg(
				40,
				new Vector(-15, 20),
				20,
				40
			),
			new SpiderLeg(
				40,
				new Vector(15, 20),
				20,
				40
			),

			new SpiderLeg(
				60,
				new Vector(-25, 0),
				40,
				70
			),
			new SpiderLeg(
				60,
				new Vector(25, 0),
				40,
				70
			)
		];
	}

	display(canvasIO: CanvasIO, world: World) {
		canvasIO.ctx.save();
		const position = this.physicsObject.hitbox().center();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate(this.angle);
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		canvasIO.fillRegularPoly(new Vector(0, 0), SpiderData.SIZE / 2, 6);
		canvasIO.ctx.restore();

		this.displayLegs(canvasIO, world);
	}
	displayLegs(canvasIO: CanvasIO, world: World) {
		for(const leg of this.legs) {
			leg.display(this, canvasIO, world);
		}
	}
	displayDebug(canvasIO: CanvasIO) {
		if(this.basepoint) {
			canvasIO.ctx.fillStyle = "red";
			canvasIO.ctx.strokeStyle = "red";
			canvasIO.ctx.lineWidth = 2;
			const basepoint = this.basepoint.position();
			canvasIO.fillCircle(basepoint.x, basepoint.y, 5);
			const start = this.basepoint.surface.start.multiply(WorldData.TILE_SIZE);
			const end = this.basepoint.surface.end().multiply(WorldData.TILE_SIZE);
			canvasIO.strokeLine(start.x, start.y, end.x, end.y);
		}

		canvasIO.ctx.strokeStyle = "rgb(0, 255, 255)";
		canvasIO.ctx.lineWidth = 1;
		canvasIO.strokeRect(this.physicsObject.hitbox());

		for(const leg of this.legs) {
			leg.displayDebug(canvasIO);
		}
	}

	update(world: World) {
		this.move(SpiderData.SPEED, world);
		this.updateAngle();
		this.updateLegs(world);
	}
	updateAngle() {
		const targetAngle = Math.PI / 2 - (this.basepoint ? Directions.angle[this.basepoint.surface.outwardNormal] : 0);
		this.angle = GameUtils.moveAngleTowards(this.angle, targetAngle, SpiderData.ANGULAR_SPEED);
	}
	updateLegs(world: World) {
		for(const leg of this.legs) {
			leg.update();
		}
	}

	move(amount: number, world: World) {
		this.moveBasepoint(amount, world);
		const distance = this.wallDistance(world);
		const normal = this.smoothedNormal(world);
		const newCenter = this.basepoint!.position().add(normal.multiply(distance));
		const newPosition = newCenter.subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2);
		this.physicsObject.move(
			newPosition.subtract(this.physicsObject.positionFloat()),
			world
		);
	}
	moveBasepoint(amount: number, world: World) {
		this.basepoint = this.basepoint!.moveAlongSurface(amount * (this.movement === "clockwise" ? 1 : -1), world);
	}
	smoothedNormal(world: World) {
		if(this.basepoint!.distance < SpiderData.TURN_WALL_DURATION) {
			const nextSurface = this.basepoint!.surface.nextSurfaceCCW(world);
			const angle = Directions.angle[this.basepoint!.surface.outwardNormal];
			const nextAngle = Directions.angle[nextSurface.outwardNormal];
			const lerpedAngle = GameUtils.lerpAngle(
				this.basepoint!.distance,
				-SpiderData.TURN_WALL_DURATION, SpiderData.TURN_WALL_DURATION,
				nextAngle, angle
			);
			return new Vector(Math.cos(lerpedAngle), -Math.sin(lerpedAngle));
		}
		if(this.basepoint!.surface.length() - this.basepoint!.distance < SpiderData.TURN_WALL_DURATION) {
			const nextSurface = this.basepoint!.surface.nextSurfaceCW(world);
			const angle = Directions.angle[this.basepoint!.surface.outwardNormal];
			const nextAngle = Directions.angle[nextSurface.outwardNormal];
			const lerpedAngle = GameUtils.lerpAngle(
				this.basepoint!.distance - this.basepoint!.surface.length(),
				-SpiderData.TURN_WALL_DURATION, SpiderData.TURN_WALL_DURATION,
				angle, nextAngle
			);
			return new Vector(Math.cos(lerpedAngle), -Math.sin(lerpedAngle));
		}
		return Vector.unit(this.basepoint!.surface.outwardNormal);
	}
	wallDistance(world: World) {
		const nextSurfaceCW = this.basepoint!.surface.nextSurfaceCW(world);
		const nextSurfaceCCW = this.basepoint!.surface.nextSurfaceCCW(world);
		const distanceToTurn = Math.min(
			nextSurfaceCCW.outwardNormal === this.basepoint!.surface.outwardNormal ? Infinity : this.basepoint!.distance,
			nextSurfaceCW.outwardNormal === this.basepoint!.surface.outwardNormal ? Infinity : this.basepoint!.surface.length() - this.basepoint!.distance
		);
		if(distanceToTurn > SpiderData.TURN_WALL_DURATION) {
			return SpiderData.SIZE / 2;
		}
		return SpiderData.SIZE / 2 + GameUtils.lerp(
			distanceToTurn,
			0, SpiderData.TURN_WALL_DURATION,
			SpiderData.TURN_WALL_DISTANCE, 0
		);
	}
}
