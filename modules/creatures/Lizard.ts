import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { DEBUG_SETTINGS } from "../Main.js";
import { World } from "../World.js";
import { frameCount } from "../Main.js";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { Particle, ParticleSettings } from "../Particle.mjs";

export class Lizard {
	static SPEED = 3;
	static LOOKAHEAD_WIDTH = World.TILE_SIZE;
	static LOOKAHEAD_DISTANCE = World.TILE_SIZE * 1/2 + Lizard.SPEED;
	static HITBOX_WIDTH = World.TILE_SIZE * 1/2;

	static FIRE_PARTICLES: ParticleSettings = {
		color: { red: 0, green: 128, blue: 255 },
		size: World.TILE_SIZE * 0.2,
		shape: 3,
		minRotationalVelocity: 0,
		maxRotationalVelocity: 1
	};
	static PARTICLES_PER_FRAME = 2;
	static PARTICLE_SPEED = Lizard.SPEED + 6;
	static PARTICLE_SPEED_VARIANCE = 2;
	static PARTICLE_CROSS_SPEED_VARIANCE = 1;

	static BODY_WIDTH = World.TILE_SIZE * 0.1;
	static LEG_SCALE = World.TILE_SIZE * 0.5;
	static LEG_SPACING = Lizard.LEG_SCALE; // distance between consecutive legs on the lizard's body.
	static LEG_DISTANCE = Lizard.LEG_SCALE * 0.4; // how far away perpendicularly the foot should be from the body.
	static STEP_SIZE = Lizard.LEG_SCALE * 1.5; // how far past the connection it should move the leg each step.
	static MAX_LEG_DISTANCE = Lizard.LEG_SCALE; // maximum distance between leg and connection before taking a step.
	static FOOT_SIZE = World.TILE_SIZE * 0;
	static LEG_SPEED_MULTIPLIER = 2.5;

	static HEAD_WIDTH = World.TILE_SIZE * 0.2;
	static HEAD_HEIGHT = World.TILE_SIZE * 0.3;
	static HEAD_OFFSET = -World.TILE_SIZE * 0.5;
	static MOUTH_LENGTH = World.TILE_SIZE;
	static EYE_SIZE = World.TILE_SIZE * 0.1;
	static EYE_Y = World.TILE_SIZE * 0.3;
	static EYE_COLOR = "rgb(0, 150, 255)";
	static HEAD_ROTATION_SPEED = 0.2;

	static LIZARDS_PER_ROOM = 0.3;
	static MIN_LENGTH = 2;
	static MAX_LENGTH = 7;

	direction: Direction;
	position: Vector;
	joints: { position: Vector, direction: Direction }[] = [];
	length: number;
	color: string = "rgb(0, 0, 0)";
	speed: number;
	legs: LizardLeg[];
	headAngle: number;
	targetHeadAngle: number;
	fireTimer: number = 0;

	constructor(position: Vector, direction: Direction, length: number, speed: number) {
		this.position = position;
		this.direction = direction;
		this.headAngle = Vector.unit(this.direction).angle();
		this.targetHeadAngle = this.headAngle;
		this.length = length;
		this.speed = speed;

		this.legs = [];
		for(let i = 2; i * Lizard.LEG_SPACING < this.length; i ++) {
			const leftDirection = Directions.rotateCounterclockwise(this.direction);
			const rightDirection = Directions.rotateClockwise(this.direction);
			const jointPosition = this.position.subtract(Vector.unit(this.direction).multiply(i * Lizard.LEG_SPACING));
			const forwardOffset = Vector.unit(this.direction).multiply(Lizard.STEP_SIZE / 2);
			const backwardOffset = Vector.unit(this.direction).multiply(-Lizard.STEP_SIZE / 2);
			const leftOffset = Vector.unit(leftDirection).multiply(Lizard.LEG_DISTANCE);
			const rightOffset = Vector.unit(rightDirection).multiply(Lizard.LEG_DISTANCE);
			this.legs.push(new LizardLeg("left", i * Lizard.LEG_SPACING, jointPosition.add(i % 2 === 0 ? forwardOffset : backwardOffset).add(leftOffset)));
			this.legs.push(new LizardLeg("right", i * Lizard.LEG_SPACING, jointPosition.add(i % 2 === 0 ? backwardOffset : forwardOffset).add(rightOffset)));
		}
	}

	display(canvasIO: CanvasIO) {
		this.displayJoints(canvasIO);
		this.displayBody(canvasIO);
		this.displayLegs(canvasIO);
		this.displayHead(canvasIO);
		this.displayBoundingBoxes(canvasIO);
		this.displayLookaheadRectangle(canvasIO);
	}
	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = this.color;
		canvasIO.ctx.lineWidth = Lizard.BODY_WIDTH;
		canvasIO.ctx.lineCap = "round";
		const segment1End = (
			this.joints[0]?.position ?? 
			this.position.subtract(Vector.unit(this.direction).multiply(this.length))
		);
		canvasIO.strokeLine(this.position.x, this.position.y, segment1End.x, segment1End.y);
		let length = (this.joints.length === 0) ? 0 : Vector.dist(this.position, this.joints[0].position);
		for(const [i, joint] of this.joints.entries()) {
			const next = this.joints[i + 1];
			if(next) {
				length += Vector.dist(joint.position, next.position);
				canvasIO.strokeLine(joint.position.x, joint.position.y, next.position.x, next.position.y);
			}
			else if(this.length > length) {
				const lengthRemaining = this.length - length;
				const bodyEnd = joint.position.subtract(Vector.unit(joint.direction).multiply(lengthRemaining));
				canvasIO.strokeLine(joint.position.x, joint.position.y, bodyEnd.x, bodyEnd.y);
			}
		}
	}
	displayJoints(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_JOINT_COLOR;
		for(const joint of this.joints) {
			canvasIO.drawArrow(joint.position, 10, joint.direction);
		}
	}
	displayLegs(canvasIO: CanvasIO) {
		for(const leg of this.legs) {
			this.displayLeg(leg, canvasIO);
		}
	}
	displayLeg(leg: LizardLeg, canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = this.color;
		const [point] = this.getPointOnBody(leg.distance);
		canvasIO.strokeLine(point.x, point.y, leg.position.x, leg.position.y);
		canvasIO.fillCircle(leg.position.x, leg.position.y, Lizard.FOOT_SIZE);
	}
	displayHead(canvasIO: CanvasIO) {
		const mouthX = Lizard.HEAD_WIDTH / 2 * (1 + Math.sin(frameCount * 0.5)) / 2;
		canvasIO.ctx.save();
		canvasIO.ctx.translate(this.position.x, this.position.y);
		canvasIO.ctx.rotate(this.headAngle - Math.PI / 2);
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.fillPoly(
			0, Lizard.HEAD_OFFSET,
			-Lizard.HEAD_WIDTH, Lizard.HEAD_HEIGHT + Lizard.HEAD_OFFSET,
			-mouthX, Lizard.HEAD_HEIGHT + Lizard.MOUTH_LENGTH + Lizard.HEAD_OFFSET,
			0, Lizard.HEAD_HEIGHT * 1.5 + Lizard.HEAD_OFFSET,
			mouthX, Lizard.HEAD_HEIGHT + Lizard.MOUTH_LENGTH + Lizard.HEAD_OFFSET,
			Lizard.HEAD_WIDTH, Lizard.HEAD_HEIGHT + Lizard.HEAD_OFFSET,
		);


		canvasIO.ctx.fillStyle = Lizard.EYE_COLOR;
		canvasIO.fillDiamond(0, Lizard.EYE_Y + Lizard.HEAD_OFFSET, Lizard.EYE_SIZE);

		canvasIO.ctx.restore();
	}
	displayBoundingBoxes(canvasIO: CanvasIO) {
		const boundingBoxes = this.boundingBoxes();
		for(const box of boundingBoxes) {
			canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_HITBOX_COLOR;
			canvasIO.strokeRect(box);
		}
	}
	displayLookaheadRectangle(canvasIO: CanvasIO) {
		const rectangle = this.lookaheadRectangle();
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_LOOKAHEAD_COLOR;
		canvasIO.strokeRect(rectangle);
	}

	update(world: World) {
		this.position = this.position.add(Vector.unit(this.direction).multiply(this.speed));
		for(const leg of this.legs) {
			this.updateLeg(leg);
		}

		this.checkForCollisions(world);
		this.updateJoints();
		this.updateHeadAngle();
		this.updateFire(world);
	}
	checkForCollisions(world: World) {
		const lookaheadPoint = this.position.add(Vector.unit(this.direction).multiply(Lizard.LOOKAHEAD_DISTANCE));
		if(this.isObstructed(world, this.direction)) {
			this.joints.unshift({ position: this.position.clone(), direction: this.direction });
			const clockwise = Directions.rotateClockwise(this.direction);
			const counterclockwise = Directions.rotateCounterclockwise(this.direction);
			if(!this.isObstructed(world, clockwise, World.TILE_SIZE) && this.isObstructed(world, counterclockwise, World.TILE_SIZE)) {
				this.direction = clockwise;
			}
			else if(!this.isObstructed(world, counterclockwise, World.TILE_SIZE) && this.isObstructed(world, clockwise, World.TILE_SIZE))  {
				this.direction = counterclockwise;
			}
			else {
				const tileCoordinates = world.getTileCoordinates(lookaheadPoint);
				this.direction = (tileCoordinates.x + tileCoordinates.y) % 2 === 0 ? clockwise : counterclockwise;
			}
			this.targetHeadAngle = Vector.unit(this.direction).angle();
		}
	}
	updateJoints() {
		let length = (this.joints.length === 0) ? 0 : Vector.dist(this.position, this.joints[0].position);
		for(let i = 0; i < this.joints.length; i ++) {
			const joint = this.joints[i];
			const next = this.joints[i + 1];
			if(length > this.length) {
				this.joints.splice(i, 1);
				break;
			}
			if(next) {
				length += Vector.dist(joint.position, next.position);
			}
		}
	}
	updateHeadAngle() {
		const minValue = Utils.minValue(
			[this.headAngle, this.headAngle - 2 * Math.PI, this.headAngle + 2 * Math.PI],
			angle => MathUtils.dist(angle, this.targetHeadAngle)
		);
		this.headAngle = GameUtils.moveTowards(minValue, this.targetHeadAngle, Lizard.HEAD_ROTATION_SPEED);

		this.headAngle = MathUtils.generalizedModulo(this.headAngle, 2 * Math.PI);
		this.targetHeadAngle = MathUtils.generalizedModulo(this.targetHeadAngle, 2 * Math.PI);
	}
	updateLeg(leg: LizardLeg) {
		const [connection] = this.getPointOnBody(leg.distance);
		if(Vector.dist(leg.position, connection) > Lizard.MAX_LEG_DISTANCE) {
			leg.destination = this.getLegDestination(leg);
		}
		const legSpeed = this.speed * Lizard.LEG_SPEED_MULTIPLIER;
		leg.position.x = GameUtils.moveTowards(leg.position.x, leg.destination.x, legSpeed);
		leg.position.y = GameUtils.moveTowards(leg.position.y, leg.destination.y, legSpeed);
	}
	generateFireParticleVelocity() {
		const speed = Lizard.PARTICLE_SPEED + GameUtils.random(-Lizard.PARTICLE_SPEED_VARIANCE, Lizard.PARTICLE_SPEED_VARIANCE);
		const crossSpeed = GameUtils.random(-Lizard.PARTICLE_CROSS_SPEED_VARIANCE, Lizard.PARTICLE_CROSS_SPEED_VARIANCE);
		if(Directions.isHorizontal(this.direction)) {
			return new Vector(
				speed * (this.direction === "left" ? -1 : 1),
				crossSpeed
			);
		}
		else {
			return new Vector(
				crossSpeed,
				speed * (this.direction === "up" ?  -1 : 1)
			);
		}
	}
	generateFireParticle() {
		return new Particle(this.position, this.generateFireParticleVelocity(), Lizard.FIRE_PARTICLES);
	}
	updateFire(world: World) {
		this.fireTimer --;
		if(this.fireTimer > 0) {
			for(let i = 0; i < Lizard.PARTICLES_PER_FRAME; i ++) {
				world.particles.push(this.generateFireParticle());
			}
		}
	}


	getLegDestination(leg: LizardLeg) {
		const [point, direction] = this.getPointOnBody(leg.distance);
		const perpendicular = (leg.side === "left") ? 
			Vector.unit(Directions.rotateCounterclockwise(direction)).multiply(Lizard.LEG_DISTANCE) :
			Vector.unit(Directions.rotateClockwise(direction)).multiply(Lizard.LEG_DISTANCE);
		const paralell = Vector.unit(direction).multiply(Lizard.STEP_SIZE);
		return point.add(perpendicular).add(paralell);
	}
	lookaheadPoint(direction: Direction = this.direction, distance: number = Lizard.LOOKAHEAD_DISTANCE) {
		return this.position.add(Vector.unit(direction).multiply(distance));
	}
	lookaheadRectangle(direction: Direction = this.direction, distance: number = Lizard.LOOKAHEAD_DISTANCE) {
		const point = this.lookaheadPoint(direction, distance);
		if(Directions.isHorizontal(direction)) {
			return new Rectangle(
				point.x, point.y - Lizard.LOOKAHEAD_WIDTH / 2,
				1, Lizard.LOOKAHEAD_WIDTH
			);
		}
		else {
			return new Rectangle(
				point.x - Lizard.LOOKAHEAD_WIDTH / 2, point.y,
				Lizard.LOOKAHEAD_WIDTH, 1
			);
		}
	}
	isObstructed(world: World, direction: Direction = this.direction, distance: number = Lizard.LOOKAHEAD_DISTANCE) {
		const lookaheadRectangle = this.lookaheadRectangle(direction, distance);
		const tiles = world.getTilesAt(lookaheadRectangle);
		if(tiles.some(({ tile }) => (
			tile === "solid" ||
			(tile === "platform" && direction === "down") ||
			(tile instanceof Gate && tile.openness !== 1)
		))) { return true; }
		if(world.creatures.some(lizard => lizard !== this && lizard.boundingBoxes().some(b => b.intersects(lookaheadRectangle)))) {
			return true;
		}
		return false;
	}
	getPointOnBody(distance: number): [Vector, Direction] {
		if(this.joints.length === 0 || distance < Vector.dist(this.position, this.joints[0].position)) {
			return [this.position.subtract(Vector.unit(this.direction).multiply(distance)), this.direction];
		}
		let length = Vector.dist(this.position, this.joints[0].position);
		let lastLength = length;
		for(const [i, joint] of this.joints.entries()) {
			const next = this.joints[i + 1];
			if(next) {
				length += Vector.dist(joint.position, next.position);
			}
			if(length > distance) {
				return [joint.position.subtract(Vector.unit(joint.direction).multiply(distance - lastLength)), joint.direction];
			}
			lastLength = length;
		}
		const last = this.joints[this.joints.length - 1];
		return [last.position.subtract(Vector.unit(last.direction).multiply(distance - length)), last.direction];
	}

	static segmentBoundingBox(point1: Vector, point2: Vector) {
		if(point1.x === point2.x) {
			return Rectangle.fromBounds(
				point1.x - Lizard.HITBOX_WIDTH / 2,
				point1.x + Lizard.HITBOX_WIDTH / 2,
				Math.min(point1.y, point2.y) - Lizard.HITBOX_WIDTH / 2,
				Math.max(point1.y, point2.y) + Lizard.HITBOX_WIDTH / 2
			);
		}
		else {
			return Rectangle.fromBounds(
				Math.min(point1.x, point2.x) - Lizard.HITBOX_WIDTH / 2,
				Math.max(point1.x, point2.x) + Lizard.HITBOX_WIDTH / 2,
				point1.y - Lizard.HITBOX_WIDTH / 2,
				point1.y + Lizard.HITBOX_WIDTH / 2
			);
		}
	}
	boundingBoxes() {
		const [tail] = this.getPointOnBody(this.length);
		const joints = [this.position, ...this.joints.map(j => j.position), tail];
		const boxes = [];
		for(let i = 0; i < joints.length - 1; i ++) {
			boxes.push(Lizard.segmentBoundingBox(joints[i], joints[i + 1]));
		}
		return boxes;
	}

	canSpawn(world: World) {
		return !this.boundingBoxes().some(box => world.isInSolid(box));
	}
}

class LizardLeg {
	side: "right" | "left";
	distance: number;
	position: Vector;
	destination: Vector;

	constructor(side: "right" | "left", distance: number, position: Vector) {
		this.side = side;
		this.distance = distance;
		this.position = position;
		this.destination = this.position;
	}
}
