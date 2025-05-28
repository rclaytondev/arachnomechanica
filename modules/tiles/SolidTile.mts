import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Slope, World } from "../World.js";

export class SolidTile {
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
	static getDiagonalGlowGradient(canvasIO: CanvasIO) {
		if(this.diagonalGlowGradient) { return this.diagonalGlowGradient; }
		this.diagonalGlowGradient = GameUtils.glowCircleGradient(
			0, 0, WorldData.TILE_GLOW_SIZE,
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.diagonalGlowGradient;
	}
	
	static displaySlopedTile(position: Vector, canvasIO: CanvasIO, tile: Slope, world: World) {
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
		const accentInset = (WorldData.TILE_SIZE - WorldData.TILE_ACCENT_DISTANCE) / 2;
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

		
		const endpoint1 = center.add(inwardNormal.multiply(accentInset / Math.SQRT2)).add(tangent.normalize().multiply(distance1));
		const endpoint2 = center.add(inwardNormal.multiply(accentInset / Math.SQRT2)).subtract(tangent.normalize().multiply(distance2));

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "round";
		canvasIO.strokeLine(endpoint1.x, endpoint1.y, endpoint2.x, endpoint2.y);

		const directions = ({
			"slope-floor-left": ["left", "down"],
			"slope-floor-right": ["right", "down"],
			"slope-ceiling-left": ["left", "up"],
			"slope-ceiling-right": ["right", "up"]
		} as const)[tile];
		for(const [edge, direction] of [directions, [...directions].reverse()]) {
			const edgeCenter = center.add(Vector.unit(edge).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
			if(!World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(edge))), Directions.opposite(edge))) {
				const vertex1 = edgeCenter.add(Vector.unit(direction).multiply(-(WorldData.TILE_SIZE / 2 - accentInset * (1 + Math.SQRT2))));
				const vertex2 = edgeCenter.add(Vector.unit(direction).multiply(SolidTile.getAccentLength(position, edge, direction, world)));
				canvasIO.strokeLine(vertex1.x, vertex1.y, vertex2.x, vertex2.y);
			}
		}
	}
	static getSlopeAccentLength(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, world: World) {
		const solid90Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(adjacentDirection))), Directions.opposite(adjacentDirection));
		const accentInset = (WorldData.TILE_SIZE - WorldData.TILE_ACCENT_DISTANCE) / 2;
		if(!solid90Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 - accentInset * (1 + Math.SQRT2);
		}
		const solid135Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(adjacentDirection))), perpendicularDirection);
		if(!solid135Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 - accentInset;
		}
		const solid180Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(adjacentDirection).add(Vector.unit(perpendicularDirection)))), Directions.opposite(perpendicularDirection));
		if(!solid180Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 - accentInset / 2;
		}
		const solid225Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(adjacentDirection).add(Vector.unit(perpendicularDirection)))), Directions.opposite(adjacentDirection));
		if(!solid225Degrees) {
			return WorldData.TILE_SIZE * Math.SQRT2 / 2;
		}
		const solid270Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(perpendicularDirection))), adjacentDirection);
		if(!solid270Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 + accentInset * (Math.SQRT2 - 1);
		}
		const solid315Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(perpendicularDirection))), Directions.opposite(perpendicularDirection));
		if(!solid315Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 + accentInset;
		}
		return WorldData.TILE_SIZE / Math.SQRT2 + accentInset * (1 + Math.SQRT2);
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
		const accentInset = (WorldData.TILE_SIZE - WorldData.TILE_ACCENT_DISTANCE) / 2;
		const solid135Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction))), Directions.opposite(direction));
		if(!solid135Degrees) {
			return WorldData.TILE_ACCENT_DISTANCE / 2;
		}
		const solid180Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction))), side);
		if(!solid180Degrees) {
			return WorldData.TILE_SIZE / 2 - accentInset * (Math.SQRT2 - 1);
		}
		const solid225Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction).add(Vector.unit(side)))), Directions.opposite(side));
		if(!solid225Degrees) {
			return WorldData.TILE_SIZE / 2;
		}
		const solid270Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(direction).add(Vector.unit(side)))), Directions.opposite(direction));
		if(!solid270Degrees) {
			return WorldData.TILE_SIZE / 2 + accentInset * (Math.SQRT2 - 1);
		}
		const solid315Degrees = World.isSolidOrSlope(world.tiles.get(position.add(Vector.unit(side))), direction);
		if(!solid315Degrees) {
			return WorldData.TILE_SIZE / 2 + accentInset;
		}
		return WorldData.TILE_SIZE / 2 + accentInset * (Math.SQRT2 + 1);
	}
	static displayTileAccent(position: Vector, canvasIO: CanvasIO, world: World) {
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "butt";

		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const side of Directions.DIRECTIONS) {
			const adjacentTile = world.tiles.get(position.add(Vector.unit(side)));
			if(World.isSolidOrSlope(adjacentTile, Directions.opposite(side))) { continue; }
			
			const edgeCenter = center.add(Vector.unit(side).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
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

	static displayTileGlow(position: Vector, canvasIO: CanvasIO, world: World) {
		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const direction of Directions.DIRECTIONS) {
			const adjacentTile = world.tiles.get(position.add(Vector.unit(direction))) === "solid";
			const right = Directions.rotateClockwise(direction);
			const tileRight = world.tiles.get(position.add(Vector.unit(right))) === "solid";
			const tileDiagonalRight = world.tiles.get(position.add(Vector.unit(direction)).add(Vector.unit(right))) === "solid";
			if(!adjacentTile) {
				const tileEdgeCenter = center.add(Vector.unit(direction).multiply(WorldData.TILE_SIZE / 2));
				canvasIO.ctx.save();
				canvasIO.ctx.translate(tileEdgeCenter.x, tileEdgeCenter.y);
				canvasIO.ctx.rotate(-Directions.angle(direction) + Math.PI / 2);
				canvasIO.ctx.fillStyle = SolidTile.getTileGlowGradent();
				canvasIO.ctx.globalCompositeOperation = "lighter";
				canvasIO.ctx.fillRect(-WorldData.TILE_SIZE / 2, -WorldData.TILE_GLOW_SIZE, WorldData.TILE_SIZE, WorldData.TILE_GLOW_SIZE);
				canvasIO.ctx.restore();

				if(!tileRight && !tileDiagonalRight) {
					const rightEdgeCorner = tileEdgeCenter.add(Vector.unit(right).multiply(WorldData.TILE_SIZE / 2));
					canvasIO.ctx.save();
					canvasIO.ctx.translate(rightEdgeCorner.x, rightEdgeCorner.y);
					canvasIO.ctx.rotate(-Directions.angle(direction) + Math.PI / 2);
					canvasIO.ctx.fillStyle = SolidTile.getDiagonalGlowGradient(canvasIO);
					canvasIO.ctx.globalCompositeOperation = "lighter";
					canvasIO.ctx.fillRect(0, -WorldData.TILE_GLOW_SIZE, WorldData.TILE_SIZE, WorldData.TILE_GLOW_SIZE);
					canvasIO.ctx.restore();
				}
			}
		}
	}
}
