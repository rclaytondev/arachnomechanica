import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { World } from "../World";
import { SolidTile } from "./SolidTile.mjs";

export class StoneTile {
	static distanceSq(point1: Vector, point2: Vector) {
		return (
			GameUtils.signedModularDistance(point1.x, point2.x, WorldData.STONE_PATTERN_WIDTH) ** 2
			+ GameUtils.signedModularDistance(point1.y, point2.y, WorldData.STONE_PATTERN_HEIGHT) ** 2
		);
	}
	static initializePoints() {
		const points: Vector[] = [];
		while(points.length < WorldData.STONE_PATTERN_WIDTH * WorldData.STONE_PATTERN_HEIGHT * WorldData.STONE_LINE_AMOUNT) {
			const candidates = new Array(WorldData.STONE_LINE_EVENNESS).fill(0).map(v => new Vector(
				GameUtils.random(0, WorldData.STONE_PATTERN_WIDTH),
				GameUtils.random(0, WorldData.STONE_PATTERN_HEIGHT)
			));
			points.push(Utils.maxValue(candidates, c => Math.min(...points.map(p => StoneTile.distanceSq(p, c)))));
		}
		return points;
	}
	static initializeLines() {
		const points = StoneTile.initializePoints();
		const lines = [];
		for(const point of points) {
			const others = points.filter(p => p !== point).sort((a, b) => StoneTile.distanceSq(a, point) - StoneTile.distanceSq(b, point));
			for(const otherPoint of others.slice(0, WorldData.STONE_CONNECTIONS)) {
				const closestX = Utils.minValue(
					[otherPoint.x, otherPoint.x - WorldData.STONE_PATTERN_WIDTH, otherPoint.x + WorldData.STONE_PATTERN_WIDTH],
					x => MathUtils.dist(x, point.x)
				);
				const closestY = Utils.minValue(
					[otherPoint.y, otherPoint.y - WorldData.STONE_PATTERN_HEIGHT, otherPoint.y + WorldData.STONE_PATTERN_HEIGHT],
					y => MathUtils.dist(y, point.y)
				);
				lines.push({ point1: point, point2: new Vector(closestX, closestY) });
			}
		}
		return lines;
	}
	static linesImage: HTMLCanvasElement | null = null;
	static initializeLinesImage()  {
		if(StoneTile.linesImage) {
			return StoneTile.linesImage;
		}
		const lines = StoneTile.initializeLines();
		const box = Rectangle.boundingBox(lines.flatMap(l => [l.point1, l.point2]));

		const canvasIO = new CanvasIO();
		canvasIO.canvas.width = box.width;
		canvasIO.canvas.height = box.height;
		canvasIO.ctx.strokeStyle = WorldData.STONE_LINE_COLOR;
		canvasIO.ctx.lineWidth = WorldData.STONE_LINE_THICKNESS;
		for(const { point1, point2 } of lines) {
			canvasIO.pointedLine(
				point1.x - box.left(), point1.y - box.top(),
				point2.x - box.left(), point2.y - box.top()
			);
		}
		StoneTile.linesImage = canvasIO.canvas;
		return canvasIO.canvas;
	}

	static displayStoneTiles(world: World, canvasIO: CanvasIO, visibleRegion: Rectangle) {
		canvasIO.ctx.save();
		canvasIO.ctx.beginPath();
		for(let x = visibleRegion.left(); x < visibleRegion.right(); x ++) {
			for(let y = visibleRegion.top(); y < visibleRegion.bottom(); y ++) {
				const tile = world.tiles.get(x, y);
				if(tile instanceof SolidTile && tile.texture === "stone") {
					tile.addToPath(new Vector(x, y), canvasIO);
				}
			}
		}
		canvasIO.ctx.clip();

		const patternRegion = visibleRegion.scale(
			WorldData.TILE_SIZE / WorldData.STONE_PATTERN_WIDTH,
			WorldData.TILE_SIZE / WorldData.STONE_PATTERN_HEIGHT
		);
		for(let x = Math.floor(patternRegion.left() - 1); x < patternRegion.right(); x ++) {
			for(let y = Math.floor(patternRegion.top() - 1); y < patternRegion.bottom(); y ++) {
				canvasIO.ctx.drawImage(
					StoneTile.initializeLinesImage(),
					x * WorldData.STONE_PATTERN_WIDTH,
					y * WorldData.STONE_PATTERN_HEIGHT
				)
			}
		}
		canvasIO.ctx.restore();
	}
}
