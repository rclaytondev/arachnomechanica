import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Entities } from "../world/Entities.mjs";
import { Tiles, TileWithPosition, World } from "../world/World.mjs";

export type Octant = Direction | Diagonal; // convention: the diagonal is the direction of the start of the octant when going around clockwise.

export class Octants {
	static quadrant(quadrant: Diagonal): Octant[] {
		return [quadrant, Directions.rotateCounterclockwise45[quadrant]];
	}

	static getSolidOctants(point: Vector, world: World, collides: (e: Collideable) => boolean = () => true): Octant[] {
		return [...new Set([
			...Octants.getTileOctants(point, world.tiles),
			...Octants.getEntityOctants(point, world.entities, collides),
		])];
	}
	static octantsOfRect(point: Vector, rect: Rectangle) {
		if(!rect.contains(point)) { return []; }

		const result: Octant[] = [];
		if(point.x > rect.left() && point.y > rect.top()) {
			result.push("left", "up-left");
		}
		if(point.x > rect.left() && point.y < rect.bottom()) {
			result.push("down", "down-left");
		}
		if(point.x < rect.right() && point.y > rect.top()) {
			result.push("up", "up-right");
		}
		if(point.x < rect.right() && point.y < rect.bottom()) {
			result.push("right", "down-right");
		}
		return result;
	}
	static octantsOfTile(point: Vector, tile: TileWithPosition): Octant[] {
		if(World.isFullTile(tile.tile)) {
			const tileSquare = Rectangle.square(tile.x * WorldData.TILE_SIZE, tile.y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);
			return Octants.octantsOfRect(point, tileSquare);
		}
		return []; // TODO: add support for slope
	}
	static getTileOctants(point: Vector, tiles: Tiles) {
		const getGridValues = (value: number) => [...new Set([
			Math.floor(value / WorldData.TILE_SIZE),
			Math.ceil(value / WorldData.TILE_SIZE) - 1,
		])];
		const xValues = getGridValues(point.x);
		const yValues = getGridValues(point.y);

		return xValues.map(x => (
			yValues.map(y => (
				Octants.octantsOfTile(point, { x, y, tile: tiles.get(x, y) })
			))
		)).flat(2);
	}
	static getEntityOctants(point: Vector, entities: Entities, collides: (e: Collideable) => boolean): Octant[] {
		const nearEntities = entities.collideablesIntersecting(Rectangle.square(point.x - 1, point.y - 1, 2));
		const hitboxes = [...nearEntities].filter(collides).flatMap(e => e.hitboxes());
		return [...new Set(hitboxes.flatMap(h => Octants.octantsOfRect(point, h)))];
	}

	static nextOctant(octant: Octant, direction: "clockwise" | "counterclockwise") {
		if(direction === "clockwise") {
			return Directions.rotateClockwise45[octant];
		}
		else {
			return Directions.rotateCounterclockwise45[octant];
		}
	}
	static nextOctantIn(octants: Octant[], start: Direction | Diagonal, direction: "clockwise" | "counterclockwise") {
		if(octants.length === 0) {
			return null;
		}
		let current = start;
		while(!octants.includes(current)) {
			current = Octants.nextOctant(current, direction);
		}
		return current;
	}
	static edge(octant: Octant, direction: "clockwise" | "counterclockwise"): Direction | Diagonal {
		if(direction === "counterclockwise") {
			return octant;
		}
		else {
			return Directions.rotateClockwise45[octant];
		}
	}
}

export class PointOnSurface {
	readonly normal: Direction | Diagonal;
	readonly point: Vector;
	constructor(point: Vector, normal: Direction | Diagonal) {
		this.point = point;
		this.normal = normal;
	}

	nextPointCW(world: World, collides: (e: Collideable) => boolean) {
		const octants = Octants.getSolidOctants(this.point, world, collides);
		const newTangent = Octants.nextOctantIn(octants, this.normal, "clockwise");
		if(newTangent === null) { return null; }
		const newNormal = Directions.rotateCounterclockwise[newTangent];
		return new PointOnSurface(this.point.add(Vector.gridUnit(newTangent)), newNormal);
	}
	nextPoint(spider: Spider, world: World, direction: "clockwise" | "counterclockwise") {
		const octants = Octants.getSolidOctants(this.point, world, e => e !== spider);
		const collidingOctant = Octants.nextOctantIn(octants, this.normal, direction);
		if(collidingOctant === null) { return null; }
		const newTangent = Octants.edge(collidingOctant, direction === "clockwise" ? "counterclockwise" : "clockwise");
		const newNormal = (direction === "clockwise") ? Directions.rotateCounterclockwise[newTangent] : Directions.rotateClockwise[newTangent];
		return new PointOnSurface(this.point.add(Vector.gridUnit(newTangent)), newNormal);
	}


	distanceToTurn(spider: Spider, world: World, direction: "clockwise" | "counterclockwise", max: number) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let point: PointOnSurface | null = this;
		let iterations = 0;
		while(point != null && point.normal === this.normal && iterations < max) {
			point = point.nextPoint(spider, world, direction);
			iterations ++;
		}
		return iterations;
	}
	nextNormal(spider: Spider, world: World, direction: "clockwise" | "counterclockwise", maxDistance: number) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let point: PointOnSurface | null = this;
		let iterations = 0;
		while(point != null && point.normal === this.normal && iterations < maxDistance) {
			point = point.nextPoint(spider, world, direction);
			iterations ++;
		}
		return point?.normal ?? this.normal;
	}
	nextTurn(spider: Spider, world: World, direction: "clockwise" | "counterclockwise", maxDistance: number): [number, Direction | Diagonal] {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let point: PointOnSurface | null = this;
		let iterations = 0;
		while(point != null && point.normal === this.normal && iterations < maxDistance) {
			point = point.nextPoint(spider, world, direction);
			iterations ++;
		}
		return [iterations, point?.normal ?? this.normal];
	}
}

export class CrawlingMovementData {
	pointOnSurface: PointOnSurface;
	direction: "clockwise" | "counterclockwise";
	subpixel: number = 0;

	constructor(pointOnSurface: PointOnSurface, direction: "clockwise" | "counterclockwise") {
		this.pointOnSurface = pointOnSurface;
		this.direction = direction;
	}

	nextPoint(spider: Spider, world: World) {
		if(this.direction === "clockwise") {
			return this.pointOnSurface.nextPointCW(world, e => e !== spider);
		}
		else {
			throw new Error("Counterclockwise movement is not yet implemented.");
		}
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
			return GameUtils.lerpAngle(
				previousTurnDistance,
				0, previousTurnDistance + nextTurnDistance,
				Directions.angle[previousTurnNormal], Directions.angle[nextTurnNormal],
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
	scaledSmoothedNormal(spider: Spider, world: World) {
		const opposite = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
		const [nextTurnDistance, nextTurnNormal] = this.pointOnSurface.nextTurn(spider, world, this.direction, 2 * SpiderData.TURN_WALL_DURATION);
		const [previousTurnDistance, previousTurnNormal] = this.pointOnSurface.nextTurn(spider, world, opposite, 2 * SpiderData.TURN_WALL_DURATION);
		const wallDistance = this.wallDistance(world, nextTurnDistance, previousTurnDistance);
		const angle = this.smoothedNormalAngle(nextTurnDistance, nextTurnNormal, previousTurnDistance, previousTurnNormal);
		return new Vector(Math.cos(angle), -Math.sin(angle)).multiply(wallDistance);
	}

	update(spider: Spider, world: World, canvasIO: CanvasIO) {
		this.subpixel += SpiderData.SPEED;
		while(this.subpixel >= 1) {
			this.subpixel --;
			const nextPoint = this.nextPoint(spider, world);
			if(nextPoint != null) {
				this.pointOnSurface = nextPoint;
			}
		}
		this.updateHitbox(spider, world, canvasIO);
	}
	updateHitbox(spider: Spider, world: World, canvasIO: CanvasIO) {
		const normal = this.scaledSmoothedNormal(spider, world);
		const preferredCenter = this.pointOnSurface.point.add(normal);
		const offset = preferredCenter.subtract(spider.hitbox.center());
		spider.move(offset, world, canvasIO, { });
	}
}

export class Spider extends RectangularCollideable {
	display() { }
	displayDebug(canvasIO: CanvasIO, world: World): void {
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
	}

	movement: CrawlingMovementData;
	constructor(position: Vector, movement: CrawlingMovementData) {
		super(Rectangle.square(position.x, position.y, SpiderData.HITBOX_SIZE));
		this.movement = movement;
	}

	static spawn(_position: Vector, _world: World): boolean {
		return true;
	}
}
