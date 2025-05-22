import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { HumanoidData, PlayerData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { World } from "../World";

class RotationalMotion {
	center: () => Vector;
	angularVelocity: number;
	parts: HumanoidPart[];
	timeLeft: number;
	age: number;

	constructor(center: () => Vector, angularVelocity: number, parts: HumanoidPart[], duration: number) {
		this.center = center;
		this.angularVelocity = angularVelocity;
		this.parts = parts;
		this.timeLeft = duration;
		this.age = 0;
	}

	apply(part: HumanoidPart, center: Vector) {
		const position = part.physicsObject.centerFloat();
		const newPosition = position.subtract(center).rotate(MathUtils.toDegrees(this.angularVelocity)).add(center);
		part.physicsObject.setCenter(newPosition);
		part.angle += this.angularVelocity;
	}
	update() {
		this.timeLeft --;
		this.age ++;
		if(this.timeLeft > 0) {
			const center = this.center();
			for(const part of this.parts) {
				this.apply(part, center);
			}
		}
	}

	reverse() {
		return new RotationalMotion(
			() => this.center(),
			-this.angularVelocity,
			this.parts,
			this.age
		);
	}
}

export class HumanoidPart {
	physicsObject: PhysicsObject;
	angle: number;
	width: number;
	length: number;

	constructor(position: Vector, angle: number, width: number, length: number) {
		this.physicsObject = new PhysicsObject(
			position.subtract(1, 1),
			new Rectangle(0, 0, 2, 2)
		);
		this.angle = angle;
		this.width = width;
		this.length = length;
	}

	display(humanoid: Humanoid, canvasIO: CanvasIO) {
		const position = this.physicsObject.hitbox().center();
		canvasIO.ctx.save();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate(this.angle);
		canvasIO.ctx.fillStyle = HumanoidData.COLOR;
		canvasIO.fillPoly(
			-this.width / 2, this.length,
			0, 0,
			this.width / 2, this.length
		);
		canvasIO.ctx.restore();
	}

	tangentVector() {
		/* Returns the vector pointing in the direction the pointy end is facing. */
		return new Vector(1, 0).rotate(-90 + MathUtils.toDegrees(this.angle));
	}
	base() {
		return this.physicsObject.centerFloat().subtract(this.tangentVector().multiply(this.length));
	}
	center() {
		return this.physicsObject.centerFloat().subtract(this.tangentVector().multiply(this.length / 2));
	}
	tip() {
		return this.physicsObject.centerFloat();
	}

	copy() {
		return new HumanoidPart(
			this.physicsObject.hitbox().center(),
			this.angle, this.width, this.length
		);
	}
	reflect() {
		return new HumanoidPart(
			this.physicsObject.hitbox().center().reflectX(),
			-this.angle, this.width, this.length
		);
	}
	translate(amount: Vector) {
		return new HumanoidPart(
			this.physicsObject.hitbox().center().add(amount),
			this.angle, this.width, this.length
		);
	}
}

export class Humanoid {
	mode: "walking" | "waiting" | "arming" | "shooting" | "reforming" = "walking";
	direction: "left" | "right" = "right";
	physicsObject: PhysicsObject;
	walkingMode: "lift" | "step-down" | "step-together" = "lift";
	timer: number = 0;
	backwards: boolean = false;
	
	head: HumanoidPart;
	body: HumanoidPart;
	leftArm: HumanoidPart;
	rightArm: HumanoidPart;
	leftLeg: HumanoidPart;
	rightLeg: HumanoidPart;

	motions: RotationalMotion[] = [];

	constructor(position: Vector) {
		this.physicsObject = new PhysicsObject(position, new Rectangle(0, 0, HumanoidData.HITBOX_WIDTH, HumanoidData.HITBOX_HEIGHT));
		
		const center = this.physicsObject.hitbox().center();
		this.head = HumanoidData.HEAD.translate(center);
		this.body = HumanoidData.BODY.translate(center);
		this.leftArm = HumanoidData.LEFT_ARM.translate(center);
		this.rightArm = HumanoidData.LEFT_ARM.reflect().translate(center);
		this.leftLeg = HumanoidData.LEFT_LEG.translate(center);
		this.rightLeg = HumanoidData.LEFT_LEG.reflect().translate(center);

		this.motions = this.liftLegForStep(this.direction);
	}

	update(world: World) {
		this.physicsObject.applyGravity(PlayerData.GRAVITY);
		this.physicsObject.moveY(this.physicsObject.velocity.y, () => { this.physicsObject.velocity.y = 0; }, world);
		this.timer ++;

		for(const motion of this.motions) {
			motion.update();
		}
		for(const part of this.parts) {
			part.physicsObject.moveY(this.physicsObject.velocity.y, () => {}, world);
		}

		if(this.mode === "walking") {
			this.walk(world);
		}
		else if(this.mode === "arming" && this.timer > HumanoidData.ARMING_TIME + HumanoidData.DELAY_AFTER_ARMING) {
			this.enterMode("shooting");
		}
	}
	walk(world: World) {
		this.physicsObject.moveX(
			this.body.center().x - this.physicsObject.hitbox().center().x,
			(direction: Direction) => {
				this.turnAround();
			},
			world
		);
		if(!this.backwards && this.motions.every(m => m.timeLeft <= 0)) {
			if(this.walkingMode === "lift") {
				this.motions = this.stepDown(this.direction);
				this.walkingMode = "step-down";
			}
			else if(this.walkingMode ===  "step-down") {
				this.motions = this.stepTogether(this.direction);
				this.walkingMode = "step-together";
			}
			else {
				this.reset();
			}
		}
		else if(this.backwards && this.motions.every(m => m.timeLeft <= 0)) {
			if(this.walkingMode === "lift") {
				this.backwards = false;
				this.reset();
			}
			else if(this.walkingMode === "step-down") {
				/* finished doing a backwards step-down --> foot is in the air --> do a backwards lift */
				const [motion] = this.liftLegForStep(this.direction).map(m => m.reverse());
				motion.timeLeft = HumanoidData.WALK_PHASE_1_DURATION;
				this.motions = [motion];
				this.direction = (this.direction === "left") ? "right" : "left";
				this.walkingMode = "step-together";
				this.backwards = false;
			}
			else if(this.walkingMode === "step-together") {
				this.direction = (this.direction === "left") ? "right" : "left";
				this.motions = this.stepTogether(this.direction);
				this.walkingMode = "step-together";
				this.backwards = false;
			}
		}
	}
	turnAround() {
		if(!this.backwards) {
			this.backwards = true;
			this.motions = this.motions.map(m => m.reverse());
		}
	}

	get parts() {
		return [this.head, this.body, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg];
	}
	enterMode(mode: "walking" | "waiting" | "arming" | "shooting" | "reforming") {
		this.mode = mode;
		this.timer = 0;
	}
	getLeg(direction: "left" | "right") {
		return (direction === "left") ? this.leftLeg : this.rightLeg;
	}

	reset() {
		const humanoid = new Humanoid(this.physicsObject.positionInt);
		this.head = humanoid.head;
		this.body = humanoid.body;
		this.leftArm = humanoid.leftArm;
		this.rightArm = humanoid.rightArm;
		this.leftLeg = humanoid.leftLeg;
		this.rightLeg = humanoid.rightLeg;
		this.motions = this.liftLegForStep(this.direction);
		this.walkingMode = "lift";
	}

	display(canvasIO: CanvasIO) {
		for(const part of this.parts) {
			part.display(this, canvasIO);
		}
	}

	displayHitbox(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.HUMANOID_HITBOX_COLOR;
		canvasIO.strokeRect(this.physicsObject.hitbox());
	}

	liftLegForStep(direction: "left" | "right") {
		const opposite = (direction === "left") ? "right" : "left";
		const angleMultiplier = (direction === "right") ? 1 : -1;
		return [
			new RotationalMotion(
				/* lift leg to take a step */
				() => this.getLeg(direction).tip(),
				-HumanoidData.LEG_LIFT_AMOUNT  / HumanoidData.WALK_PHASE_1_DURATION * angleMultiplier,
				[this.getLeg(direction)],
				HumanoidData.WALK_PHASE_1_DURATION
			),
		];
	}
	stepDown(direction: "left" | "right") {
		const opposite = (direction === "left") ? "right" : "left";
		const angleMultiplier = (direction === "right") ? 1 : -1;
		return [
			new RotationalMotion(
				/* rotate about back foot to step onto the ground */
				() => this.getLeg(opposite).base(),
				HumanoidData.LEG_LIFT_AMOUNT / HumanoidData.WALK_PHASE_2_DURATION * angleMultiplier,
				this.parts,
				HumanoidData.WALK_PHASE_2_DURATION
			),
			new RotationalMotion(
				/* keep upper body vertical */
				() => this.getLeg(opposite).tip(),
				-HumanoidData.LEG_LIFT_AMOUNT / HumanoidData.WALK_PHASE_2_DURATION * angleMultiplier,
				[this.getLeg(direction), this.body, this.leftArm, this.rightArm, this.head],
				HumanoidData.WALK_PHASE_2_DURATION
			)
		]
	}
	stepTogether(direction: "left" | "right") {
		const opposite = (direction === "left") ? "right" : "left";
		const angleMultiplier = (direction === "right") ? 1 : -1;
		return [
			new RotationalMotion(
				/* rotate about the front foot to bring the body forward */
				() => this.getLeg(direction).base(),
				HumanoidData.LEG_LIFT_AMOUNT / HumanoidData.WALK_PHASE_3_DURATION * angleMultiplier,
				this.parts,
				HumanoidData.WALK_PHASE_3_DURATION
			),
			new RotationalMotion(
				/* keep the body vertical while moving */
				() => this.getLeg(direction).tip(),
				-HumanoidData.LEG_LIFT_AMOUNT / HumanoidData.WALK_PHASE_3_DURATION * angleMultiplier,
				[this.body, this.getLeg(opposite), this.leftArm, this.rightArm, this.head],
				HumanoidData.WALK_PHASE_3_DURATION
			),
			new RotationalMotion(
				/* bring the back leg forward */
				() => this.getLeg(opposite).tip(),
				-HumanoidData.LEG_LIFT_AMOUNT / HumanoidData.WALK_PHASE_3_DURATION * angleMultiplier,
				[this.getLeg(opposite)],
				HumanoidData.WALK_PHASE_3_DURATION
			),
		];
	}
}
