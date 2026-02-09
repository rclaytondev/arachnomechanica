import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Octant, Octants } from "../game-utilities/Octant.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";
import { Tile } from "./Tile.mjs";
import { TowerTile } from "./TowerTile.mjs";

export class BasicTile extends Tile {
	constructor() {
		super();
	}

	copy() {
		return new BasicTile();
	}
	reflect(): BasicTile {
		return new BasicTile();
	}
	equals(tile: unknown) {
		return tile instanceof BasicTile;
	}

	contains(point: Vector, tilePosition: Vector) {
		const square = Tiles.getTileSquare(tilePosition);
		return square.contains(point);
	}
	solidOctants(tilePosition: Vector, point: Vector): Octant[] {
		return Octants.octantsOfRect(point, Tiles.getTileSquare(tilePosition));
	}
	angularMotionBlockers(tilePosition: Vector, point: Vector): (Direction | Diagonal)[] {
		const octants = this.solidOctants(tilePosition, point);
		return [...new Set(octants.flatMap(
			o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]),
		)];
	}


	intersects(rect: Rectangle, tilePosition: Vector): boolean {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		return rect.intersects(tileSquare);
	}

	addToPath(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.rect(
			position.x * WorldData.TILE_SIZE - 1,
			position.y * WorldData.TILE_SIZE - 1,
			WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2,
		);
	}

	render(position: Vector, world: World) {
		return [
			new Renderable(c => this.display(c, position.x, position.y), "tile"),
			new Renderable(c => this.displayAccent(position, c, world), "tile-accent"),
		];
	}
	displayAccent(position: Vector, canvasIO: CanvasIO, world: World) {
		TowerTile.displayTileAccent(position, canvasIO, world);
	}
	display(canvasIO: CanvasIO, x: number, y: number): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS["tower"];
		canvasIO.ctx.beginPath();
		this.addToPath(new Vector(x, y), canvasIO);
		canvasIO.ctx.fill();
	}

	rayIntersectionDistance(tilePosition: Vector, rayStart: Vector, rayDirection: Vector): number {
		return GameUtils.rayIntersectsRectangle(rayStart, rayDirection, Tiles.getTileSquare(tilePosition));
	}
	blocksMovement(tilePosition: Vector, collideable: Collideable, direction: Direction, hitboxes: Rectangle[], newHitboxes: Rectangle[]): boolean {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		return newHitboxes.some(h => h.interiorIntersects(tileSquare));
	}
}
