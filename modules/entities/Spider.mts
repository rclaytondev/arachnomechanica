import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
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
		return []; // TODO
	}
}

export class PointOnSurface {
	readonly normal: Direction | Diagonal;
	readonly point: Vector;
	constructor(point: Vector, normal: Direction | Diagonal) {
		this.point = point;
		this.normal = normal;
	}
}

export class CrawlingMovementData {
	pointOnSurface: PointOnSurface;
	direction: "clockwise" | "counterclockwise";

	constructor(pointOnSurface: PointOnSurface, direction: "clockwise" | "counterclockwise") {
		this.pointOnSurface = pointOnSurface;
		this.direction = direction;
	}
}

export class Spider extends RectangularCollideable {
	display() { }
	update() { }

	static spawn(_position: Vector, _world: World): boolean {
		throw new Error("Unimplemented.");
	}
}
