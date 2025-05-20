import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { HumanoidData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";

export class HumanoidPart {
	offset: Vector;
	angle: number;
	width: number;
	length: number;
	rotationPoint: "center" | "base" | "point";

	constructor(offset: Vector, angle: number, width: number, length: number, rotationPoint: "center" | "base" | "point") {
		this.offset = offset;
		this.angle = angle;
		this.width = width;
		this.length = length;
		this.rotationPoint = rotationPoint;
	}

	display(humanoid: Humanoid, canvasIO: CanvasIO) {
		const position = humanoid.physicsObject.hitbox().center();
		const offsetY = {
			"center": 0,
			"point": this.length / 2,
			"base": -this.length / 2
		}[this.rotationPoint];

		canvasIO.ctx.save();
		canvasIO.ctx.translate(position.x + this.offset.x, position.y + this.offset.y);
		canvasIO.ctx.rotate(this.angle);
		canvasIO.ctx.fillStyle = HumanoidData.COLOR;
		canvasIO.fillPoly(
			-this.width / 2, this.length / 2 + offsetY,
			0, -this.length / 2 + offsetY,
			this.width / 2, this.length / 2 + offsetY
		);
		canvasIO.ctx.restore();
	}

	copy() {
		return new HumanoidPart(this.offset.clone(), this.angle, this.width, this.length, this.rotationPoint);
	}
	reflect() {
		return new HumanoidPart(new Vector(-this.offset.x, this.offset.y), -this.angle, this.width, this.length, this.rotationPoint);
	}
}

export class Humanoid {
	mode: "walking" | "waiting" | "arming" | "shooting" | "reforming" = "walking";
	physicsObject: PhysicsObject;
	
	head: HumanoidPart = HumanoidData.HEAD.copy();
	body: HumanoidPart = HumanoidData.BODY.copy();
	leftArm: HumanoidPart = HumanoidData.LEFT_ARM.copy();
	rightArm: HumanoidPart = HumanoidData.LEFT_ARM.reflect();
	leftLeg: HumanoidPart = HumanoidData.LEFT_LEG.copy();
	rightLeg: HumanoidPart = HumanoidData.LEFT_LEG.reflect();

	constructor(position: Vector) {
		this.physicsObject = new PhysicsObject(position, new Rectangle(0, 0, HumanoidData.HITBOX_WIDTH, HumanoidData.HITBOX_HEIGHT));
	}

	update() {

	}

	get parts() {
		return [this.head, this.body, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg];
	}

	display(canvasIO: CanvasIO) {
		for(const part of this.parts) {
			part.display(this, canvasIO);
		}
		this.displayHitbox(canvasIO);
	}

	displayHitbox(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HUMANOID_HITBOX_COLOR;
		canvasIO.strokeRect(this.physicsObject.hitbox());
	}
}
