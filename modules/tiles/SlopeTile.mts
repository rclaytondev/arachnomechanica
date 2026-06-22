import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Octant, Octants } from "../game-utilities/Octant.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";
import { Tile } from "./Tile.mjs";
import { TowerTile } from "./TowerTile.mjs";

export type Slope = (typeof WorldData.SLOPES)[number];

export class SlopeTile extends Tile {
	readonly shape: Slope;

	constructor(shape: Slope) {
		super();
		this.shape = shape;
	}

	copy() {
		return new SlopeTile(this.shape);
	}
	reflect() {
		const reflections: { [key: string]: Slope } = {
			"slope-floor-left": "slope-floor-right",
			"slope-floor-right": "slope-floor-left",
			"slope-ceiling-left": "slope-ceiling-right",
			"slope-ceiling-right": "slope-ceiling-left",
		};
		return new SlopeTile(reflections[this.shape]);
	}
	equals(tile: unknown) {
		return tile instanceof SlopeTile && tile.shape === this.shape;
	}

	render(position: Vector, world: World) {
		return [
			new Renderable(c => this.display(c, position.x, position.y), "tile"),
			new Renderable(c => this.displayAccent(position, c, world), "tile-accent"),
		];
	}
	display(canvasIO: CanvasIO, x: number, y: number): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS["tower"];
		canvasIO.ctx.beginPath();
		this.addToPath(new Vector(x, y), canvasIO);
		canvasIO.ctx.fill();
	}
	addToPath(position: Vector, canvasIO: CanvasIO) {
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const angles = {
			"slope-floor-right": 0,
			"slope-floor-left": MathUtils.toRadians(90),
			"slope-ceiling-right": MathUtils.toRadians(-90),
			"slope-ceiling-left": MathUtils.toRadians(-180),
		};
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(angles[this.shape]);
		canvasIO.polygon(
			WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
			WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
			-WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
		);
		canvasIO.ctx.restore();
	}
	displayAccent(position: Vector, canvasIO: CanvasIO, world: World) {
		TowerTile.displaySlopedAccent(position, canvasIO, this.shape as Slope, world);
	}

	contains(point: Vector, tilePosition: Vector) {
		const square = Tiles.getTileSquare(tilePosition);
		if(!square.contains(point)) {
			return false;
		}

		const pointInSquare = point.subtract(square.getCorner("top-left"));
		if(this.shape === "slope-floor-left") {
			return pointInSquare.y >= pointInSquare.x;
		}
		else if(this.shape === "slope-floor-right") {
			return pointInSquare.y >= WorldData.TILE_SIZE - pointInSquare.x;
		}
		else if(this.shape === "slope-ceiling-left") {
			return pointInSquare.y <= WorldData.TILE_SIZE - pointInSquare.x;
		}
		else if(this.shape === "slope-ceiling-right") {
			return pointInSquare.y <= pointInSquare.x;
		}
		else {
			return true;
		}
	}
	solidOctants(tilePosition: Vector, point: Vector): Octant[] {
		return Octants.fromIncludes(point, p => this.contains(p, tilePosition));
	}
	angularMotionBlockers(tilePosition: Vector, point: Vector): (Direction | Diagonal)[] {
		const octants = this.solidOctants(tilePosition, point);
		return [...new Set(octants.flatMap(
			o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]),
		)];
	}

	intersects(rect: Rectangle, tilePosition: Vector): boolean {
		return this.slopeIntersectionDistance(rect, tilePosition, true) > 0;
	}
	slopeIntersectionDistance(rect: Rectangle, tilePosition: Vector, strict: boolean) {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		if(!rect.intersects(tileSquare) || (strict && !rect.interiorIntersects(tileSquare))) { return -Infinity; }
		const center = tileSquare.center();
		if(this.shape === "slope-floor-left") {
			const corner = rect.getCorner("bottom-left");
			return center.x + corner.y - center.y - corner.x;
		}
		else if(this.shape === "slope-floor-right") {
			const corner = rect.getCorner("bottom-right");
			return corner.x - (center.x + center.y - corner.y);
		}
		else if(this.shape === "slope-ceiling-left") {
			const corner = rect.getCorner("top-left");
			return center.x + center.y - corner.y - corner.x;
		}
		else {
			const corner = rect.getCorner("top-right");
			return corner.x - (center.x + corner.y - center.y);
		}
	}

	rayIntersectionDistance(tilePosition: Vector, rayStart: Vector, rayDirection: Vector): number {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		const endpoints = ({
			"slope-floor-left": ["top-left", "bottom-left", "bottom-right"],
			"slope-floor-right": ["top-right", "bottom-right", "bottom-left"],
			"slope-ceiling-left": ["top-right", "top-left", "bottom-left"],
			"slope-ceiling-right": ["top-left", "top-right", "bottom-right"],
		} as const)[this.shape];
		return Math.min(
			GameUtils.rayIntersectsSegment(rayStart, rayDirection, tileSquare.getCorner(endpoints[0]), tileSquare.getCorner(endpoints[1])),
			GameUtils.rayIntersectsSegment(rayStart, rayDirection, tileSquare.getCorner(endpoints[1]), tileSquare.getCorner(endpoints[2])),
			GameUtils.rayIntersectsSegment(rayStart, rayDirection, tileSquare.getCorner(endpoints[2]), tileSquare.getCorner(endpoints[0])),
		);
	}
	blocksMovement(tilePosition: Vector, collideable: Collideable, direction: Direction, hitboxes: Rectangle[], newHitboxes: Rectangle[]): boolean {
		return newHitboxes.some(h => this.intersects(h, tilePosition));
	}

	rectIntersectionDistance(tilePosition: Vector, rect: Rectangle, direction: Direction): number {
		if(this.intersects(rect, tilePosition)) { return 0; }

		const tileSquare = Tiles.getTileSquare(tilePosition);
		const rayDirection = Vector.unit(direction);
		if(Directions.isHorizontal(direction)) {
			const topCorner = rect.getCorner(Directions.createDiagonal[direction]["up"]);
			const bottomCorner = rect.getCorner(Directions.createDiagonal[direction]["down"]);
			return Math.min(...[
				...[topCorner, bottomCorner].map(c => this.rayIntersectionDistance(tilePosition, c, rayDirection))],
				...[tileSquare.top(), tileSquare.bottom()].filter(y => y >= rect.top() && y <= rect.bottom())
				.map(y => this.rayIntersectionDistance(tilePosition, new Vector(topCorner.x, y), rayDirection)),
			);
		}
		else {
			const leftCorner = rect.getCorner(Directions.createDiagonal["left"][direction]);
			const rightCorner = rect.getCorner(Directions.createDiagonal["right"][direction]);
			return Math.min(...[
				...[leftCorner, rightCorner].map(c => this.rayIntersectionDistance(tilePosition, c, rayDirection)),
				...[tileSquare.left(), tileSquare.right()].filter(x => x >= rect.left() && x <= rect.right())
				.map(x => this.rayIntersectionDistance(tilePosition, new Vector(x, leftCorner.y), rayDirection)),
			]);
		}
	}

	static isSlope(value: unknown): value is (typeof WorldData.SLOPES)[number] {
		return (WorldData.SLOPES as readonly unknown[]).includes(value);
	}
}
