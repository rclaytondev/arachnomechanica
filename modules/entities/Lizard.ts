import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { World } from "../world/World.js";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { LizardData, WorldData } from "../constants/GameData.mjs";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { SpikeballBlock } from "../tiles/SpikeballBlock.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";
import { FireSpawner } from "../game-utilities/FireSpawner.mjs";
import { Entity } from "../game-utilities/Entity.mjs";

type Joint = { position: Vector, direction: Direction };

export class Lizard extends Entity {
	direction: Direction;
	position: Vector;
	joints: Joint[] = [];
	length: number;
	color: string = "rgb(0, 0, 0)";
	speed: number;
	headAngle: number;
	targetHeadAngle: number;
	nextTurn: Direction | null = null;
	legPosition: number = 0;
	legDestination: number = LizardData.LEG_MAX;
	mouthAngle: number = 0;
	mouthDestination: number = LizardData.MAX_MOUTH_ANGLE;
	waitingTimer: number = -1;
	fireSpawner: FireSpawner;

	constructor(position: Vector, direction: Direction, length: number, speed: number) {
		super();
		this.position = position;
		this.direction = direction;
		this.headAngle = Vector.unit(this.direction).angle();
		this.targetHeadAngle = this.headAngle;
		this.length = length;
		this.speed = speed;
		this.fireSpawner = new FireSpawner(position, direction, LizardData.FIRE);
	}

	display(canvasIO: CanvasIO) {
		this.displayJoints(canvasIO);
		this.displayBody(canvasIO);
		this.displayLegs(canvasIO);
		this.displayHead(canvasIO);
		this.displayLookaheadRectangle(canvasIO);
	}
	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = this.color;
		canvasIO.ctx.lineWidth = LizardData.BODY_WIDTH;
		canvasIO.linePointedness = LizardData.BODY_POINTEDNESS;
		canvasIO.ctx.lineCap = "round";
		const joints = [this.position, ...this.joints.map(j => j.position), this.getPointOnBody(this.length)[0]];
		for(let i = 0; i < joints.length - 1; i ++) {
			const [joint, next] = [joints[i], joints[i+1]];
			if(i === joints.length - 2) {
				canvasIO.halfPointedLine(joint.x, joint.y, next.x, next.y);
			}
			else {
				canvasIO.strokeLine(joint.x, joint.y, next.x, next.y);
			}
		}
	}
	displayJoints(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_JOINT_COLOR;
		for(const joint of this.joints) {
			canvasIO.drawArrow(joint.position, 10, joint.direction);
		}
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		this.transformToHead(canvasIO);
		GameUtils.glowCircle(0, LizardData.EYE_Y + LizardData.HEAD_OFFSET, LizardData.LIGHT_SIZE, LizardData.LIGHT_INTENSITY, canvasIO);
		canvasIO.ctx.restore();
	}
	getLegAngle(distance: number) {
		const [, , jointBefore, jointAfter, distanceBefore, distanceAfter] = this.getPointOnBody(distance);
		const directionBefore = (jointBefore === "head") ? this.direction : jointBefore.direction;
		const angleBefore = Directions.angle[directionBefore];
		if(distance < distanceBefore + LizardData.LEG_ROTATION_START && jointBefore !=="head") {
			const index = this.joints.indexOf(jointBefore);
			const previousDirection = this.joints[index - 1]?.direction ?? this.direction;
			return GameUtils.lerpAngle(
				distance,
				distanceBefore,
				distanceBefore + LizardData.LEG_ROTATION_START,
				GameUtils.diagonalAngle(directionBefore, previousDirection),
				angleBefore,
			);
		}
		else if(distance > distanceAfter - LizardData.LEG_ROTATION_END && jointAfter !== "tail") {
			return GameUtils.lerpAngle(
				distance,
				distanceAfter - LizardData.LEG_ROTATION_END,
				distanceAfter,
				angleBefore,
				GameUtils.diagonalAngle(directionBefore, jointAfter.direction),
			);
		}
		else {
			return angleBefore;
		}
	}
	displayLegs(canvasIO: CanvasIO) {
		canvasIO.linePointedness = LizardData.LEG_POINTEDNESS;
		canvasIO.ctx.lineWidth = LizardData.LEG_WIDTH;
		for(let i = 1; i * LizardData.LEG_SPACING < this.length; i ++) {
			const multiplier = (i % 2 === 0) ? 1 : -1;
			const [position] = this.getPointOnBody(i * LizardData.LEG_SPACING);
			const tangentAngle = this.getLegAngle(i * LizardData.LEG_SPACING);
			const tangentVector = new Vector(Math.cos(tangentAngle), -Math.sin(tangentAngle));
			const normalVector = new Vector(-tangentVector.y, tangentVector.x);

			const knee1 = position.add(normalVector.multiply(LizardData.LEG_DISTANCE).add(tangentVector.multiply(this.legPosition * multiplier)));
			const knee2 = position.add(normalVector.multiply(-LizardData.LEG_DISTANCE).add(tangentVector.multiply(-this.legPosition * multiplier)));
			canvasIO.strokeLine(position.x, position.y, knee1.x, knee1.y);
			canvasIO.strokeLine(position.x, position.y, knee2.x, knee2.y);

			const foot1 = knee1.add(tangentVector.multiply(LizardData.LOWER_LEG_LENGTH));
			const foot2 = knee2.add(tangentVector.multiply(LizardData.LOWER_LEG_LENGTH));
			canvasIO.halfPointedLine(knee1.x, knee1.y, foot1.x, foot1.y);
			canvasIO.halfPointedLine(knee2.x, knee2.y, foot2.x, foot2.y);
		}
	}
	transformToHead(canvasIO: CanvasIO) {
		canvasIO.ctx.translate(this.position.x, this.position.y);
		canvasIO.ctx.rotate(this.headAngle - Math.PI / 2);
	}
	displayHead(canvasIO: CanvasIO) {
		const mouthEnd = new Vector(0, LizardData.HEAD_HEIGHT + LizardData.MOUTH_LENGTH + LizardData.HEAD_OFFSET).rotate(-this.mouthAngle);
		canvasIO.ctx.save();
		this.transformToHead(canvasIO);
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.fillPoly(
			0, LizardData.HEAD_OFFSET,
			-LizardData.HEAD_WIDTH, LizardData.HEAD_HEIGHT + LizardData.HEAD_OFFSET,
			-mouthEnd.x, mouthEnd.y,
			0, LizardData.HEAD_HEIGHT * 1.5 + LizardData.HEAD_OFFSET,
			mouthEnd.x, mouthEnd.y,
			LizardData.HEAD_WIDTH, LizardData.HEAD_HEIGHT + LizardData.HEAD_OFFSET,
		);


		canvasIO.ctx.fillStyle = LizardData.EYE_COLOR;
		canvasIO.fillDiamond(0, LizardData.EYE_Y + LizardData.HEAD_OFFSET, LizardData.EYE_SIZE);

		canvasIO.ctx.restore();
	}
	displayDebug(canvasIO: CanvasIO) {
		const hitboxes = this.hitboxes();
		for(const box of hitboxes) {
			canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_HITBOX_COLOR;
			canvasIO.strokeRect(box);
		}

		const hurtbox = this.fireSpawner.hurtbox();
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_HURTBOX_COLOR;
		canvasIO.strokeRect(hurtbox);
	}
	displayLookaheadRectangle(canvasIO: CanvasIO) {
		const rectangle = this.lookaheadRectangle();
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_LOOKAHEAD_COLOR;
		canvasIO.strokeRect(rectangle);
	}

	update(world: World, canvasIO: CanvasIO) {
		if(this.waitingTimer < 0) {
			this.position = this.position.add(Vector.unit(this.direction).multiply(this.speed));
			world.entities.moveEntity(this);
		}
		this.waitingTimer --;

		this.updateLegs();
		this.updateMouth();
		this.checkForPlayer(world);
		this.checkForCollisions(world);
		this.updateJoints();
		this.updateHeadAngle();
		this.updateFire(world, canvasIO);
		this.fireSpawner.updateHurtbox(world, canvasIO);
	}
	updateLegs() {
		if(this.waitingTimer < 0) {
			this.legPosition = GameUtils.moveTowards(this.legPosition, this.legDestination, this.speed * LizardData.LEG_SPEED_MULTIPLIER);
		}
		if(this.legPosition >= LizardData.LEG_MAX) {
			this.legDestination = LizardData.LEG_MIN;
		}
		else if(this.legPosition <= LizardData.LEG_MIN) {
			this.legDestination = LizardData.LEG_MAX;
		}
	}
	updateMouth() {
		if(this.waitingTimer < 0) {
			this.mouthAngle = GameUtils.moveTowards(
				this.mouthAngle, this.mouthDestination,
				(this.mouthAngle < this.mouthDestination) ? LizardData.MOUTH_SPEED_OPENING : LizardData.MOUTH_SPEED_CLOSING,
			);
		}
		if(this.mouthAngle <= 0) { this.mouthDestination = LizardData.MAX_MOUTH_ANGLE; }
		if(this.mouthAngle >= LizardData.MAX_MOUTH_ANGLE) { this.mouthDestination = 0; }
		if(this.fireSpawner.timeLeft > 0) {
			this.mouthDestination = LizardData.FIRE_MOUTH_OPENNESS;
		}
	}
	checkForCollisions(world: World) {
		const lookaheadPoint = this.position.add(Vector.unit(this.direction).multiply(LizardData.LOOKAHEAD_DISTANCE));
		if(this.isObstructed(world, this.direction) && this.waitingTimer < 0) {
			const clockwise = Directions.rotateClockwise[this.direction];
			const counterclockwise = Directions.rotateCounterclockwise[this.direction];
			const obstructedCounterclockwise = this.isObstructed(world, counterclockwise, WorldData.TILE_SIZE);
			const obstructedClockwise = this.isObstructed(world, clockwise, WorldData.TILE_SIZE);
			if(obstructedClockwise && obstructedCounterclockwise) {
				this.fireSpawner.startFire(LizardData.FIRE_DURATION);
			}
			else if(!obstructedClockwise && obstructedCounterclockwise) {
				this.turn(clockwise);
			}
			else if(!obstructedCounterclockwise && obstructedClockwise) {
				this.turn(counterclockwise);
			}
			else {
				const tileCoordinates = world.getTileCoordinates(lookaheadPoint);
				this.turn((tileCoordinates.x + tileCoordinates.y) % 2 === 0 ? clockwise : counterclockwise);
			}
		}
	}
	turn(direction: Direction) {
		if(direction !== this.direction) {
			this.nextTurn = null;
			this.waitingTimer = -1;
			this.joints.unshift({ position: this.position.clone(), direction: this.direction });
			this.direction = direction;
			this.targetHeadAngle = Vector.unit(this.direction).angle();
			this.fireSpawner.stopFire();
		}
	}
	attemptTurn(direction: Direction, world: World) {
		if(!this.isObstructed(world, direction)) {
			this.turn(direction);
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
			angle => MathUtils.dist(angle, this.targetHeadAngle),
		);
		this.headAngle = GameUtils.moveTowards(minValue, this.targetHeadAngle, LizardData.HEAD_ROTATION_SPEED);

		this.headAngle = MathUtils.generalizedModulo(this.headAngle, 2 * Math.PI);
		this.targetHeadAngle = MathUtils.generalizedModulo(this.targetHeadAngle, 2 * Math.PI);
	}
	updateFire(world: World, canvasIO: CanvasIO) {
		this.fireSpawner.position = this.position;
		this.fireSpawner.direction = this.direction;
		this.fireSpawner.update(world, canvasIO);
	}
	checkForPlayer(world: World) {
		this.checkForPlayerFire(world);
		this.checkForPlayerTurns(world);
	}
	checkForPlayerFire(world: World) {
		const hurtbox = this.fireSpawner.hurtbox(this.fireSpawner.maxHurtboxSize);
		if(!world.player.dead && world.player.hitbox.intersects(hurtbox)) {
			this.fireSpawner.startFire(LizardData.FIRE_DURATION);
		}
	}
	checkForPlayerTurns(world: World) {
		if(world.player.dead) { return; }
		const player = world.player.hitbox;
		const xDirection = player.center().x < this.position.x ? "left" : "right";
		const yDirection = player.center().y < this.position.y ? "up" : "down";
		const lookaheadPoint = this.lookaheadPoint();
		let nextTurn: Direction | null = null;
		if(
			player.bottom() > this.position.y - LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			player.top() < this.position.y + LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			!this.isObstructed(
				world, xDirection, LizardData.LOOKAHEAD_DISTANCE,
				Math.min(MathUtils.dist(lookaheadPoint.x, player.left()), MathUtils.dist(lookaheadPoint.x, player.right())),
			)
		) { nextTurn = xDirection; }
		else if(
			player.right() > this.position.x - LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			player.left() < this.position.x + LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			!this.isObstructed(
				world, yDirection, LizardData.LOOKAHEAD_DISTANCE,
				Math.min(MathUtils.dist(lookaheadPoint.y, player.top()), MathUtils.dist(lookaheadPoint.y, player.bottom())),
			)
		) { nextTurn = yDirection; }
		if(nextTurn !== null && nextTurn !== Directions.opposite[this.direction]) {
			this.nextTurn = nextTurn;
		}

		const canTurn = (Directions.isHorizontal(this.direction)
			? MathUtils.dist(MathUtils.generalizedModulo(this.position.x, WorldData.TILE_SIZE), WorldData.TILE_SIZE / 2) < this.speed
			: MathUtils.dist(MathUtils.generalizedModulo(this.position.y, WorldData.TILE_SIZE), WorldData.TILE_SIZE / 2) < this.speed
		);
		if(this.nextTurn !== null && canTurn && this.waitingTimer < 0 && this.nextTurn !== this.direction) {
			this.waitingTimer = LizardData.TURN_DELAY;
		}
		if(this.waitingTimer === 0 && this.nextTurn) {
			this.attemptTurn(this.nextTurn, world);
			this.nextTurn = null;
		}
	}

	lengthAfterDamage(rectangle: Rectangle) {
		let distance = 0;
		const joints = [this.position, ...this.joints.map(p => p.position), this.getPointOnBody(this.length)[0]];
		for(let i = 0; i < joints.length - 1; i ++) {
			const joint = joints[i];
			const next = joints[i + 1];
			if(
				joint.y === next.y &&
				rectangle.intersects(Rectangle.fromBounds(joint.x, next.x, joint.y, joint.y))
			) {
				return distance + ((joint.x > next.x) ? joint.x - rectangle.right() : rectangle.left() - joint.x);
			}
			if(
				joint.x === next.x &&
				rectangle.intersects(Rectangle.fromBounds(joint.x, joint.x, joint.y, next.y))
			) {
				return distance + ((joint.y > next.y) ? joint.y - rectangle.bottom() : rectangle.top() - joint.y);
			}
			distance += Vector.dist(joint, next);
		}
		return this.length;
	}
	roundedLengthAfterDamage(rectangle: Rectangle) {
		const length = this.lengthAfterDamage(rectangle);
		return (Math.floor(length / WorldData.TILE_SIZE - 1/2) + 1/2) * WorldData.TILE_SIZE;
	}
	damage(rectangle: Rectangle, world: World) {
		const length = this.roundedLengthAfterDamage(rectangle);;
		this.roundedLengthAfterDamage(rectangle);
		if(length < (LizardData.MIN_LENGTH + 1/2) * WorldData.TILE_SIZE) {
			world.entities.removeEntity(this);
		}
		else {
			this.length = length;
		}
	}


	lookaheadPoint(direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE) {
		return this.position.add(Vector.unit(direction).multiply(distance));
	}
	lookaheadRectangle(direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE, length: number = 1) {
		const point = this.lookaheadPoint(direction, distance);
		if(Directions.isHorizontal(direction)) {
			return new Rectangle(
				point.x - (direction === "left" ? length : 0), point.y - LizardData.LOOKAHEAD_WIDTH / 2,
				length, LizardData.LOOKAHEAD_WIDTH,
			);
		}
		else {
			return new Rectangle(
				point.x - LizardData.LOOKAHEAD_WIDTH / 2, point.y - (direction === "up" ? length : 0),
				LizardData.LOOKAHEAD_WIDTH, length,
			);
		}
	}
	isObstructed(world: World, direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE, length: number = 1) {
		const lookaheadRectangle = this.lookaheadRectangle(direction, distance, length);
		for(const { tile } of world.getTilesAt(lookaheadRectangle)) {
			if(
				(tile instanceof SolidTile && tile.shape === "solid") ||
				(tile === "platform" && direction === "down") ||
				(tile instanceof Gate && tile.openness !== 1) ||
				(tile instanceof LaserBlock || tile instanceof SpikeballBlock) ||
				World.isSlopeTile(tile)
			) { return true; }
		}
		const entities = [...world.entities.entitiesIntersecting(lookaheadRectangle)];
		if(entities.some(entity => entity.hitboxes().some(b => b.intersects(lookaheadRectangle)))) {
			return true;
		}
		return false;
	}
	getPointOnBody(distance: number): [Vector, Direction, Joint | "head", Joint | "tail", number, number] {
		if(this.joints.length === 0 || distance < Vector.dist(this.position, this.joints[0].position)) {
			return [
				this.position.subtract(Vector.unit(this.direction).multiply(distance)),
				this.direction,
				"head",
				this.joints[0] ?? "tail",
				0,
				this.joints.length === 0 ? this.length : Vector.dist(this.position, this.joints[0].position),
			];
		}
		let length = Vector.dist(this.position, this.joints[0].position);
		let lastLength = length;
		for(const [i, joint] of this.joints.entries()) {
			const next = this.joints[i + 1];
			if(next) {
				length += Vector.dist(joint.position, next.position);
			}
			if(length > distance) {
				return [
					joint.position.subtract(Vector.unit(joint.direction).multiply(distance - lastLength)),
					joint.direction,
					joint,
					next,
					lastLength,
					length,
				];
			}
			lastLength = length;
		}
		const last = this.joints[this.joints.length - 1];
		return [
			last.position.subtract(Vector.unit(last.direction).multiply(distance - length)),
			last.direction,
			last,
			"tail",
			length,
			this.length,
		];
	}

	static segmentHitbox(point1: Vector, point2: Vector) {
		if(point1.x === point2.x) {
			return Rectangle.fromBounds(
				point1.x - LizardData.HITBOX_WIDTH / 2,
				point1.x + LizardData.HITBOX_WIDTH / 2,
				Math.min(point1.y, point2.y) - LizardData.HITBOX_WIDTH / 2,
				Math.max(point1.y, point2.y) + LizardData.HITBOX_WIDTH / 2,
			);
		}
		else {
			return Rectangle.fromBounds(
				Math.min(point1.x, point2.x) - LizardData.HITBOX_WIDTH / 2,
				Math.max(point1.x, point2.x) + LizardData.HITBOX_WIDTH / 2,
				point1.y - LizardData.HITBOX_WIDTH / 2,
				point1.y + LizardData.HITBOX_WIDTH / 2,
			);
		}
	}
	hitboxes() {
		const [tail] = this.getPointOnBody(this.length);
		const joints = [this.position, ...this.joints.map(j => j.position), tail];
		const boxes = [];
		for(let i = 0; i < joints.length - 1; i ++) {
			boxes.push(Lizard.segmentHitbox(joints[i], joints[i + 1]));
		}
		return boxes;
	}

	canSpawn(world: World) {
		const distance = Vector.dist(this.position, world.player.hitbox.center());
		return (
			distance > LizardData.MIN_PLAYER_SPAWN_DISTANCE &&
			!this.hitboxes().some(box => world.isInSolid(box))
		);
	}

	boundingBox() {
		const [tail] = this.getPointOnBody(this.length);
		const joints = this.joints.map(j => j.position);
		return Rectangle.boundingBox([this.position, ...joints, tail]);
	}
	translate(amount: Vector) {
		for(const joint of this.joints) {
			joint.position = joint.position.add(amount);
		}
	}
}
