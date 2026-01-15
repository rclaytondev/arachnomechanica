import { Direction, Diagonal, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Entities } from "../world/Entities.mjs";
import { World, TileWithPosition, Tiles } from "../world/World.mjs";


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
		if (!rect.contains(point)) { return []; }

		const result: Octant[] = [];
		if (point.x > rect.left() && point.y > rect.top()) {
			result.push("left", "up-left");
		}
		if (point.x > rect.left() && point.y < rect.bottom()) {
			result.push("down", "down-left");
		}
		if (point.x < rect.right() && point.y > rect.top()) {
			result.push("up", "up-right");
		}
		if (point.x < rect.right() && point.y < rect.bottom()) {
			result.push("right", "down-right");
		}
		return result;
	}
	static octantsOfTile(point: Vector, tile: TileWithPosition): Octant[] {
		if (World.isFullTile(tile.tile)) {
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
		if (direction === "clockwise") {
			return Directions.rotateClockwise45[octant];
		}
		else {
			return Directions.rotateCounterclockwise45[octant];
		}
	}
	static nextOctantIn(octants: Octant[], start: Direction | Diagonal, direction: "clockwise" | "counterclockwise") {
		if (octants.length === 0) {
			return null;
		}
		let current = start;
		while (!octants.includes(current)) {
			current = Octants.nextOctant(current, direction);
		}
		return current;
	}
	static edge(octant: Octant, direction: "clockwise" | "counterclockwise"): Direction | Diagonal {
		if (direction === "counterclockwise") {
			return octant;
		}
		else {
			return Directions.rotateClockwise45[octant];
		}
	}
}

