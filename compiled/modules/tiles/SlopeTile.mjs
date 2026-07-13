import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Octants } from "../game-utilities/Octant.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Tile } from "./Tile.mjs";
export class SlopeTile extends Tile {
    shape;
    constructor(shape) {
        super();
        this.shape = shape;
    }
    addToPath(position, canvasIO) {
        const center = position.add(1 / 2, 1 / 2).multiply(WorldData.TILE_SIZE);
        const angles = {
            "slope-floor-right": 0,
            "slope-floor-left": MathUtils.toRadians(90),
            "slope-ceiling-right": MathUtils.toRadians(-90),
            "slope-ceiling-left": MathUtils.toRadians(-180),
        };
        canvasIO.ctx.save();
        canvasIO.ctx.translate(center.x, center.y);
        canvasIO.ctx.rotate(angles[this.shape]);
        canvasIO.polygon(WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
        canvasIO.ctx.restore();
    }
    contains(point, tilePosition) {
        const square = Tiles.getTileSquare(tilePosition);
        if (!square.contains(point)) {
            return false;
        }
        const pointInSquare = point.subtract(square.getCorner("top-left"));
        if (this.shape === "slope-floor-left") {
            return pointInSquare.y >= pointInSquare.x;
        }
        else if (this.shape === "slope-floor-right") {
            return pointInSquare.y >= WorldData.TILE_SIZE - pointInSquare.x;
        }
        else if (this.shape === "slope-ceiling-left") {
            return pointInSquare.y <= WorldData.TILE_SIZE - pointInSquare.x;
        }
        else if (this.shape === "slope-ceiling-right") {
            return pointInSquare.y <= pointInSquare.x;
        }
        else {
            return true;
        }
    }
    solidOctants(tilePosition, point) {
        return Octants.fromIncludes(point, p => this.contains(p, tilePosition));
    }
    angularMotionBlockers(tilePosition, point) {
        const octants = this.solidOctants(tilePosition, point);
        return [...new Set(octants.flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]))];
    }
    intersects(rect, tilePosition) {
        return this.slopeIntersectionDistance(rect, tilePosition, true) > 0;
    }
    slopeIntersectionDistance(rect, tilePosition, strict) {
        const tileSquare = Tiles.getTileSquare(tilePosition);
        if (!rect.intersects(tileSquare) || (strict && !rect.interiorIntersects(tileSquare))) {
            return -Infinity;
        }
        const center = tileSquare.center();
        if (this.shape === "slope-floor-left") {
            const corner = rect.getCorner("bottom-left");
            return center.x + corner.y - center.y - corner.x;
        }
        else if (this.shape === "slope-floor-right") {
            const corner = rect.getCorner("bottom-right");
            return corner.x - (center.x + center.y - corner.y);
        }
        else if (this.shape === "slope-ceiling-left") {
            const corner = rect.getCorner("top-left");
            return center.x + center.y - corner.y - corner.x;
        }
        else {
            const corner = rect.getCorner("top-right");
            return corner.x - (center.x + corner.y - center.y);
        }
    }
    rayIntersectionDistance(tilePosition, rayStart, rayDirection) {
        const tileSquare = Tiles.getTileSquare(tilePosition);
        const endpoints = {
            "slope-floor-left": ["top-left", "bottom-left", "bottom-right"],
            "slope-floor-right": ["top-right", "bottom-right", "bottom-left"],
            "slope-ceiling-left": ["top-right", "top-left", "bottom-left"],
            "slope-ceiling-right": ["top-left", "top-right", "bottom-right"],
        }[this.shape];
        return Math.min(GameUtils.rayIntersectsSegment(rayStart, rayDirection, tileSquare.getCorner(endpoints[0]), tileSquare.getCorner(endpoints[1])), GameUtils.rayIntersectsSegment(rayStart, rayDirection, tileSquare.getCorner(endpoints[1]), tileSquare.getCorner(endpoints[2])), GameUtils.rayIntersectsSegment(rayStart, rayDirection, tileSquare.getCorner(endpoints[2]), tileSquare.getCorner(endpoints[0])));
    }
    blocksMovement(tilePosition, collideable, direction, hitboxes, newHitboxes) {
        return newHitboxes.some(h => this.intersects(h, tilePosition));
    }
    rectIntersectionDistance(tilePosition, rect, direction) {
        if (this.intersects(rect, tilePosition)) {
            return 0;
        }
        const tileSquare = Tiles.getTileSquare(tilePosition);
        const rayDirection = Vector.unit(direction);
        if (Directions.isHorizontal(direction)) {
            const topCorner = rect.getCorner(Directions.createDiagonal[direction]["up"]);
            const bottomCorner = rect.getCorner(Directions.createDiagonal[direction]["down"]);
            return Math.min(...[
                ...[topCorner, bottomCorner].map(c => this.rayIntersectionDistance(tilePosition, c, rayDirection))
            ], ...[tileSquare.top, tileSquare.bottom].filter(y => y >= rect.top && y <= rect.bottom)
                .map(y => this.rayIntersectionDistance(tilePosition, new Vector(topCorner.x, y), rayDirection)));
        }
        else {
            const leftCorner = rect.getCorner(Directions.createDiagonal["left"][direction]);
            const rightCorner = rect.getCorner(Directions.createDiagonal["right"][direction]);
            return Math.min(...[
                ...[leftCorner, rightCorner].map(c => this.rayIntersectionDistance(tilePosition, c, rayDirection)),
                ...[tileSquare.left, tileSquare.right].filter(x => x >= rect.left && x <= rect.right)
                    .map(x => this.rayIntersectionDistance(tilePosition, new Vector(x, leftCorner.y), rayDirection)),
            ]);
        }
    }
    static isSlope(value) {
        return WorldData.SLOPES.includes(value);
    }
    corners(tilePosition) {
        const tileSquare = Tiles.getTileSquare(tilePosition);
        const topLeft = new Vector(tileSquare.left, tileSquare.top);
        const topRight = new Vector(tileSquare.right, tileSquare.top);
        const bottomLeft = new Vector(tileSquare.left, tileSquare.bottom);
        const bottomRight = new Vector(tileSquare.right, tileSquare.bottom);
        return ({
            "slope-floor-left": [topLeft, bottomLeft, bottomRight],
            "slope-floor-right": [topRight, bottomLeft, bottomRight],
            "slope-ceiling-left": [topLeft, topRight, bottomLeft],
            "slope-ceiling-right": [topLeft, topRight, bottomRight],
        })[this.shape];
    }
}
//# sourceMappingURL=SlopeTile.mjs.map