import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { PlayerData, RoomData, SpiderData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { Fireball } from "./Fireball.mjs";

export class PointOnSurface {
	readonly normal: Direction | Diagonal;
	readonly point: Vector;
	constructor(point: Vector, normal: Direction | Diagonal) {
		this.point = point;
		this.normal = normal;
	}

	nextPoint(self: Collideable, world: World, direction: "clockwise" | "counterclockwise") {
		const blockers = world.angularMotionBlockers(this.point, direction, (e) => e !== self);
		if(blockers.length === 0) {
			const opposite = (direction === "clockwise" ? "counterclockwise" : "clockwise");
			const onPlatformEnd = world.angularMotionBlockers(this.point, opposite, e => e !== self).length !== 0;
			return onPlatformEnd ? "on-platform-end" : "floating";
		}
		const newTangent = Directions.nextIn(blockers, this.normal, direction);
		const newNormal = (direction === "clockwise") ? Directions.rotateCounterclockwise[newTangent] : Directions.rotateClockwise[newTangent];
		return new PointOnSurface(this.point.add(Vector.gridUnit(newTangent)), newNormal);
	}




	tangentVector(direction: "clockwise" | "counterclockwise") {
		return Directions.rotate[direction][this.normal];
	}
}

export class CrawlingMovementData {
	pointOnSurface: PointOnSurface;
	direction: "clockwise" | "counterclockwise";
	subpixel: number = 0;
	cachedSurfaceData: CachedSurfaceData;

	constructor(pointOnSurface: PointOnSurface, direction: "clockwise" | "counterclockwise") {
		this.pointOnSurface = pointOnSurface;
		this.direction = direction;
		this.cachedSurfaceData = new CachedSurfaceData(pointOnSurface);
	}

	wallDistance(world: World, nextTurnDistance: number, previousTurnDistance: number) {
		const distanceToTurn = Math.min(nextTurnDistance, previousTurnDistance);
		if(distanceToTurn >= SpiderData.TURN_WALL_DURATION) {
			return SpiderData.SIZE / 2;
		}
		return SpiderData.SIZE / 2 + GameUtils.lerp(
			distanceToTurn,
			0, SpiderData.TURN_WALL_DURATION,
			SpiderData.TURN_WALL_DISTANCE, 0,
		);
	}
	smoothedNormalAngle(nextTurnDistance: number, nextTurnNormal: Direction | Diagonal, previousTurnDistance: number, previousTurnNormal: Direction | Diagonal) {
		if(previousTurnDistance + nextTurnDistance < 2 * SpiderData.TURN_WALL_DURATION) {
			const halfAngle1 = GameUtils.lerpAngle(1/2, 0, 1, Directions.angle[previousTurnNormal], Directions.angle[this.pointOnSurface.normal]);
			const halfAngle2 = GameUtils.lerpAngle(1/2, 0, 1, Directions.angle[this.pointOnSurface.normal], Directions.angle[nextTurnNormal]);
			return GameUtils.lerpAngle(
				previousTurnDistance,
				0, previousTurnDistance + nextTurnDistance,
				halfAngle1, halfAngle2,
			);
		}
		else if(previousTurnDistance < SpiderData.TURN_WALL_DURATION) {
			const halfAngle = GameUtils.lerpAngle(
				1/2, 0, 1,
				Directions.angle[this.pointOnSurface.normal], Directions.angle[previousTurnNormal],
			);
			return GameUtils.lerpAngle(
				previousTurnDistance,
				0, SpiderData.TURN_WALL_DURATION,
				halfAngle, Directions.angle[this.pointOnSurface.normal],
			);
		}
		else if(nextTurnDistance < SpiderData.TURN_WALL_DURATION) {
			const halfAngle = GameUtils.lerpAngle(
				1/2, 0, 1,
				Directions.angle[this.pointOnSurface.normal], Directions.angle[nextTurnNormal],
			);
			const result = GameUtils.lerpAngle(
				nextTurnDistance,
				0, SpiderData.TURN_WALL_DURATION,
				halfAngle, Directions.angle[this.pointOnSurface.normal],
			);
			return result;
		}
		else {
			return Directions.angle[this.pointOnSurface.normal];
		}
	}
	scaledSmoothedNormal(self: Spider, world: World) {
		const opposite = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
		const [nextTurnDistance, nextTurnNormal] = this.cachedSurfaceData.nextTurn(self, world, this.direction, 2 * SpiderData.TURN_WALL_DURATION);
		const [previousTurnDistance, previousTurnNormal] = this.cachedSurfaceData.nextTurn(self, world, opposite, 2 * SpiderData.TURN_WALL_DURATION);
		const wallDistance = this.wallDistance(world, nextTurnDistance, previousTurnDistance);
		const angle = this.smoothedNormalAngle(nextTurnDistance, nextTurnNormal, previousTurnDistance, previousTurnNormal);
		return new Vector(Math.cos(angle), -Math.sin(angle)).multiply(wallDistance);
	}

	update(spider: Spider, world: World, canvasIO: CanvasIO) {
		if(this.isFloating(spider, world) || this.isBasepointDetached(spider)) {
			spider.beginFalling();
			return;
		}
		this.subpixel += spider.getSpeed();
		let amountMoved = 0;
		while(this.subpixel >= 1) {
			amountMoved ++;
			this.subpixel --;
			const nextPoint = this.pointOnSurface.nextPoint(spider, world, this.direction);
			if(nextPoint === "on-platform-end" || nextPoint === "floating") {
				this.direction = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
			}
			else {
				this.pointOnSurface = nextPoint;
				if(amountMoved % SpiderData.MAX_DISTANCE_PER_MOVE === 0) {
					this.cachedSurfaceData = new CachedSurfaceData(this.pointOnSurface);
					this.updateHitbox(spider, world, canvasIO);
				}
			}
		}
		this.cachedSurfaceData = new CachedSurfaceData(this.pointOnSurface);
		this.updateHitbox(spider, world, canvasIO);

		const opposite = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
		const [nextTurnDistance, nextTurnNormal] = this.cachedSurfaceData.nextTurn(spider, world, this.direction, 2 * SpiderData.TURN_WALL_DURATION);
		const [previousTurnDistance, previousTurnNormal] = this.cachedSurfaceData.nextTurn(spider, world, opposite, 2 * SpiderData.TURN_WALL_DURATION);
		spider.angle = GameUtils.moveAngleTowards(spider.angle, this.smoothedNormalAngle(nextTurnDistance, nextTurnNormal, previousTurnDistance, previousTurnNormal), SpiderData.ANGULAR_SPEED);
	}
	updateHitbox(spider: Spider, world: World, canvasIO: CanvasIO) {
		const normal = this.scaledSmoothedNormal(spider, world);
		const preferredCenter = this.pointOnSurface.point.add(normal);
		const offset = preferredCenter.subtract(spider.hitbox.center().add(spider.subpixel));
		const collides = (obj: Entity | TileWithPosition) => !(obj instanceof Fireball && obj.ignoredEntities.includes(spider));
		spider.move(offset, world, canvasIO, { collides });
		world.entities.updatePosition(spider);
	}
	isFloating(spider: Spider, world: World) {
		const opposite = this.direction === "clockwise" ? "counterclockwise" : "clockwise";
		const blockers1 = world.angularMotionBlockers(this.pointOnSurface.point, this.direction, (o) => o !== spider);
		const blockers2 = world.angularMotionBlockers(this.pointOnSurface.point, opposite, (o) => o !== spider);
		return blockers1.length === 0 && blockers2.length === 0;
	}
	isBasepointDetached(spider: Spider) {
		const distance = Vector.dist(spider.hitbox.center(), this.pointOnSurface.point);
		return (distance > SpiderData.MAX_BASEPOINT_DISTANCE);
	}

	runAway(point: Vector) {
		const distance = Vector.dist(this.pointOnSurface.point, point);
		const direction = this.pointOnSurface.tangentVector(this.direction);
		const nextDistance = Vector.dist(this.pointOnSurface.point.add(Vector.unit(direction)), point);
		if(nextDistance < distance) {
			this.direction = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
		}
	}
}

export class CachedSurfaceData {
	clockwise: (PointOnSurface | null)[];
	counterclockwise: (PointOnSurface | null)[];

	constructor(point: PointOnSurface) {
		this.clockwise = [point];
		this.counterclockwise = [point];
	}


	getPoint(distance: number, direction: "clockwise" | "counterclockwise", self: Collideable, world: World) {
		const points = this[direction];
		while(points.length < distance && ArrayUtils.last(points) != null) {
			const last = ArrayUtils.last(points)!;
			const next = last.nextPoint(self, world, direction);
			if(next instanceof PointOnSurface) {
				points.push(next);
			}
			else {
				points.push(null);
			}
		}
		const last = points[Math.min(distance, points.length - 1)];
		if(last === null) {
			return points[Math.min(distance - 1, points.length - 2)]!;
		}
		else {
			return last;
		}
	}
	nextTurn(self: Collideable, world: World, direction: "clockwise" | "counterclockwise", max: number): [number, Direction | Diagonal] {
		for(let i = 0; i <= max; i ++) {
			const point = this.getPoint(i, direction, self, world);
			if(point.normal !== this[direction][0]!.normal) {
				return [i, point.normal];
			}
		}
		return [max, this[direction][0]!.normal];
	}
}

export class SpiderLeg {
	minDistance: number;
	maxDistance: number;
	distance: number;
	destinationDistance: number;
	attachmentOffset: Vector;
	length: number;
	position: Vector = new Vector(0, 0);

	constructor(length: number, attachmentOffset: Vector, minDistance: number, maxDistance: number) {
		this.length = length;
		this.attachmentOffset = attachmentOffset;
		this.distance = minDistance;
		this.destinationDistance = maxDistance;
		this.minDistance = minDistance;
		this.maxDistance = maxDistance;
	}

	update(spider: Spider, world: World) {
		if(Math.abs(this.distance) <= this.minDistance || Math.sign(this.distance) !== Math.sign(this.attachmentOffset.x)) {
			this.destinationDistance = this.maxDistance * Math.sign(this.attachmentOffset.x);
		}
		else if(Math.abs(this.distance) >= this.maxDistance && Math.sign(this.distance) === Math.sign(this.attachmentOffset.x)) {
			this.destinationDistance = this.minDistance * Math.sign(this.attachmentOffset.x);
		}

		this.distance = GameUtils.moveTowards(this.distance, this.destinationDistance, SpiderData.LEG_SPEED);

		const destination = this.destination(spider, world);
		const updateSpeed = spider.getSpeed() + SpiderData.LEG_UPDATE_SPEED;
		this.position = GameUtils.moveVectorTowards(this.position, destination, updateSpeed);
	}
	destination(spider: Spider, world: World) {
		if(spider.movement instanceof FallingMovementData || spider.movement.isFloating(spider, world)) {
			return this.position;
		}
		const direction = this.distance > 0 ? "clockwise" : "counterclockwise";
		return spider.movement.cachedSurfaceData.getPoint(Math.abs(this.distance), direction, spider, world).point;
	}
	jointPosition(spider: Spider, position: Vector) {
		const center = spider.hitbox.center();
		const distance = Vector.dist(position, center);
		const horizontal = position.subtract(center).normalize();
		const up = horizontal.rotate(this.attachmentOffset.x < 0 ? 90 : -90);
		const height = Math.sqrt(Math.max(0, this.length ** 2 - (distance / 2) ** 2));
		return center.add(horizontal.multiply(distance / 2)).add(up.multiply(height));
	}

	display(spider: Spider, canvasIO: CanvasIO) {
		const attachment = this.attachment(spider);
		const joint = this.jointPosition(spider, this.position);
		canvasIO.ctx.strokeStyle = "black";
		canvasIO.ctx.lineWidth = 5;
		canvasIO.linePointedness = 2;
		canvasIO.pointedLine(attachment.x, attachment.y, joint.x, joint.y);
		canvasIO.pointedLine(joint.x, joint.y, this.position.x, this.position.y);
	}

	attachment(spider: Spider) {
		const center = spider.hitbox.center();
		return center.add(this.attachmentOffset.rotate(-MathUtils.toDegrees(spider.angle) + 90));
	}
}

export class FallingMovementData {
	velocity: Vector = new Vector(0, 0);

	update(spider: Spider, world: World, canvasIO: CanvasIO) {
		spider.move(this.velocity, world, canvasIO, { });
		world.entities.updatePosition(spider);
		this.velocity = this.velocity.add(0, PlayerData.GRAVITY);
	}
}


export class Spider extends RectangularCollideable {
	movement: CrawlingMovementData | FallingMovementData;
	angle: number = 0;
	rechargeTime: number = -1;
	pauseTimer: number = -1;
	legs: SpiderLeg[] = [];

	constructor(position: Vector, movement: CrawlingMovementData | FallingMovementData, world: World) {
		super(Rectangle.square(position.x, position.y, SpiderData.HITBOX_SIZE));
		this.movement = movement;
		this.legs = this.initializeLegs(world);
	}
	initializeLegs(world: World) {
		const legs = [
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
		for(const leg of legs) {
			leg.position = leg.destination(this, world);
		}
		return legs;
	}

	render(world: World) {
		return [
			new Renderable(c => this.display(c, world), "entity"),
			new Renderable(c => this.displayGlowEffect(c), "glow"),
			new Renderable(c => this.displayTelegraph(c, world), "telegraph"),
		];
	}
	display(canvasIO: CanvasIO, world: World) {
		this.displayBody(canvasIO, world);
		this.displayEyes(canvasIO);
		this.displayLegs(canvasIO);
	}
	displayBody(canvasIO: CanvasIO, world: World) {
		canvasIO.ctx.save();
		const position = this.hitbox.center();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate(-this.angle);
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		if(this.seesPlayer(world) && DEBUG_SETTINGS.SPIDER_VISUALIZATION) {
			canvasIO.ctx.fillStyle = "green";
		}
		canvasIO.fillRegularPoly(new Vector(0, 0), SpiderData.SIZE / 2, 6);
		canvasIO.ctx.restore();
	}
	displayEyes(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		const numGlowing = this.numGlowingEyes();
		let count = 0;
		for(let angle = 0; angle < 360; angle += 360 / SpiderData.NUM_EYES) {
			const position = new Vector(0, -SpiderData.EYE_DISTANCE).rotate(angle + 90 + MathUtils.toDegrees(-this.angle));
			canvasIO.ctx.fillStyle = (count < numGlowing) ? SpiderData.EYE_COLOR : SpiderData.UNLIT_EYE_COLOR;
			canvasIO.fillDiamond(center.x + position.x, center.y + position.y, SpiderData.EYE_SIZE);
			count ++;
		}
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
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
	displayTelegraph(canvasIO: CanvasIO, world: World) {
		if(this.pauseTimer <= 0) { return; }
		const spider = this.hitbox.center();
		const player = world.player.hitbox.center();
		const opacity = GameUtils.lerp(this.pauseTimer, 0, SpiderData.SHOT_DELAY, 1, 0);
		const width = GameUtils.lerp(this.pauseTimer, 0, SpiderData.SHOT_DELAY, 2, 30);
		GameUtils.glowOutline(
			spider.x, spider.y,
			player.x, player.y,
			width, opacity, canvasIO,
			255, 255, 255,
		);
	}
	numGlowingEyes() {
		return Math.floor(GameUtils.lerp(
			MathUtils.constrain(this.rechargeTime, 0, SpiderData.RECHARGE_TIME),
			0, SpiderData.RECHARGE_TIME,
			SpiderData.NUM_EYES, 0,
		));
	}
	displayLegs(canvasIO: CanvasIO) {
		for(const leg of this.legs) {
			leg.display(this, canvasIO);
		}
	}
	displayDebug(canvasIO: CanvasIO, world: World): void {
		if(this.movement instanceof FallingMovementData || this.movement.isFloating(this, world) || !DEBUG_SETTINGS.SPIDER_VISUALIZATION) { return; }
		const point = this.movement.pointOnSurface.point;
		const normalEndpoint = point.add(Vector.unit(this.movement.pointOnSurface.normal).multiply(20));
		canvasIO.ctx.strokeStyle = "red";
		canvasIO.ctx.lineWidth = 3;
		canvasIO.strokeLine(point.x, point.y, normalEndpoint.x, normalEndpoint.y);

		const smoothedNormal = this.movement.scaledSmoothedNormal(this, world);
		const smoothedEndpoint = point.add(smoothedNormal);
		canvasIO.ctx.strokeStyle = "green";
		canvasIO.ctx.lineWidth = 3;
		canvasIO.strokeLine(point.x, point.y, smoothedEndpoint.x, smoothedEndpoint.y);
	}

	update(world: World, canvasIO: CanvasIO) {
		this.movement.update(this, world, canvasIO);
		this.checkProjectile(world);
		for(const leg of this.legs) {
			leg.update(this, world);
		}
	}
	checkProjectile(world: World) {
		if(this.movement instanceof FallingMovementData) { return; }

		if(this.seesPlayer(world)) {
			if(this.hasProjectile()) {
				if(!this.isPaused()) {
					// begin telegraph
					this.pauseTimer = SpiderData.SHOT_DELAY;
				}
				else {
					this.pauseTimer --;
					if(this.pauseTimer === 0) {
						this.shootProjectile(world);
						this.rechargeTime = SpiderData.RECHARGE_TIME;
					}
				}
			}
			else {
				this.movement.runAway(world.player.hitbox.center());
				this.rechargeTime = SpiderData.RECHARGE_TIME;
			}
		}
		else {
			this.pauseTimer = -1;
			this.rechargeTime --;
		}
	}
	seesPlayer(world: World) {
		const center = this.hitbox.center();
		const player = world.player.hitbox;
		const up = new Vector(0, -1).rotate(MathUtils.toDegrees(-this.angle)).multiply(15);
		const collides = (obj: Entity) => obj !== this && obj !== world.player;
		return world.hasLineOfSight(center.add(up), player, collides) && world.hasLineOfSight(center.subtract(up), player, collides);

	}
	shootProjectile(world: World) {
		const center = this.hitbox.center();
		const player = world.player.hitbox.center();
		const direction = player.subtract(center).normalize();
		const velocity = direction.multiply(SpiderData.PROJECTILE_SPEED);
		const acceleration = direction.multiply(SpiderData.PROJECTILE_ACCELERATION);
		const projectile = new Fireball(center, velocity, acceleration, [this]);
		world.entities.add(projectile);
	}


	hasProjectile() {
		return this.rechargeTime < 0;
	}
	isPaused() {
		return this.hasProjectile() && this.pauseTimer >= 0;
	}
	getSpeed() {
		if(this.isPaused()) { return 0; }
		return this.hasProjectile() ? SpiderData.SPEED : SpiderData.FAST_SPEED;
	}

	beginCrawling(world: World) {
		const centerBottom = this.hitbox.edgeCenter("down");
		for(let distance = 0; distance <= SpiderData.HITBOX_SIZE / 2; distance ++) {
			for(const sign of [-1, 1]) {
				const collides = (o: Entity) => o !== this;
				const possibleBasepoint = new Vector(centerBottom.x + sign * distance, centerBottom.y);
				const motionBlockers = world.angularMotionBlockers(possibleBasepoint, "clockwise", collides);
				if(motionBlockers.some(d => ["up-left", "left", "down-left", "down-right", "right", "up-right"].includes(d))) {
					this.movement = new CrawlingMovementData(
						new PointOnSurface(possibleBasepoint, "up"),
						"clockwise",
					);
					return true;
				}
			}
		}
		return false;
	}
	beginFalling() {
		this.movement = new FallingMovementData();
	}

	static spawn(tilePosition: Vector, world: World): boolean {
		const direction = Directions.DIRECTIONS.find(dir => {
			const tile = world.tiles.get(tilePosition.add(Vector.unit(dir)));
			return tile instanceof BasicTile;
		});
		if(!direction) {
			return false;
		}

		const tileSquare = Tiles.getTileSquare(tilePosition);
		const pointOnSurface = new PointOnSurface(tileSquare.edgeCenter(direction), Directions.opposite[direction]);
		const movement = new CrawlingMovementData(pointOnSurface, "clockwise");
		const position = tileSquare.center().subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2);
		const spider = new Spider(position, movement, world);
		return world.addEntityIfEmpty(spider);
	}

	onCollision(collision: CollisionEvent, world: World): void {
		if(collision.directionOf(this) === "down" && this.movement instanceof FallingMovementData) {
			this.beginCrawling(world);
		}
		else if(this.movement instanceof CrawlingMovementData) {
			const collisionDirection = Vector.unit(collision.directionOf(this));
			const tangent = Vector.unit(this.movement.pointOnSurface.tangentVector(this.movement.direction));
			const opposite = (this.movement.direction === "clockwise" ? "counterclockwise" : "clockwise");
			const oppositeTangent = Vector.unit(this.movement.pointOnSurface.tangentVector(opposite));
			if(Vector.dist(tangent, collisionDirection) < Vector.dist(oppositeTangent, collisionDirection)) {
				this.movement.direction = (this.movement.direction === "clockwise") ? "counterclockwise" : "clockwise";
			}
		}
	}

	translate(amount: Vector): void {
		super.translate(amount);
		if(this.movement instanceof FallingMovementData) {
			for(const leg of this.legs) {
				leg.position = leg.position.add(amount);
			}
		}
	}
}


LoadingManager.onload(() => {
	EntitySpawner.registerEntityType((tileRegion: Rectangle, safeRegion: Rectangle, world: World) => {
		EntitySpawner.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * SpiderData.SPIDERS_PER_ROOM,
			SpiderData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceEmpty,
				EntitySpawner.spawnRequirements.solidAdjacent,
			],
			Spider.spawn,
			safeRegion,
			world,
		);
	});
});
