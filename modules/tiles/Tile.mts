import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Octants, Octant } from "../entities/Octant.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Tiles, World } from "../world/World.mjs";

export abstract class Tile {
	abstract display(canvasIO: CanvasIO, x: number, y: number, world: World): void;
	abstract copy(): Tile;
	abstract angularMotionBlockers(tilePosition: Vector, point: Vector, direction: "clockwise" | "counterclockwise"): (Direction | Diagonal)[];

	static fullAngularMotionBlockers(tilePosition: Vector, point: Vector) {
		const rect = Rectangle.square(tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);
		const octants = Octants.octantsOfRect(point, rect);
		return Tile.angularMotionBlockersFromOctants(octants);
	}
	static angularMotionBlockersFromOctants(octants: Octant[]): (Direction | Diagonal)[] {
		const all = octants.flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]);
		return [...new Set(all)];
	}
	static angularMotionBlockersFromTiles(point: Vector, tiles: Tiles, direction: "clockwise" | "counterclockwise") {
		const getGridValues = (value: number) => [...new Set([
			Math.floor(value / WorldData.TILE_SIZE),
			Math.ceil(value / WorldData.TILE_SIZE) - 1,
		])];
		const xValues = getGridValues(point.x);
		const yValues = getGridValues(point.y);

		return xValues.map(x => (
			yValues.map(y => (
				tiles.get(x, y).angularMotionBlockers(new Vector(x, y), point, direction)
			))
		)).flat(2);
	}
	static angularMotionBlockers(point: Vector, direction: "clockwise" | "counterclockwise", collides: (e: Collideable) => boolean, world: World): (Direction | Diagonal)[] {
		const entityOctants = Octants.getEntityOctants(point, world.entities, collides);
		const entityBlockers = Tile.angularMotionBlockersFromOctants(entityOctants);

		const tileBlockers = Tile.angularMotionBlockersFromTiles(point, world.tiles, direction);
		return [...new Set([...entityBlockers, ...tileBlockers])];
	}
}
