import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { World } from "../world/World.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { LizardData, WorldData } from "../constants/GameData.mjs";
import { FireSpawner } from "../game-utilities/FireSpawner.mjs";
import { Player } from "../Player.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { InvisibleRectangle } from "../game-utilities/physics-engine/InvisibleRectangle.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tiles } from "../world/Tiles.mjs";

type Joint = { position: Vector, direction: Direction };

export class Lizard extends Collideable {
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
		GameUtils.glowCircle(
			0, LizardData.EYE_Y + LizardData.HEAD_OFFSET,
			LizardData.LIGHT_SIZE, LizardData.LIGHT_INTENSITY,
			canvasIO,
			LizardData.GLOW_COLOR.red,
			LizardData.GLOW_COLOR.green,
			LizardData.GLOW_COLOR.blue,
		);
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
		for(const { connection, knee, foot } of this.legDisplaySegments(0)) {
			canvasIO.strokeLine(connection.x, connection.y, knee.x, knee.y);
			canvasIO.halfPointedLine(knee.x, knee.y, foot.x, foot.y);
		}
	}
	legDisplaySegments(startDistance: number = 0) {
		const results = [];
		for(let i = 1; i * LizardData.LEG_SPACING < this.length; i ++) {
			if(i * LizardData.LEG_SPACING < startDistance) { continue; }
			const multiplier = (i % 2 === 0) ? 1 : -1;
			const [position] = this.getPointOnBody(i * LizardData.LEG_SPACING);
			const tangentAngle = this.getLegAngle(i * LizardData.LEG_SPACING);
			const tangentVector = new Vector(Math.cos(tangentAngle), -Math.sin(tangentAngle));
			const normalVector = new Vector(-tangentVector.y, tangentVector.x);
			const knee1 = position.add(normalVector.multiply(LizardData.LEG_DISTANCE).add(tangentVector.multiply(this.legPosition * multiplier)));
			const knee2 = position.add(normalVector.multiply(-LizardData.LEG_DISTANCE).add(tangentVector.multiply(-this.legPosition * multiplier)));
			results.push({
				connection: position,
				knee: knee1,
				foot: knee1.add(tangentVector.multiply(LizardData.LOWER_LEG_LENGTH)),
			});
			results.push({
				connection: position,
				knee: knee2,
				foot: knee2.add(tangentVector.multiply(LizardData.LOWER_LEG_LENGTH)),
			});
		}
		return results;
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
			this.updateMotion(world, canvasIO);
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
	updateMotion(world: World, canvasIO: CanvasIO) {
		for(let i = 0; i < this.speed; i ++) {
			this.updateMotion1Pixel(world, canvasIO);
		}
	}
	updateMotion1Pixel(world: World, canvasIO: CanvasIO) {
		const rect = this.lookaheadRectangle(this.direction, LizardData.HITBOX_WIDTH / 2, 1, LizardData.HITBOX_WIDTH - 2);
		const collideable = new InvisibleRectangle(rect);
		collideable.moveUnit(this.direction, world, canvasIO, { collides: (o) => o !== this });
		const offset = Vector.unit(this.direction);
		this.position = this.position.add(offset);
		if(this.hitboxes().some(h => world.isInSolid(h, (o) => o !== this))) {
			this.position = this.position.subtract(offset);
			return false;
		}
		world.entities.updatePosition(this);
		return true;
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
				const tileCoordinates = Tiles.getTileCoordinates(lookaheadPoint);
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
		const minValue = ArrayUtils.minValue(
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
		if(!world.player.dead && world.player.hitbox.interiorIntersects(hurtbox)) {
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
				Math.min(MathUtils.dist(lookaheadPoint.x, player.left()), MathUtils.dist(lookaheadPoint.x, player.right())) - LizardData.LOOKAHEAD_DISTANCE,
			)
		) { nextTurn = xDirection; }
		else if(
			player.right() > this.position.x - LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			player.left() < this.position.x + LizardData.PLAYER_DETECTION_WIDTH / 2 &&
			!this.isObstructed(
				world, yDirection, LizardData.LOOKAHEAD_DISTANCE,
				Math.min(MathUtils.dist(lookaheadPoint.y, player.top()), MathUtils.dist(lookaheadPoint.y, player.bottom())) - LizardData.LOOKAHEAD_DISTANCE,
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
				rectangle.intersects(Lizard.segmentHitbox(joint, next))
			) {
				return distance + ((joint.x > next.x) ? joint.x - rectangle.right() : rectangle.left() - joint.x);
			}
			if(
				joint.x === next.x &&
				rectangle.intersects(Lizard.segmentHitbox(joint, next))
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
	damage(rectangle: Rectangle, world: World, canvasIO: CanvasIO) {
		const length = this.roundedLengthAfterDamage(rectangle);;
		this.roundedLengthAfterDamage(rectangle);
		if(length < (LizardData.MIN_LENGTH + 1/2) * WorldData.TILE_SIZE) {
			world.entities.delete(this);
			this.spawnDamageParticles(0, world, canvasIO);
		}
		else {
			this.spawnDamageParticles(length, world, canvasIO);
			this.length = length;
		}
	}
	spawnDamageParticles(newLength: number, world: World, canvasIO: CanvasIO) {
		this.spawnLegDamageParticles(newLength, world, canvasIO);
		this.spawnBodyDamageParticles(newLength, world, canvasIO);
	}
	spawnLegDamageParticles(newLength: number, world: World, canvasIO: CanvasIO) {
		for(const { connection, knee, foot } of this.legDisplaySegments(newLength)) {
			this.spawnDamageParticle(connection, knee, world, canvasIO);
			this.spawnDamageParticle(knee, foot, world, canvasIO);
		}
	}
	spawnBodyDamageParticles(newLength: number, world: World, canvasIO: CanvasIO) {
		const [endpoint] = this.getPointOnBody(this.length);
		const [newEndpoint] = this.getPointOnBody(newLength);
		let distance = 0;
		const joints = [
			{ position: this.position },
			...this.joints,
			{ position: endpoint },
		];
		for(let i = 0; i < joints.length - 1; i ++) {
			const [joint, next] = [joints[i], joints[i+1]];
			const segmentLength = Vector.dist(joint.position, next.position);
			if(distance < newLength && distance + segmentLength >= newLength) {
				this.spawnDamageParticle(newEndpoint, next.position, world, canvasIO);
			}
			else if(distance >= newLength) {
				this.spawnDamageParticle(joint.position, next.position, world, canvasIO);
			}
			distance += segmentLength;
		}
	}
	spawnDamageParticle(endpoint1: Vector, endpoint2: Vector, world: World, canvasIO: CanvasIO) {
		const midpoint = endpoint1.add(endpoint2).divide(2);
		const velocity = new Vector(
			GameUtils.random(-LizardData.DAMAGE_PARTICLES.VELOCITY.X, LizardData.DAMAGE_PARTICLES.VELOCITY.X),
			GameUtils.random(LizardData.DAMAGE_PARTICLES.VELOCITY.Y.MIN, LizardData.DAMAGE_PARTICLES.VELOCITY.Y.MAX),
		);
		const settings = {
			...LizardData.DAMAGE_PARTICLES.SETTINGS,
			shape: (canvasIO: CanvasIO) => {
				const point1 = endpoint1.subtract(midpoint);
				const point2 = endpoint2.subtract(midpoint);
				canvasIO.ctx.strokeStyle = this.color;
				canvasIO.ctx.lineWidth = LizardData.BODY_WIDTH;
				canvasIO.strokeLine(point1.x, point1.y, point2.x, point2.y);
			},
		};
		const particle = new Particle(midpoint, velocity, settings);
		world.addParticle(particle, canvasIO);
	}


	lookaheadPoint(direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE) {
		return this.position.add(Vector.unit(direction).multiply(distance));
	}
	lookaheadRectangle(direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE, length: number = 1, width: number = LizardData.LOOKAHEAD_WIDTH) {
		const point = this.lookaheadPoint(direction, distance);
		if(Directions.isHorizontal(direction)) {
			return new Rectangle(
				point.x - (direction === "left" ? length : 0), point.y - width / 2,
				length, width,
			);
		}
		else {
			return new Rectangle(
				point.x - width / 2, point.y - (direction === "up" ? length : 0),
				width, length,
			);
		}
	}
	isObstructed(world: World, direction: Direction = this.direction, distance: number = LizardData.LOOKAHEAD_DISTANCE, length: number = 1) {
		const lookaheadRectangle = this.lookaheadRectangle(direction, distance, length);
		for(const { tile } of world.tiles.getTilesAt(lookaheadRectangle)) {
			if(World.isSemifullTile(tile, direction === "down")) {
				return true;
			}
		}
		const entities = [...world.entities.collideablesIntersecting(lookaheadRectangle)];
		if(entities.some(entity => !(entity instanceof Player))) {
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
		const HALF_HITBOX = Math.floor(LizardData.HITBOX_WIDTH / 2);
		if(point1.x === point2.x) {
			return Rectangle.fromBounds(
				point1.x - HALF_HITBOX,
				point1.x + HALF_HITBOX,
				Math.min(point1.y, point2.y) - HALF_HITBOX,
				Math.max(point1.y, point2.y) + HALF_HITBOX,
			);
		}
		else {
			return Rectangle.fromBounds(
				Math.min(point1.x, point2.x) - HALF_HITBOX,
				Math.max(point1.x, point2.x) + HALF_HITBOX,
				point1.y - HALF_HITBOX,
				point1.y + HALF_HITBOX,
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
	static spawn(tilePosition: Vector, world: World) {
		const [_, direction, maxLength] = ArrayUtils.maxEntry(Directions.DIRECTIONS, (direction) => {
			for(let i = 0; i <= LizardData.MAX_LENGTH / WorldData.TILE_SIZE; i ++) {
				if(world.tiles.get(tilePosition.add(Vector.unit(direction).multiply(i))) !== EmptyTile.EMPTY) {
					return i - 1;
				}
			}
			return LizardData.MAX_LENGTH;
		});
		if(maxLength >= LizardData.MIN_LENGTH) {
			const length = GameUtils.randomInt(maxLength, LizardData.MAX_LENGTH);
			return world.addEntityIfEmpty(new Lizard(
				tilePosition.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
				direction,
				(GameUtils.randomInt(LizardData.MIN_LENGTH, length) + 1/2) * WorldData.TILE_SIZE,
				LizardData.SPEED,
			));
			return true;
		}
		return false;
	}

	boundingBox() {
		return Rectangle.boundingBox(this.hitboxes().flatMap(
			r => [r.getCorner("top-left"), r.getCorner("top-right"), r.getCorner("bottom-left"), r.getCorner("bottom-right")],
		));
	}
	translate(amount: Vector) {
		this.position = this.position.add(amount);
		for(const joint of this.joints) {
			joint.position = joint.position.add(amount);
		}
	}
}
