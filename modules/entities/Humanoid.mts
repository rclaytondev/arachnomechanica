import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
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
	shot: boolean = false;
	
	destination: Vector;
	speed: number = 0;
	angleDestination: number;
	angleSpeed: number = 0;
	armingOffset: Vector;

	constructor(offset: Vector, angle: number, width: number, length: number, rotationPoint: "center" | "base" | "point", armingOffset: Vector) {
		this.offset = offset;
		this.destination = offset.clone();
		this.angle = angle;
		this.width = width;
		this.length = length;
		this.rotationPoint = rotationPoint;
		this.armingOffset = armingOffset;
		this.angleDestination = this.angle;
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

	update() {
		this.offset = GameUtils.moveVectorTowards(this.offset, this.destination, this.speed);
		this.angle = GameUtils.moveAngleTowards(this.angle, this.angleDestination, this.angleSpeed);
	}

	copy() {
		return new HumanoidPart(this.offset.clone(), this.angle, this.width, this.length, this.rotationPoint, this.armingOffset.clone());
	}
	reflect() {
		return new HumanoidPart(this.offset.reflectX(), -this.angle, this.width, this.length, this.rotationPoint, this.armingOffset.reflectX());
	}

	changeRotationPoint(newPoint: "center" | "base" | "point") {
		const offsets = {
			"center": 0,
			"point": this.length / 2,
			"base": -this.length / 2
		};
		const currentOffsetY = offsets[this.rotationPoint];
		const newOffsetY = offsets[newPoint];
		this.offset = this.offset.add(new Vector(0, currentOffsetY - newOffsetY).rotate(MathUtils.toDegrees(this.angle)));
		this.rotationPoint = newPoint;
	}

	beginMoving(newOffset: Vector, newAngle: number, time: number) {
		this.destination = newOffset;
		this.speed = Vector.dist(this.offset, this.destination) / time;
		this.angleDestination = newAngle;
		this.angleSpeed = GameUtils.angleDistance(this.angle, this.angleDestination) / time;
	}
	beginArming(targetAngle: number) {
		this.changeRotationPoint("center");
		this.beginMoving(this.armingOffset, targetAngle, HumanoidData.ARMING_TIME);
	}
}

export class Humanoid {
	mode: "walking" | "waiting" | "arming" | "shooting" | "reforming" = "walking";
	direction: "left" | "right" = "left";
	physicsObject: PhysicsObject;
	legDirection: "out" | "in" = "out";
	timer: number = 0;
	
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
		this.timer ++;

		if(this.mode === "arming" || this.mode === "shooting" || this.mode === "reforming") {
			for(const part of this.parts) {
				part.update();
			}
		}

		if(this.mode === "walking") {
			this.walk(world);
		}
		else if(this.mode === "arming" && this.timer > HumanoidData.ARMING_TIME + HumanoidData.DELAY_AFTER_ARMING) {
			this.enterMode("shooting");
		}
		else if(this.mode === "shooting" && this.timer > HumanoidData.DELAY_AFTER_SHOT) {
			this.shoot();
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

		if(world.hasLineOfSight(this.physicsObject.hitbox().center(), world.player.physicsObject.hitbox())) {
			this.beginArming(world);
		}
	}
	beginArming(world: World) {
		const angle = Math.PI / 2 + world.player.physicsObject.hitbox().center().subtract(this.physicsObject.hitbox().center()).angle();
		for(const part of this.parts) {
			part.beginArming(angle);
		}
		this.enterMode("arming");
	}
	shoot() {
		const remaining = this.parts.filter(p => !p.shot);
		if(remaining.length === 0) {
			return;
		}
		const part = Utils.randomItem(remaining);
		part.shot = true;
		part.destination = part.destination.add(new Vector(HumanoidData.MAX_SHOT_DISTANCE, 0).rotate(-90 + MathUtils.toDegrees(part.angle)));
		part.speed = HumanoidData.PROJECTILE_SPEED;
		this.timer = 0;
	}

	get parts() {
		return [this.head, this.body, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg];
	}
	enterMode(mode: "walking" | "waiting" | "arming" | "shooting" | "reforming") {
		this.mode = mode;
		this.timer = 0;
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
