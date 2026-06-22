import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { World } from "../world/World.mjs";
import { Slope } from "./SlopeTile.mjs";

export class TowerTile {
	static displaySlopedAccent(position: Vector, canvasIO: CanvasIO, tile: Slope, world: World) {
		const inwardNormal = {
			"slope-floor-left": new Vector(-1, 1),
			"slope-floor-right": new Vector(1, 1),
			"slope-ceiling-left": new Vector(-1, -1),
			"slope-ceiling-right": new Vector(1, -1),
		}[tile];
		const tangent = inwardNormal.rotate(90);
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);

		const [adjacentDirection1, perpendicularDirection1] = ({
			"slope-floor-left": ["left", "up"],
			"slope-floor-right": ["down", "left"],
			"slope-ceiling-left": ["up", "right"],
			"slope-ceiling-right": ["right", "down"],
		} as const)[tile];
		const distance1 = this.getSlopeAccentLength(position, adjacentDirection1, perpendicularDirection1, world);

		const [adjacentDirection2, perpendicularDirection2] = ({
			"slope-floor-left": ["down", "right"],
			"slope-floor-right": ["right", "up"],
			"slope-ceiling-left": ["left", "down"],
			"slope-ceiling-right": ["up", "left"],
		} as const)[tile];
		const distance2 = this.getSlopeAccentLength(position, adjacentDirection2, perpendicularDirection2, world);


		const endpoint1 = center.add(inwardNormal.multiply(WorldData.TILE_ACCENT_INSET / Math.SQRT2)).add(tangent.normalize().multiply(distance1));
		const endpoint2 = center.add(inwardNormal.multiply(WorldData.TILE_ACCENT_INSET / Math.SQRT2)).subtract(tangent.normalize().multiply(distance2));

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "round";
		canvasIO.strokeLine(endpoint1.x, endpoint1.y, endpoint2.x, endpoint2.y);

		const directions = TowerTile.slopeEdges(tile);
		for(const [edge, direction] of [directions, [...directions].reverse()]) {
			const edgeCenter = center.add(Vector.unit(edge).multiply(WorldData.TILE_ACCENT_RADIUS));
			if(!World.isEdgeBasicSolid(world.originalTiles.get(position.add(Vector.unit(edge))), Directions.opposite[edge])) {
				const vertex1 = edgeCenter.add(Vector.unit(direction).multiply(-(WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2))));
				const vertex2 = edgeCenter.add(Vector.unit(direction).multiply(TowerTile.getAccentLength(position, edge, direction, world)));
				canvasIO.strokeLine(vertex1.x, vertex1.y, vertex2.x, vertex2.y);
			}
		}
	}
	static getSlopeAccentLength(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, world: World) {
		const angle = World.angle(position, adjacentDirection, perpendicularDirection, false, true, world.originalTiles);
		const defaultLength = WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2);
		return ({
			0: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2),
			45: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET,
			90: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET / 2,
			135: WorldData.TILE_SIZE * Math.SQRT2 / 2,
			180: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			225: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET,
		} as { [key: number]: number } )[angle] ?? defaultLength;
	}
	static getAccentLength(position: Vector, side: Direction, direction: Direction, world: World): number {
		const angle = World.angle(position, direction, side, false, true, world.originalTiles);
		const defaultLength = WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 + 1);
		return ({
			0: WorldData.TILE_ACCENT_RADIUS,
			45: WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			90: WorldData.TILE_SIZE / 2,
			135: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			180: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET,
		} as { [ key: number]: number } )[angle] ?? defaultLength;
	}
	static displayTileAccent(position: Vector, canvasIO: CanvasIO, world: World) {
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "butt";

		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const side of Directions.DIRECTIONS) {
			const adjacentTile = world.originalTiles.get(position.add(Vector.unit(side)));
			if(World.isEdgeBasicSolid(adjacentTile, Directions.opposite[side])) { continue; }

			const edgeCenter = center.add(Vector.unit(side).multiply(WorldData.TILE_ACCENT_RADIUS));
			for(const direction of [Directions.rotateClockwise[side], Directions.rotateCounterclockwise[side]] as Direction[]) {
				const length = this.getAccentLength(position, side, direction, world);
				canvasIO.strokeLine(
					edgeCenter.x, edgeCenter.y,
					edgeCenter.x + Vector.unit(direction).x * length,
					edgeCenter.y + Vector.unit(direction).y * length,
				);
			}
		}
	}

	static slopeEdges(tile: Slope) {
		return ({
			"slope-floor-left": ["left", "down"],
			"slope-floor-right": ["right", "down"],
			"slope-ceiling-left": ["left", "up"],
			"slope-ceiling-right": ["right", "up"],
		} as const)[tile];
	}
}
