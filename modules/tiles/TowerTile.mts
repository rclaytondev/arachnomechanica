import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Slope, Tile, World } from "../World.js";
import { SolidTile } from "./SolidTile.mjs";

export class TowerTile {
	static tileGlowGradient: CanvasGradient | null = null;
	static diagonalGlowGradient: CanvasGradient | null = null;
	
	static getTileGlowGradent() {
		if(this.tileGlowGradient) { return this.tileGlowGradient; }
		this.tileGlowGradient = GameUtils.glowLineGradient(
			0, 0, 0, -WorldData.TILE_GLOW_SIZE, 
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.tileGlowGradient;
	}
	static getDiagonalGlowGradient() {
		if(this.diagonalGlowGradient) { return this.diagonalGlowGradient; }
		this.diagonalGlowGradient = GameUtils.glowCircleGradient(
			0, 0, WorldData.TILE_GLOW_SIZE,
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.diagonalGlowGradient;
	}
	
	static displaySlopedTile(position: Vector, canvasIO: CanvasIO, tile: Slope) {
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const angles = {
			"slope-floor-right": 0,
			"slope-floor-left": MathUtils.toRadians(90),
			"slope-ceiling-right": MathUtils.toRadians(-90),
			"slope-ceiling-left": MathUtils.toRadians(-180),
		};
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(angles[tile]);
		canvasIO.ctx.fillStyle = WorldData.TILE_COLOR;
		canvasIO.fillPoly(
			WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
			WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
			-WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
		);
		canvasIO.ctx.restore();
	}
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
			"slope-ceiling-right": ["right", "down"]
		} as const)[tile];
		const distance1 = this.getSlopeAccentLength(position, adjacentDirection1, perpendicularDirection1, world);

		const [adjacentDirection2, perpendicularDirection2] = ({
			"slope-floor-left": ["down", "right"],
			"slope-floor-right": ["right", "up"],
			"slope-ceiling-left": ["left", "down"],
			"slope-ceiling-right": ["up", "left"]
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
			if(!TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(edge))), Directions.opposite(edge))) {
				const vertex1 = edgeCenter.add(Vector.unit(direction).multiply(-(WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2))));
				const vertex2 = edgeCenter.add(Vector.unit(direction).multiply(TowerTile.getAccentLength(position, edge, direction, world)));
				canvasIO.strokeLine(vertex1.x, vertex1.y, vertex2.x, vertex2.y);
			}
		}
	}
	static getSlopeAccentLength(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, world: World) {
		const angle = TowerTile.angle(position, adjacentDirection, perpendicularDirection, world, false);
		const defaultLength = WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2);
		return ({
			0: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2),
			45: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET,
			90: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET / 2,
			135: WorldData.TILE_SIZE * Math.SQRT2 / 2,
			180: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			225: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET
		} as { [key: number]: number } )[angle] ?? defaultLength;
	}
	static displaySolidTile(position: Vector, canvasIO: CanvasIO, world: World) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLOR;
		canvasIO.ctx.fillRect(
			position.x * WorldData.TILE_SIZE - 1, 
			position.y * WorldData.TILE_SIZE - 1, 
			WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2
		);
	}
	static getAccentLength(position: Vector, side: Direction, direction: Direction, world: World): number {
		const angle = TowerTile.angle(position, direction, side, world, false);
		const defaultLength = WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 + 1);
		return ({
			0: WorldData.TILE_ACCENT_RADIUS,
			45: WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			90: WorldData.TILE_SIZE / 2,
			135: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			180: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET
		} as { [ key: number]: number } )[angle] ?? defaultLength;
	}
	static displayTileAccent(position: Vector, canvasIO: CanvasIO, world: World) {
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "butt";

		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const side of Directions.DIRECTIONS) {
			const adjacentTile = world.tiles.get(position.add(Vector.unit(side)));
			if(TowerTile.isSolidOrSlope(adjacentTile, Directions.opposite(side))) { continue; }
			
			const edgeCenter = center.add(Vector.unit(side).multiply(WorldData.TILE_ACCENT_RADIUS));
			for(const direction of [Directions.rotateClockwise(side), Directions.rotateCounterclockwise(side)] as Direction[]) {
				const length = this.getAccentLength(position, side, direction, world);
				canvasIO.strokeLine(
					edgeCenter.x, edgeCenter.y,
					edgeCenter.x + Vector.unit(direction).x * length,
					edgeCenter.y + Vector.unit(direction).y * length
				);
			}
		}
	}
	static angle(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, world: World, empty: boolean = true) {
		/* Returns the angle before encountering a solid/empty, when first moving in `adjacentDirection` and then in `perpendicularDirection` and then in a circle after that. */
		const tile = world.tiles.get(position);
		const adjacent = world.tiles.get(position.add(Vector.unit(adjacentDirection)));
		const diagonal = world.tiles.get(position.add(Vector.unit(adjacentDirection)).add(Vector.unit(perpendicularDirection)));
		const perpendicular = world.tiles.get(position.add(Vector.unit(perpendicularDirection)));
		if(TowerTile.isSolidOrSlope(adjacent, Directions.opposite(adjacentDirection)) === empty) {
			return 0;
		}
		if(TowerTile.isSolidOrSlope(adjacent, perpendicularDirection) === empty) {
			return 45;
		}
		if(TowerTile.isSolidOrSlope(diagonal, Directions.opposite(perpendicularDirection)) === empty) {
			return 90;
		}
		if(TowerTile.isSolidOrSlope(diagonal, Directions.opposite(adjacentDirection)) === empty) {
			return 135;
		}
		if(TowerTile.isSolidOrSlope(perpendicular, adjacentDirection) === empty) {
			return 180;
		}
		if(TowerTile.isSolidOrSlope(perpendicular, Directions.opposite(perpendicularDirection)) === empty) {
			return 225;
		}
		if(TowerTile.isSolidOrSlope(tile, perpendicularDirection) === empty) {
			return 270;
		}
		if(TowerTile.isSolidOrSlope(tile, adjacentDirection) === empty) {
			return 315;
		}
		return 360;
	}

	static displayTileGlow(position: Vector, canvasIO: CanvasIO, world: World, directions: readonly Direction[] = Directions.DIRECTIONS, cornerOnly: boolean = false) {
		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const direction of directions) {
			const adjacentTile = TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction))), Directions.opposite(direction));
			const right = Directions.rotateClockwise(direction);
			const tileRight = (
				TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(right))), direction)
				|| TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(right))), Directions.opposite(right))
			);
			const tileDiagonalRight = (
				TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction))), right)
				|| TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction).add(Vector.unit(right)))), Directions.opposite(right))
			);
			if(!adjacentTile) {
				if(!cornerOnly) {
					TowerTile.displayGlow(position, canvasIO, direction);
				}
				if(!tileRight && !tileDiagonalRight) {
					const tileEdgeCenter = center.add(Vector.unit(direction).multiply(WorldData.TILE_SIZE / 2));
					const rightEdgeCorner = tileEdgeCenter.add(Vector.unit(right).multiply(WorldData.TILE_SIZE / 2));
					canvasIO.ctx.save();
					canvasIO.ctx.translate(rightEdgeCorner.x, rightEdgeCorner.y);
					canvasIO.ctx.rotate(-Directions.angle(direction) + Math.PI / 2);
					canvasIO.ctx.fillStyle = TowerTile.getDiagonalGlowGradient();
					canvasIO.ctx.globalCompositeOperation = "lighter";
					canvasIO.ctx.fillRect(0, -WorldData.TILE_GLOW_SIZE, WorldData.TILE_SIZE, WorldData.TILE_GLOW_SIZE);
					canvasIO.ctx.restore();
				}
			}
		}
	}
	static displayGlow(position: Vector, canvasIO: CanvasIO, direction: Direction) {
		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		const tileEdgeCenter = center.add(Vector.unit(direction).multiply(WorldData.TILE_SIZE / 2));
		canvasIO.ctx.save();
		canvasIO.ctx.translate(tileEdgeCenter.x, tileEdgeCenter.y);
		canvasIO.ctx.rotate(-Directions.angle(direction) + Math.PI / 2);
		canvasIO.ctx.fillStyle = TowerTile.getTileGlowGradent();
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.ctx.fillRect(-WorldData.TILE_SIZE / 2, -WorldData.TILE_GLOW_SIZE, WorldData.TILE_SIZE, WorldData.TILE_GLOW_SIZE);
		canvasIO.ctx.restore();
	}
	static displaySlopeGlow(position: Vector, canvasIO: CanvasIO, slope: Slope, world: World) {
		TowerTile.displaySlopeEdgeGlow(position, canvasIO, slope, world);
		TowerTile.displaySlopeCornerGlow(position, canvasIO, slope, world);
	}
	static displaySlopeEdgeGlow(position: Vector, canvasIO: CanvasIO, slope: Slope, world: World) {
		const edges = TowerTile.slopeEdges(slope);
		for(const edge of edges) {
			if(!TowerTile.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(edge))), Directions.opposite(edge))) {
				TowerTile.displayGlow(position, canvasIO, edge);
			}
		}

		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		const angle = {
			"slope-floor-left": 45,
			"slope-floor-right": -45,
			"slope-ceiling-left": 135,
			"slope-ceiling-right": -135,
		}[slope];

		canvasIO.ctx.rotate(MathUtils.toRadians(angle));
		canvasIO.ctx.fillStyle = TowerTile.getTileGlowGradent();
		canvasIO.ctx.globalCompositeOperation = "lighter";
		canvasIO.ctx.fillRect(
			-WorldData.TILE_SIZE * Math.SQRT2 / 2, -WorldData.TILE_GLOW_SIZE,
			WorldData.TILE_SIZE * Math.SQRT2, WorldData.TILE_GLOW_SIZE
		);
		canvasIO.ctx.restore();
	}
	static displaySlopeCornerGlow(position: Vector, canvasIO: CanvasIO, slope: Slope, world: World) {
		const data = ({
			"slope-floor-left": [
				["up", "left", 315, position.multiply(WorldData.TILE_SIZE), false],
				["right", "down", 315, position.add(1, 1).multiply(WorldData.TILE_SIZE), true],
			],
			"slope-floor-right": [
				["left", "down", 225, position.add(0, 1).multiply(WorldData.TILE_SIZE), false],
				["up", "right", 225, position.add(1, 0).multiply(WorldData.TILE_SIZE), true],
			],
			"slope-ceiling-left": [
				["down", "left", 45, position.add(0, 1).multiply(WorldData.TILE_SIZE), true],
				["right", "up", 45, position.add(1, 0).multiply(WorldData.TILE_SIZE), false],
			],
			"slope-ceiling-right": [
				["down", "right", 135, position.add(1, 1).multiply(WorldData.TILE_SIZE), false],
				["left", "up", 135, position.multiply(WorldData.TILE_SIZE), true],
			]
		} as const)[slope];
		for(const [adjacentDirection, perpendicularDirection, startAngle, corner, clockwise] of data) {
			const angle = 45 + TowerTile.angle(position, adjacentDirection, perpendicularDirection, world);
			if(angle === 135) {
				GameUtils.glowArc(
					corner.x, corner.y,
					WorldData.TILE_GLOW_SIZE, WorldData.TILE_GLOW_INTENSITY,
					canvasIO,
					MathUtils.toRadians(clockwise ? startAngle : startAngle - 45),
					MathUtils.toRadians(clockwise ? startAngle + 45 : startAngle),
					WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
				);
				GameUtils.glowArc(
					corner.x, corner.y,
					WorldData.TILE_GLOW_SIZE, WorldData.TILE_GLOW_INTENSITY,
					canvasIO,
					MathUtils.toRadians(clockwise ? startAngle - 90 : startAngle + 45),
					MathUtils.toRadians(clockwise ? startAngle - 45 : startAngle + 90),
					WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
				);
			}

			if(angle <= 180) { continue; }
			if(angle === 270 && clockwise) { continue; } // prevent re-drawing same glow when two corners meet at a point
			GameUtils.glowArc(
				corner.x, corner.y,
				WorldData.TILE_GLOW_SIZE, WorldData.TILE_GLOW_INTENSITY,
				canvasIO,
				clockwise ? MathUtils.toRadians(startAngle) : MathUtils.toRadians(startAngle - (angle - 180)),
				clockwise ? MathUtils.toRadians(startAngle + (angle - 180)) : MathUtils.toRadians(startAngle),
				WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
			);
		}


		const cornerSide = ({
			"slope-floor-left": "down",
			"slope-floor-right": "right",
			"slope-ceiling-left": "left",
			"slope-ceiling-right": "up",
		} as const)[slope];
		TowerTile.displayTileGlow(position, canvasIO, world, [cornerSide], true);
	}

	
	static isSolidOrSlope(tile: Tile, direction: Direction) {
		if(tile instanceof SolidTile && World.isSlope(tile.shape)) {
			const edges = ({
				"slope-floor-left": ["left", "down"],
				"slope-floor-right": ["right", "down"],
				"slope-ceiling-left": ["left", "up"],
				"slope-ceiling-right": ["right", "up"]
			} as const)[tile.shape];
			return (edges as readonly Direction[]).includes(direction);
		}
		return tile instanceof SolidTile && tile.shape === "solid";
	}
	static slopeEdges(tile: Slope) {
		return ({
			"slope-floor-left": ["left", "down"],
			"slope-floor-right": ["right", "down"],
			"slope-ceiling-left": ["left", "up"],
			"slope-ceiling-right": ["right", "up"]
		} as const)[tile];
	}
}
