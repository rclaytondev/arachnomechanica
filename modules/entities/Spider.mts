import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
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
}

export class SpiderLeg {
	attachmentOffset: Vector;
	position: Vector;
	destination: Vector;
	length: number;

	constructor(length: number, attachmentOffset: Vector, position: Vector) {
		this.length = length;
		this.attachmentOffset = attachmentOffset;
		this.position = position;
		this.destination = position;
	}

	display(spider: Spider, canvasIO: CanvasIO) {
		const attachment = this.attachment(spider);
		canvasIO.ctx.strokeStyle = "green";
		canvasIO.strokeLine(this.position.x, this.position.y, attachment.x, attachment.y);
	}
	displayDebug(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = "yellow";
		canvasIO.fillCircle(this.destination.x, this.destination.y, 5);
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
		const center = this.physicsObject.hitbox().center();
		return [
			new SpiderLeg(
				40,
				new Vector(-15, 20),
				center.add(-30, 20)
			),
			new SpiderLeg(
				40,
				new Vector(15, 20),
				center.add(30, 20)
			),

			new SpiderLeg(
				60,
				new Vector(-25, 0),
				center.add(-40, 20)
			),
			new SpiderLeg(
				60,
				new Vector(25, 0),
				center.add(40, 20)
			)
		];
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		const position = this.physicsObject.hitbox().center();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate(this.angle);
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		canvasIO.fillRegularPoly(new Vector(0, 0), SpiderData.SIZE / 2, 6);
		canvasIO.ctx.restore();

		this.displayLegs(canvasIO);
	}
	displayLegs(canvasIO: CanvasIO) {
		for(const leg of this.legs) {
			leg.display(this, canvasIO);
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
	}
	updateAngle() {
		const targetAngle = Math.PI / 2 - (this.basepoint ? Directions.angle[this.basepoint.surface.outwardNormal] : 0);
		this.angle = GameUtils.moveAngleTowards(this.angle, targetAngle, SpiderData.ANGULAR_SPEED);
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
		this.basepoint!.distance += amount * (this.movement === "clockwise" ? 1 : -1);
		while(this.basepoint!.distance > this.basepoint!.surface.length()) {
			this.basepoint = new PointOnSurface(
				this.nextSurfaceCW(world),
				this.basepoint!.distance - this.basepoint!.surface.length()
			)
		}
		while(this.basepoint!.distance < 0) {
			const nextSurface = this.nextSurfaceCCW(world);
			this.basepoint = new PointOnSurface(
				nextSurface,
				nextSurface.length() + this.basepoint!.distance
			);
		}
	}
	smoothedNormal(world: World) {
		if(this.basepoint!.distance < SpiderData.TURN_WALL_DURATION) {
			const nextSurface = this.nextSurfaceCCW(world);
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
			const nextSurface = this.nextSurfaceCW(world);
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
		const nextSurfaceCW = this.nextSurfaceCW(world);
		const nextSurfaceCCW = this.nextSurfaceCCW(world);
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

	nextSurfaceCW(world: World) {
		const tangent = this.basepoint!.surface.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateClockwise45[tangent];
		const angle = TowerTile.angle(
			this.basepoint!.surface.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
				tileTangent,
			world
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateClockwise45[newTangent];
		}
		return new Surface(
			this.basepoint!.surface.end(),
			Directions.rotateCounterclockwise[newTangent]
		);
	}
	nextSurfaceCCW(world: World) {
		const tangent = this.basepoint!.surface.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateCounterclockwise45[tangent];
		const angle = TowerTile.angle(
			this.basepoint!.surface.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
			Directions.opposite[tileTangent],
			world
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateCounterclockwise45[newTangent];
		}
		return new Surface(
			this.basepoint!.surface.start.subtract(Vector.gridUnit(newTangent)),
			Directions.rotateCounterclockwise[newTangent]
		);
	}
}
