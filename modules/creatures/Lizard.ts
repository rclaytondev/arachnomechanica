import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../Main.js";
import { World } from "../World.js";

export class Lizard {
	static LOOKAHEAD_DISTANCE = World.TILE_SIZE * 1/2;
	static LEG_SPACING = World.TILE_SIZE * 1/2;
	static LEG_DISTANCE = World.TILE_SIZE * 1/2;
	static STEP_SIZE = World.TILE_SIZE * 1/2;

	direction: Direction;
	position: Vector;
	joints: { position: Vector, direction: Direction }[] = [];
	length: number;
	color: string = "rgb(0, 0, 0)";
	speed: number;
	legs: LizardLeg[];

	constructor(position: Vector, direction: Direction, length: number, speed: number) {
		this.position = position;
		this.direction = direction;
		this.length = length;
		this.speed = speed;

		this.legs = [];
		for(let i = 0; i * Lizard.LEG_SPACING < this.length; i ++) {
			const leftDirection = Directions.rotateCounterclockwise(this.direction);
			const rightDirection = Directions.rotateClockwise(this.direction);
			const jointPosition = this.position.subtract(Vector.unit(this.direction).multiply(Lizard.LEG_SPACING));
			const forwardOffset = Vector.unit(this.direction).multiply(Lizard.STEP_SIZE);
			const leftOffset = Vector.unit(leftDirection).multiply(Lizard.LEG_DISTANCE);
			const rightOffset = Vector.unit(rightDirection).multiply(Lizard.LEG_DISTANCE);
			this.legs.push(new LizardLeg("left", i * Lizard.LEG_SPACING, jointPosition.add(forwardOffset).add(leftOffset)));
			this.legs.push(new LizardLeg("right", i * Lizard.LEG_SPACING, jointPosition.add(forwardOffset).add(rightOffset)));
		}
	}

	display(canvasIO: CanvasIO) {
		this.displayJoints(canvasIO);
		this.displayBody(canvasIO);
	}
	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = this.color;
		const segment1End = (
			this.joints[0]?.position ?? 
			this.position.subtract(Vector.unit(this.direction).multiply(this.length))
		);
		canvasIO.strokeLine(this.position.x, this.position.y, segment1End.x, segment1End.y);
		let length = (this.joints.length === 0) ? 0 : this.position.subtract(this.joints[0].position).magnitude();
		for(const [i, joint] of this.joints.entries()) {
			const next = this.joints[i + 1];
			if(next) {
				length += joint.position.subtract(next.position).magnitude();
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
	displayLegs() {
		for(const leg of this.legs) {
			this.displayLeg(leg);
		}
	}
	displayLeg(leg: LizardLeg) {

	}

	update(world: World) {
		this.position = this.position.add(Vector.unit(this.direction).multiply(this.speed));

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
		}

		let length = (this.joints.length === 0) ? 0 : this.position.subtract(this.joints[0].position).magnitude();
		for(let i = 0; i < this.joints.length; i ++) {
			const joint = this.joints[i];
			const next = this.joints[i + 1];
			if(length > this.length) {
				this.joints.splice(i, 1);
				break;
			}
			if(next) {
				length += joint.position.subtract(next.position).magnitude();
			}
		}
	}
	isObstructed(world: World, direction: Direction = this.direction, distance: number = Lizard.LOOKAHEAD_DISTANCE) {
		const lookaheadPoint = this.position.add(Vector.unit(direction).multiply(distance));
		return world.getTileAt(lookaheadPoint) === "solid";
	}
}

class LizardLeg {
	side: "right" | "left";
	distance: number;
	position: Vector;

	constructor(side: "right" | "left", distance: number, position: Vector) {
		this.side = side;
		this.distance = distance;
		this.position = position;
	}
}
