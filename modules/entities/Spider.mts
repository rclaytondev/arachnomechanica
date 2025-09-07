import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Line } from "../../utils-ts/modules/geometry/Line.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { Player } from "../Player.mjs";
import { World } from "../world/World";
import { Entity } from "../game-utilities/Entity.mjs";

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

	nextSurfaceCW(world: World) {
		const tangent = this.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateClockwise45[tangent];
		const angle = world.angle(
			this.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
			tileTangent,
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateClockwise45[newTangent];
		}
		return new Surface(
			this.end(),
			Directions.rotateCounterclockwise[newTangent],
		);
	}
	nextSurfaceCCW(world: World) {
		const tangent = this.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateCounterclockwise45[tangent];
		const angle = world.angle(
			this.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
			Directions.opposite[tileTangent],
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateCounterclockwise45[newTangent];
		}
		return new Surface(
			this.start.subtract(Vector.gridUnit(newTangent)),
			Directions.rotateCounterclockwise[newTangent],
		);
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
			"down-right": this.start,
		};
		return positions[this.tangentDirectionCW()];
	}

	end() {
		return this.start.add(Vector.gridUnit(this.tangentDirectionCW()));
	}
	length() {
		return WorldData.TILE_SIZE * (Directions.isDirection(this.outwardNormal) ? 1 : Math.SQRT2);
	}
	line() {
		return new Line(this.start.multiply(WorldData.TILE_SIZE), this.end().multiply(WorldData.TILE_SIZE));
	}

	copy() {
		return new Surface(this.start.clone(), this.outwardNormal);
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

	moveAlongSurface(amount: number, world: World) {
		let point = this.copy();
		point.distance += amount;
		while(point.distance > point.surface.length()) {
			point = new PointOnSurface(
				point.surface.nextSurfaceCW(world),
				point.distance - point.surface.length(),
			);
		}
		while(point.distance < 0) {
			const nextSurface = point.surface.nextSurfaceCCW(world);
			point = new PointOnSurface(
				nextSurface,
				nextSurface.length() + point.distance,
			);
		}
		return point;
	}

	copy() {
		return new PointOnSurface(this.surface.copy(), this.distance);
	}
}

export class SpiderLeg {
	minDistance: number;
	maxDistance: number;
	distance: number;
	destination: number;
	attachmentOffset: Vector;
	length: number;

	constructor(length: number, attachmentOffset: Vector, minDistance: number, maxDistance: number) {
		this.length = length;
		this.attachmentOffset = attachmentOffset;
		this.distance = minDistance;
		this.destination = maxDistance;
		this.minDistance = minDistance;
		this.maxDistance = maxDistance;
	}

	update() {
		if(Math.abs(this.distance) <= this.minDistance || Math.sign(this.distance) !== Math.sign(this.attachmentOffset.x)) {
			this.destination = this.maxDistance * Math.sign(this.attachmentOffset.x);
		}
		else if(Math.abs(this.distance) >= this.maxDistance && Math.sign(this.distance) === Math.sign(this.attachmentOffset.x)) {
			this.destination = this.minDistance * Math.sign(this.attachmentOffset.x);
		}

		this.distance = GameUtils.moveTowards(this.distance, this.destination, SpiderData.LEG_SPEED);
	}
	position(spider: Spider, world: World) {
		return spider.basepoint!.moveAlongSurface(this.distance, world).position();
	}
	jointPosition(spider: Spider, position: Vector) {
		const center = spider.physicsObject.hitbox().center();
		const distance = Vector.dist(position, center);
		const horizontal = position.subtract(center).normalize();
		const up = horizontal.rotate(this.attachmentOffset.x < 0 ? 90 : -90);
		const height = Math.sqrt(this.length ** 2 - (distance / 2) ** 2);
		return center.add(horizontal.multiply(distance / 2)).add(up.multiply(height));
	}

	display(spider: Spider, canvasIO: CanvasIO, world: World) {
		const attachment = this.attachment(spider);
		const position = this.position(spider, world);
		const joint = this.jointPosition(spider, position);
		canvasIO.ctx.strokeStyle = "black";
		canvasIO.ctx.lineWidth = 5;
		canvasIO.linePointedness = 2;
		canvasIO.pointedLine(attachment.x, attachment.y, joint.x, joint.y);
		canvasIO.pointedLine(joint.x, joint.y, position.x, position.y);
	}
	displayDebug() {
		// Unimplemented
	}

	attachment(spider: Spider) {
		const center = spider.physicsObject.hitbox().center();
		return center.add(this.attachmentOffset.rotate(MathUtils.toDegrees(spider.angle)));
	}
}

export class Spider extends Entity {
	physicsObject: PhysicsObject;
	movement: "clockwise" | "counterclockwise" = "clockwise";
	basepoint: PointOnSurface | null = null;
	angle: number = 0;
	rechargeTime: number = -1;
	pauseTimer: number = -1;

	legs: SpiderLeg[];

	constructor(position: Vector) {
		super();
		this.physicsObject = new PhysicsObject(
			position.subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2).floor(),
			new Rectangle(0, 0, SpiderData.HITBOX_SIZE, SpiderData.HITBOX_SIZE),
			"spider",
		);
		this.legs = this.initializeLegs();
	}
	initializeLegs() {
		return [
			new SpiderLeg(
				SpiderData.LEG_1.LENGTH,
				SpiderData.LEG_1.ATTACHMENT.reflectX(),
				SpiderData.LEG_1.MIN_DISTANCE,
				SpiderData.LEG_1.MAX_DISTANCE,
			),
			new SpiderLeg(
				SpiderData.LEG_1.LENGTH,
				SpiderData.LEG_1.ATTACHMENT,
				SpiderData.LEG_1.MIN_DISTANCE,
				SpiderData.LEG_1.MAX_DISTANCE,
			),

			new SpiderLeg(
				SpiderData.LEG_2.LENGTH,
				SpiderData.LEG_2.ATTACHMENT.reflectX(),
				SpiderData.LEG_2.MIN_DISTANCE,
				SpiderData.LEG_2.MAX_DISTANCE,
			),
			new SpiderLeg(
				SpiderData.LEG_2.LENGTH,
				SpiderData.LEG_2.ATTACHMENT,
				SpiderData.LEG_2.MIN_DISTANCE,
				SpiderData.LEG_2.MAX_DISTANCE,
			),
		];
	}

	display(canvasIO: CanvasIO, world: World) {
		this.displayBody(canvasIO);
		this.displayEyes(canvasIO);
		this.displayLegs(canvasIO, world);
	}
	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		const position = this.physicsObject.hitbox().center();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate(this.angle);
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		canvasIO.fillRegularPoly(new Vector(0, 0), SpiderData.SIZE / 2, 6);
		canvasIO.ctx.restore();
	}
	// getEyeColor() {
	// 	const rechargeTime = Math.max(this.rechargeTime, 0);
	// 	const hue = GameUtils.lerp(rechargeTime, 0, SpiderData.RECHARGE_TIME, SpiderData.EYE_COLOR.hue, SpiderData.UNLIT_EYE_COLOR.hue);
	// 	const saturation = GameUtils.lerp(rechargeTime, 0, SpiderData.RECHARGE_TIME, SpiderData.EYE_COLOR.saturation, SpiderData.UNLIT_EYE_COLOR.saturation);
	// 	const value = GameUtils.lerp(rechargeTime, 0, SpiderData.RECHARGE_TIME, SpiderData.EYE_COLOR.value, SpiderData.UNLIT_EYE_COLOR.value);
	// 	return `hsl(${hue}, ${saturation}%, ${value}%)`;
	// }
	numGlowingEyes() {
		return Math.floor(GameUtils.lerp(
			MathUtils.constrain(this.rechargeTime, 0, SpiderData.RECHARGE_TIME),
			0, SpiderData.RECHARGE_TIME,
			SpiderData.NUM_EYES, 0,
		));
	}
	displayEyes(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		const numGlowing = this.numGlowingEyes();
		let count = 0;
		for(let angle = 0; angle < 360; angle += 360 / SpiderData.NUM_EYES) {
			const position = new Vector(0, -SpiderData.EYE_DISTANCE).rotate(angle + MathUtils.toDegrees(this.angle));
			canvasIO.ctx.fillStyle = (count < numGlowing) ? SpiderData.EYE_COLOR : SpiderData.UNLIT_EYE_COLOR;
			canvasIO.fillDiamond(center.x + position.x, center.y + position.y, SpiderData.EYE_SIZE);
			count ++;
		}
	}
	displayLegs(canvasIO: CanvasIO, world: World) {
		for(const leg of this.legs) {
			leg.display(this, canvasIO, world);
		}
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		// const glowIntensity = GameUtils.lerp(
		// 	MathUtils.constrain(this.rechargeTime, 0, SpiderData.RECHARGE_TIME),
		// 	0, SpiderData.RECHARGE_TIME,
		// 	SpiderData.GLOW_INTENSITY, 0,
		// );
		const glowIntensity = GameUtils.lerp(
			this.numGlowingEyes(),
			0, SpiderData.NUM_EYES,
			0, SpiderData.GLOW_INTENSITY,
		);
		GameUtils.glowCircle(
			center.x, center.y,
			SpiderData.GLOW_SIZE, glowIntensity,
			canvasIO,
			SpiderData.GLOW_COLOR.red, SpiderData.GLOW_COLOR.green, SpiderData.GLOW_COLOR.blue,
		);
	}
	displayDebug(canvasIO: CanvasIO) {
		if(!DEBUG_SETTINGS.SPIDER_VISUALIZATION) { return; }

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
			leg.displayDebug();
		}
	}

	update(world: World) {
		this.moveAlongSurface(this.getSpeed(), world);
		this.updateAngle();
		this.updateLegs();
		this.checkProjectile(world);
	}
	updateAngle() {
		const targetAngle = Math.PI / 2 - (this.basepoint ? Directions.angle[this.basepoint.surface.outwardNormal] : 0);
		this.angle = GameUtils.moveAngleTowards(this.angle, targetAngle, SpiderData.ANGULAR_SPEED);
	}
	updateLegs() {
		if(this.isPaused()) { return; }
		for(const leg of this.legs) {
			leg.update();
		}
	}
	hasProjectile() {
		return this.rechargeTime < 0;
	}
	isPaused() {
		return this.pauseTimer >= 0;
	}
	getSpeed() {
		if(this.isPaused()) { return 0; }
		return this.hasProjectile() ? SpiderData.SPEED : SpiderData.FAST_SPEED;
	}
	checkProjectile(world: World) {
		const center = this.physicsObject.hitbox().center();
		const up = new Vector(0, -1).rotate(MathUtils.toDegrees(-this.angle)).multiply(20);
		const player = world.player.physicsObject.hitbox();
		const collides = (obj: Entity) => obj !== this;
		const hasLineOfSight = world.hasLineOfSight(center.add(up), player, collides) && world.hasLineOfSight(center.subtract(up), player, collides);
		if(!hasLineOfSight) {
			this.rechargeTime --;
		}
		if(hasLineOfSight) {
			if(this.hasProjectile() && !this.isPaused()) {
				this.pauseTimer = SpiderData.SHOT_DELAY;
			}
			this.rechargeTime = SpiderData.RECHARGE_TIME;
			this.runAway(world.player);
		}
		this.pauseTimer --;
		if(this.pauseTimer === 0) {
			this.shootProjectile(world);
			this.rechargeTime = SpiderData.RECHARGE_TIME;
		}
	}
	runAway(player: Player) {
		const playerCenter = player.physicsObject.hitbox().center();
		if(!this.basepoint) { return; }
		const distance = Vector.dist(this.basepoint.position(), playerCenter);
		const direction = this.basepoint.surface.tangentVectorCW().multiply(this.movement === "clockwise" ? 1 : -1);
		const nextDistance = Vector.dist(this.basepoint.position().add(direction), playerCenter);
		if(nextDistance < distance) {
			this.movement = (this.movement === "clockwise" ? "counterclockwise" : "clockwise");
		}
	}
	shootProjectile(world: World) {
		const center = this.physicsObject.hitbox().center();
		const player = world.player.physicsObject.hitbox().center();
		const direction = player.subtract(center).normalize();
		const velocity = direction.multiply(SpiderData.PROJECTILE_SPEED);
		const acceleration = direction.multiply(SpiderData.PROJECTILE_ACCELERATION);
		const projectile = new SpiderProjectile(center, velocity, acceleration, this);
		world.entities.addEntity(projectile);
	}

	moveAlongSurface(amount: number, world: World) {
		this.moveBasepoint(amount, world);
		const distance = this.wallDistance(world);
		const normal = this.smoothedNormal(world);
		const newCenter = this.basepoint!.position().add(normal.multiply(distance));
		const newPosition = newCenter.subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2);
		this.physicsObject.move(
			newPosition.subtract(this.physicsObject.positionFloat()),
			world,
			{
				collides: (obj) => obj !== this,
				onCollision: () => this.switchDirection(),
			},
		);
		world.entities.moveEntity(this);
	}
	moveBasepoint(amount: number, world: World) {
		this.basepoint = this.basepoint!.moveAlongSurface(amount * (this.movement === "clockwise" ? 1 : -1), world);
	}
	smoothedNormal(world: World) {
		if(this.basepoint!.distance < SpiderData.TURN_WALL_DURATION) {
			const nextSurface = this.basepoint!.surface.nextSurfaceCCW(world);
			const angle = Directions.angle[this.basepoint!.surface.outwardNormal];
			const nextAngle = Directions.angle[nextSurface.outwardNormal];
			const lerpedAngle = GameUtils.lerpAngle(
				this.basepoint!.distance,
				-SpiderData.TURN_WALL_DURATION, SpiderData.TURN_WALL_DURATION,
				nextAngle, angle,
			);
			return new Vector(Math.cos(lerpedAngle), -Math.sin(lerpedAngle));
		}
		if(this.basepoint!.surface.length() - this.basepoint!.distance < SpiderData.TURN_WALL_DURATION) {
			const nextSurface = this.basepoint!.surface.nextSurfaceCW(world);
			const angle = Directions.angle[this.basepoint!.surface.outwardNormal];
			const nextAngle = Directions.angle[nextSurface.outwardNormal];
			const lerpedAngle = GameUtils.lerpAngle(
				this.basepoint!.distance - this.basepoint!.surface.length(),
				-SpiderData.TURN_WALL_DURATION, SpiderData.TURN_WALL_DURATION,
				angle, nextAngle,
			);
			return new Vector(Math.cos(lerpedAngle), -Math.sin(lerpedAngle));
		}
		return Vector.unit(this.basepoint!.surface.outwardNormal);
	}
	wallDistance(world: World) {
		const nextSurfaceCW = this.basepoint!.surface.nextSurfaceCW(world);
		const nextSurfaceCCW = this.basepoint!.surface.nextSurfaceCCW(world);
		const distanceToTurn = Math.min(
			nextSurfaceCCW.outwardNormal === this.basepoint!.surface.outwardNormal ? Infinity : this.basepoint!.distance,
			nextSurfaceCW.outwardNormal === this.basepoint!.surface.outwardNormal ? Infinity : this.basepoint!.surface.length() - this.basepoint!.distance,
		);
		if(distanceToTurn > SpiderData.TURN_WALL_DURATION) {
			return SpiderData.SIZE / 2;
		}
		return SpiderData.SIZE / 2 + GameUtils.lerp(
			distanceToTurn,
			0, SpiderData.TURN_WALL_DURATION,
			SpiderData.TURN_WALL_DISTANCE, 0,
		);
	}

	damage(hurtbox: Rectangle, world: World, canvasIO: CanvasIO) {
		if(!hurtbox.intersects(this.physicsObject.hitbox())) { return; }

		world.entities.removeEntity(this);
		this.explode(world, canvasIO);
	}
	explode(world: World, canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		const projectile = new SpiderProjectile(center, new Vector(0, 0), new Vector(0, 0), this);
		projectile.explode(world, canvasIO);
	}

	hitboxes() {
		return [this.physicsObject.hitbox()];
	}
	switchDirection() {
		this.movement = (this.movement === "clockwise") ? "counterclockwise" : "clockwise";
	}

	boundingBox() {
		return this.physicsObject.hitbox();
	}
	translate(amount: Vector) {
		this.physicsObject.setPosition(this.physicsObject.positionFloat().add(amount));
	}
}

export class SpiderProjectile extends Entity {
	physicsObject: PhysicsObject;
	velocity: Vector;
	acceleration: Vector;
	spider: Spider;

	constructor(position: Vector, velocity: Vector, acceleration: Vector, spider: Spider) {
		super();
		this.physicsObject = new PhysicsObject(position.floor(), Rectangle.square(0, 0, 1), "spider-projectile");
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.spider = spider;
	}

	update(world: World, canvasIO: CanvasIO) {
		this.velocity = this.velocity.add(this.acceleration);
		this.physicsObject.move(this.velocity, world, {
			collides: (obj) => obj !== this.spider,
			onCollision: () => this.explode(world, canvasIO),
		});
		world.entities.moveEntity(this);

		world.addParticle(new Particle(
			this.physicsObject.hitbox().center(),
			new Vector(0, 0),
			SpiderData.PROJECTILE_PARTICLE_SETTINGS,
		), canvasIO);

		if(this.physicsObject.hitbox().intersects(world.player.physicsObject.hitbox())) {
			this.explode(world, canvasIO);
		}
	}

	display() { }

	explode(world: World, canvasIO: CanvasIO) {
		world.entities.removeEntity(this);
		world.screenShakeTimer = SpiderData.PROJECTILE_EXPLOSION.SCREEN_SHAKE_TIME;
		world.screenShakeIntensity = SpiderData.PROJECTILE_EXPLOSION.SCREEN_SHAKE_INTENSITY;

		this.destroyTiles(world);
		this.addExplosionParticles(world, canvasIO);
		this.explosionDamage(world, canvasIO);
	}
	destroyTiles(world: World) {
		const center = this.physicsObject.hitbox().center();
		const tileExplosion = Rectangle.fromCenter(
			center.x, center.y,
			SpiderData.PROJECTILE_EXPLOSION.DESTRUCTION_RADIUS * 2,
			SpiderData.PROJECTILE_EXPLOSION.DESTRUCTION_RADIUS * 2,
		);
		for(const { position } of world.getTilesAt(tileExplosion)) {
			world.destroyTile(position);
		}
	}
	addExplosionParticles(world: World, canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		const area = Math.PI * SpiderData.PROJECTILE_EXPLOSION.VISUAL_RADIUS ** 2;
		const numParticles = Math.floor(area / (WorldData.TILE_SIZE ** 2) * SpiderData.PROJECTILE_EXPLOSION.PARTICLE_DENSITY);
		for(let i = 0; i < numParticles; i ++) {
			const position = GameUtils.randomInCircle(center.x, center.y, SpiderData.PROJECTILE_EXPLOSION.VISUAL_RADIUS);
			world.addParticle(new Particle(
				position,
				new Vector(0, 0),
				SpiderData.PROJECTILE_EXPLOSION_SETTINGS,
			), canvasIO);
		}
	}
	explosionDamage(world: World, canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		world.damage(Rectangle.fromCenter(
			center.x, center.y,
			2 * SpiderData.PROJECTILE_EXPLOSION.DAMAGE_RADIUS,
			2 * SpiderData.PROJECTILE_EXPLOSION.DAMAGE_RADIUS,
		), canvasIO);
	}

	hitboxes() {
		return [];
	}
	boundingBox() {
		return this.physicsObject.hitbox();
	}
	translate(amount: Vector) {
		this.physicsObject.setPosition(this.physicsObject.positionFloat().add(amount));
	}
}
