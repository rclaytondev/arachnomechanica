import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Octant, Octants } from "../game-utilities/Octant.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Slope, World } from "../world/World.mjs";
import { Tile } from "./Tile.mjs";
import { TowerTile } from "./TowerTile.mjs";

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
		return this.slopeIntersectionDistance(rect, tilePosition) > 0;
	}
	slopeIntersectionDistance(rect: Rectangle, tilePosition: Vector) {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		if(!rect.intersects(tileSquare)) { return -Infinity; }
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
}
