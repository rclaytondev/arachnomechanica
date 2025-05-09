import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { Tile, World } from "../World.js";
import { frameCount } from "../Main.js";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { Particle, ParticleSettings } from "../Particle.mjs";
import { LizardData, WorldData } from "../constants/GameData.mjs";

type Joint = { position: Vector, direction: Direction };

export class Lizard {
	direction: Direction;
	position: Vector;
	joints: Joint[] = [];
	length: number;
	color: string = "rgb(0, 0, 0)";
	speed: number;
	headAngle: number;
	targetHeadAngle: number;
	fireTimer: number = 0;
	hurtboxSize: number = 0;
	nextTurn: Direction | null = null;
	legPosition: number = 0;
	legDestination: number = LizardData.LEG_MAX;
	dead: boolean = false;

	constructor(position: Vector, direction: Direction, length: number, speed: number) {
		this.position = position;
		this.direction = direction;
		this.headAngle = Vector.unit(this.direction).angle();
		this.targetHeadAngle = this.headAngle;
		this.length = length;
		this.speed = speed;
	}

	display(canvasIO: CanvasIO) {
		this.displayJoints(canvasIO);
		this.displayBody(canvasIO);
		this.displayLegs(canvasIO);
		this.displayHead(canvasIO);
		this.displayHitboxes(canvasIO);
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
	getLegAngle(distance: number) {
		const [, , jointBefore, jointAfter, distanceBefore, distanceAfter] = this.getPointOnBody(distance);
		const directionBefore = (jointBefore === "head") ? this.direction : jointBefore.direction;
		const angleBefore = Directions.angle(directionBefore);
		if(distance < distanceBefore + LizardData.LEG_ROTATION_START && jointBefore !=="head") {
			const index = this.joints.indexOf(jointBefore);
			const previousDirection = this.joints[index - 1]?.direction ?? this.direction;
			return GameUtils.lerpAngle(
				distance,
				distanceBefore,
				distanceBefore + LizardData.LEG_ROTATION_START,
				GameUtils.diagonalAngle(directionBefore, previousDirection),
				angleBefore
			);
		}
		else if(distance > distanceAfter - LizardData.LEG_ROTATION_END && jointAfter !== "tail") {
			return GameUtils.lerpAngle(
				distance,
				distanceAfter - LizardData.LEG_ROTATION_END,
				distanceAfter,
				angleBefore,
				GameUtils.diagonalAngle(directionBefore, jointAfter.direction)
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
	displayHead(canvasIO: CanvasIO) {
		const mouthX = LizardData.HEAD_WIDTH / 2 * (1 + Math.sin(frameCount * 0.5)) / 2;
		canvasIO.ctx.save();
		canvasIO.ctx.translate(this.position.x, this.position.y);
		canvasIO.ctx.rotate(this.headAngle - Math.PI / 2);
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.fillPoly(
			0, LizardData.HEAD_OFFSET,
			-LizardData.HEAD_WIDTH, LizardData.HEAD_HEIGHT + LizardData.HEAD_OFFSET,
			-mouthX, LizardData.HEAD_HEIGHT + LizardData.MOUTH_LENGTH + LizardData.HEAD_OFFSET,
			0, LizardData.HEAD_HEIGHT * 1.5 + LizardData.HEAD_OFFSET,
			mouthX, LizardData.HEAD_HEIGHT + LizardData.MOUTH_LENGTH + LizardData.HEAD_OFFSET,
			LizardData.HEAD_WIDTH, LizardData.HEAD_HEIGHT + LizardData.HEAD_OFFSET,
		);


		canvasIO.ctx.fillStyle = LizardData.EYE_COLOR;
		canvasIO.fillDiamond(0, LizardData.EYE_Y + LizardData.HEAD_OFFSET, LizardData.EYE_SIZE);
		GameUtils.glowCircle(0, LizardData.EYE_Y + LizardData.HEAD_OFFSET, LizardData.LIGHT_SIZE, LizardData.LIGHT_INTENSITY, canvasIO);

		canvasIO.ctx.restore();
	}
	displayHitboxes(canvasIO: CanvasIO) {
		const hitboxes = this.hitboxes();
		for(const box of hitboxes) {
			canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_HITBOX_COLOR;
			canvasIO.strokeRect(box);
		}

		const hurtbox = this.hurtbox();
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_HURTBOX_COLOR;
		canvasIO.strokeRect(hurtbox);
	}
	displayLookaheadRectangle(canvasIO: CanvasIO) {
		const rectangle = this.lookaheadRectangle();
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARD_LOOKAHEAD_COLOR;
		canvasIO.strokeRect(rectangle);
	}

	update(world: World) {
		this.position = this.position.add(Vector.unit(this.direction).multiply(this.speed));

		this.updateLegs();
		this.checkForCollisions(world);
		this.updateJoints();
		this.updateHeadAngle();
		this.updateFire(world);
		this.updateHurtbox(world);
		this.checkForPlayer(world);
	}
	updateLegs() {
		this.legPosition = GameUtils.moveTowards(this.legPosition, this.legDestination, this.speed * LizardData.LEG_SPEED_MULTIPLIER);
		if(this.legPosition >= LizardData.LEG_MAX) {
			this.legDestination = LizardData.LEG_MIN;
		}
		else if(this.legPosition <= LizardData.LEG_MIN) {
			this.legDestination = LizardData.LEG_MAX;
		}
	}
	checkForCollisions(world: World) {
		const lookaheadPoint = this.position.add(Vector.unit(this.direction).multiply(LizardData.LOOKAHEAD_DISTANCE));
		if(this.isObstructed(world, this.direction)) {
			const clockwise = Directions.rotateClockwise(this.direction);
			const counterclockwise = Directions.rotateCounterclockwise(this.direction);
			const obstructedCounterclockwise = this.isObstructed(world, counterclockwise, WorldData.TILE_SIZE);
			const obstructedClockwise = this.isObstructed(world, clockwise, WorldData.TILE_SIZE);
			if(obstructedClockwise && obstructedCounterclockwise) {
				this.startFire();
			}
			else if(!obstructedClockwise && obstructedCounterclockwise) {
				this.turn(clockwise);
			}
			else if(!obstructedCounterclockwise && obstructedClockwise)  {
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
			this.joints.unshift({ position: this.position.clone(), direction: this.direction });
			this.direction = direction;
			this.targetHeadAngle = Vector.unit(this.direction).angle();
			this.stopFire();
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
			angle => MathUtils.dist(angle, this.targetHeadAngle)
		);
		this.headAngle = GameUtils.moveTowards(minValue, this.targetHeadAngle, LizardData.HEAD_ROTATION_SPEED);

		this.headAngle = MathUtils.generalizedModulo(this.headAngle, 2 * Math.PI);
		this.targetHeadAngle = MathUtils.generalizedModulo(this.targetHeadAngle, 2 * Math.PI);
	}
	generateFireParticleVelocity() {
		const speed = LizardData.PARTICLE_SPEED + GameUtils.random(-LizardData.PARTICLE_SPEED_VARIANCE, LizardData.PARTICLE_SPEED_VARIANCE);
		const crossSpeed = GameUtils.random(-LizardData.PARTICLE_CROSS_SPEED_VARIANCE, LizardData.PARTICLE_CROSS_SPEED_VARIANCE);
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
		return new Particle(this.position, this.generateFireParticleVelocity(), LizardData.FIRE_PARTICLES);
	}
	updateFire(world: World) {
		this.fireTimer --;
		if(this.fireTimer > 0) {
			for(let i = 0; i < LizardData.PARTICLES_PER_FRAME; i ++) {
				world.particles.push(this.generateFireParticle());
			}
			this.hurtboxSize = Math.min(this.hurtboxSize + LizardData.HURTBOX_SPEED, LizardData.MAX_HURTBOX_SIZE);
		}
		else {
			this.hurtboxSize = 0;
		}
	}
	hurtbox(size: number = this.hurtboxSize) {
		if(this.direction === "left") {
			return new Rectangle(
				this.position.x - size - LizardData.HURTBOX_OFFSET, this.position.y - LizardData.HURTBOX_WIDTH / 2,
				Math.max(0, size - LizardData.HURTBOX_OFFSET), LizardData.HURTBOX_WIDTH
			);
		}
		else if(this.direction === "right") {
			return new Rectangle(
				this.position.x + LizardData.HURTBOX_OFFSET, this.position.y - LizardData.HURTBOX_WIDTH / 2,
				Math.max(0, size - LizardData.HURTBOX_OFFSET), LizardData.HURTBOX_WIDTH
			);
		}
		else if(this.direction === "up") {
			return new Rectangle(
				this.position.x - LizardData.HURTBOX_WIDTH / 2, this.position.y - size - LizardData.HURTBOX_OFFSET,
				LizardData.HURTBOX_WIDTH, Math.max(0, size - LizardData.HURTBOX_OFFSET)
			);
		}
		else {
			return new Rectangle(
				this.position.x - LizardData.HURTBOX_WIDTH / 2, this.position.y + LizardData.HURTBOX_OFFSET,
				LizardData.HURTBOX_WIDTH, Math.max(0,size - LizardData.HURTBOX_OFFSET)
			);
		}
	}
	shouldDestroy(tile: Tile) {
		return !(
			(tile === "platform" && this.direction !== "down") ||
			(tile instanceof Gate && tile.openness >= 1)
		);
	}
	updateHurtbox(world: World) {
		if(this.hurtboxSize === 0) { return; }
		const hurtbox = this.hurtbox();
		for(const { position, tile } of world.getTilesAt(hurtbox)) {
			if(this.shouldDestroy(tile)){
				world.tiles.set(position, "empty");
			}
		}
		if(world.player.physicsObject.hitbox().intersects(hurtbox)) {
			world.player.damage();
		}
		for(const lizard of world.creatures) {
			lizard.damage(this.hurtbox());
		}
	}
	checkForPlayer(world: World) {
		this.checkForPlayerFire(world);
		this.checkForPlayerTurns(world);
	}
	checkForPlayerFire(world: World) {
		const hurtbox = this.hurtbox(LizardData.MAX_HURTBOX_SIZE);
		if(world.player.physicsObject.hitbox().intersects(hurtbox)) {
			this.startFire();
		}
	}
	checkForPlayerTurns(world: World) {
		const player = world.player.physicsObject.hitbox();
		const xDirection = player.center().x < this.position.x ? "left" : "right";
		const yDirection = player.center().y < this.position.y ? "up" : "down";
		const lookaheadPoint = this.lookaheadPoint();
		const obstructedX = this.isObstructed(
			world, xDirection, LizardData.LOOKAHEAD_DISTANCE, 
			Math.min(MathUtils.dist(lookaheadPoint.x, player.left()), MathUtils.dist(lookaheadPoint.x, player.right()))
		);
		const obstructedY = this.isObstructed(
			world, yDirection, LizardData.LOOKAHEAD_DISTANCE,
			Math.min(MathUtils.dist(lookaheadPoint.y, player.top()), MathUtils.dist(lookaheadPoint.y, player.bottom()))
		);
		let nextTurn: Direction | null = null;
		if(
			player.bottom() > this.position.y - LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			player.top() < this.position.y + LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			!obstructedX
		) { nextTurn = xDirection; }
		else if(
			player.right() > this.position.x - LizardData.PLAYER_DETECTION_WIDTH / 2 && 
			player.left() < this.position.x + LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			!obstructedY
		) { nextTurn = yDirection; }
		if(nextTurn !== null && nextTurn !== Directions.opposite(this.direction)) {
			this.nextTurn = nextTurn;
		}

		const canTurn = (Directions.isHorizontal(this.direction)
			? MathUtils.dist(MathUtils.generalizedModulo(this.position.x, WorldData.TILE_SIZE), WorldData.TILE_SIZE / 2) < this.speed
			: MathUtils.dist(MathUtils.generalizedModulo(this.position.y, WorldData.TILE_SIZE), WorldData.TILE_SIZE / 2) < this.speed
		);
		if(this.nextTurn !== null && canTurn) {
			this.attemptTurn(this.nextTurn, world);
			this.nextTurn = null;
		}
	}
	startFire(duration: number = LizardData.FIRE_DURATION) {
		if(this.fireTimer < 0) {
			this.hurtboxSize = 0;
		}
		this.fireTimer = LizardData.FIRE_DURATION;
	}
	stopFire() {
		this.fireTimer = 0;
		this.hurtboxSize = 0;
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
	damage(rectangle: Rectangle) {
		const length = this.roundedLengthAfterDamage(rectangle);;
		if(length < (LizardData.MIN_LENGTH + 1/2) * WorldData.TILE_SIZE) {
			this.dead = true;
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
				length, LizardData.LOOKAHEAD_WIDTH
			);
		}
		else {
			return new Rectangle(
				point.x - LizardData.LOOKAHEAD_WIDTH / 2, point.y - (direction === "up" ? length : 0),
				LizardData.LOOKAHEAD_WIDTH, length
			);
		}
	}
	isObstructed(world: World, direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE, length: number = 1) {
		const lookaheadRectangle = this.lookaheadRectangle(direction, distance, length);
		const tiles = world.getTilesAt(lookaheadRectangle);
		if(tiles.some(({ tile }) => (
			tile === "solid" ||
			(tile === "platform" && direction === "down") ||
			(tile instanceof Gate && tile.openness !== 1)
		))) { return true; }
		if(world.creatures.some(lizard => lizard.hitboxes().some(b => b.intersects(lookaheadRectangle)))) {
			return true;
		}
		return false;
	}
	getPointOnBody(distance: number): [Vector, Direction, Joint | "head",  Joint | "tail", number, number] {
		if(this.joints.length === 0 || distance < Vector.dist(this.position, this.joints[0].position)) {
			return [
				this.position.subtract(Vector.unit(this.direction).multiply(distance)), 
				this.direction,
				"head",
				this.joints[0] ?? "tail",
				0,
				this.joints.length === 0 ? this.length : Vector.dist(this.position, this.joints[0].position)
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
					length
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
			this.length
		];
	}

	static segmentHitbox(point1: Vector, point2: Vector) {
		if(point1.x === point2.x) {
			return Rectangle.fromBounds(
				point1.x - LizardData.HITBOX_WIDTH / 2,
				point1.x + LizardData.HITBOX_WIDTH / 2,
				Math.min(point1.y, point2.y) - LizardData.HITBOX_WIDTH / 2,
				Math.max(point1.y, point2.y) + LizardData.HITBOX_WIDTH / 2
			);
		}
		else {
			return Rectangle.fromBounds(
				Math.min(point1.x, point2.x) - LizardData.HITBOX_WIDTH / 2,
				Math.max(point1.x, point2.x) + LizardData.HITBOX_WIDTH / 2,
				point1.y - LizardData.HITBOX_WIDTH / 2,
				point1.y + LizardData.HITBOX_WIDTH / 2
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
		const distance = Vector.dist(this.position, world.player.physicsObject.hitbox().center());
		return (
			distance > LizardData.MIN_PLAYER_SPAWN_DISTANCE &&
			!this.hitboxes().some(box => world.isInSolid(box))
		);
	}
}

