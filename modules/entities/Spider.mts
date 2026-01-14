import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Entities } from "../world/Entities.mjs";
import { Tiles, TileWithPosition, World } from "../world/World.mjs";

export type Octant = Direction | Diagonal; // convention: the diagonal is the direction of the start of the octant when going around clockwise.

export class Octants {
	static quadrant(quadrant: Diagonal): Octant[] {
		return [quadrant, Directions.rotateCounterclockwise45[quadrant]];
	}

	static getSolidOctants(point: Vector, world: World): Octant[] {
		return [...new Set([
			...Octants.getTileOctants(point, world.tiles),
			...Octants.getEntityOctants(point, world.entities),
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
	static getEntityOctants(point: Vector, entities: Entities): Octant[] {
		const nearEntities = entities.collideablesIntersecting(Rectangle.square(point.x - 1, point.y - 1, 2));
		const hitboxes = [...nearEntities].flatMap(e => e.hitboxes());
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
}

export class PointOnSurface {
	readonly normal: Direction | Diagonal;
	readonly point: Vector;
	constructor(point: Vector, normal: Direction | Diagonal) {
		this.point = point;
		this.normal = normal;
	}

	nextPointCW(world: World) {
		const octants = Octants.getSolidOctants(this.point, world);
		const newTangent = Octants.nextOctantIn(octants, this.normal, "clockwise");
		if(newTangent === null) { return null; }
		const newNormal = Directions.rotateCounterclockwise[newTangent];
		return new PointOnSurface(this.point.add(Vector.gridUnit(newTangent)), newNormal);
	}
}

export class CrawlingMovementData {
	pointOnSurface: PointOnSurface;
	direction: "clockwise" | "counterclockwise";

	constructor(pointOnSurface: PointOnSurface, direction: "clockwise" | "counterclockwise") {
		this.pointOnSurface = pointOnSurface;
		this.direction = direction;
	}

	nextPoint(world: World) {
		if(this.direction === "clockwise") {
			return this.pointOnSurface.nextPointCW(world);
		}
		else {
			throw new Error("Counterclockwise movement is not yet implemented.");
		}
	}
}

export class Spider extends RectangularCollideable {
	display() { }
	displayDebug(canvasIO: CanvasIO): void {
		const point = this.movement.pointOnSurface.point;
		const normalEndpoint = point.add(Vector.unit(this.movement.pointOnSurface.normal).multiply(20));
		canvasIO.ctx.strokeStyle = "red";
		canvasIO.ctx.lineWidth = 3;
		canvasIO.strokeLine(point.x, point.y, normalEndpoint.x, normalEndpoint.y);
	}

	update(world: World) {
		const nextPoint = this.movement.nextPoint(world);
		if(nextPoint != null) {
			this.movement.pointOnSurface = nextPoint;
		}
		else {
			throw new Error("Falling off objects is not yet implemented.");
		}
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
