import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { HumanoidData, PlayerData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { World } from "../World";

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
	direction: "left" | "right" = "left";
	physicsObject: PhysicsObject;
	legDirection: "out" | "in" = "out";
	
	head: HumanoidPart = HumanoidData.HEAD.copy();
	body: HumanoidPart = HumanoidData.BODY.copy();
	leftArm: HumanoidPart = HumanoidData.LEFT_ARM.copy();
	rightArm: HumanoidPart = HumanoidData.LEFT_ARM.reflect();
	leftLeg: HumanoidPart = HumanoidData.LEFT_LEG.copy();
	rightLeg: HumanoidPart = HumanoidData.LEFT_LEG.reflect();

	constructor(position: Vector) {
		this.physicsObject = new PhysicsObject(position, new Rectangle(0, 0, HumanoidData.HITBOX_WIDTH, HumanoidData.HITBOX_HEIGHT));
	}

	update(world: World) {
		this.physicsObject.applyGravity(PlayerData.GRAVITY);
		this.physicsObject.moveY(this.physicsObject.velocity.y, () => { this.physicsObject.velocity.y = 0; }, world);

		if(this.mode === "walking") {
			this.walk(world);
		}
	}
	walk(world: World) {
		if(!this.physicsObject.canMove("down", world)) {
			this.physicsObject.moveX(
				HumanoidData.WALKING_SPEED * (this.direction === "left" ? -1 : 1),
				() => { this.direction = (this.direction === "left") ? "right" : "left"; },
				world
			);
		}

		this.leftLeg.angle = GameUtils.moveTowards(
			this.leftLeg.angle,
			(this.legDirection === "out") ? HumanoidData.WALKING_LEG_ANGLE_MAX : HumanoidData.WALKING_LEG_ANGLE_MIN,
			HumanoidData.WALKING_LEG_SPEED
		);
		this.rightLeg.angle = -this.leftLeg.angle;

		if(this.leftLeg.angle >= HumanoidData.WALKING_LEG_ANGLE_MAX) {
			this.legDirection = "in";
		}
		else if(this.leftLeg.angle <= HumanoidData.WALKING_LEG_ANGLE_MIN) {
			this.legDirection = "out";
		}
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
