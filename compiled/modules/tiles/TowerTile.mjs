import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { BasicTile } from "./BasicTile.mjs";
import { SlopeTile } from "./SlopeTile.mjs";
export class TowerTile extends BasicTile {
    static TOWER_TILE = new TowerTile();
    constructor() {
        super();
    }
    render(position, world) {
        return [
            new Renderable(c => this.display(c, position.x, position.y), "tile"),
            new Renderable(c => this.displayAccent(position, c, world), "tile-accent"),
        ];
    }
    displayAccent(position, canvasIO, world) {
        TowerTile.displayTileAccent(position, canvasIO, world);
    }
    display(canvasIO, x, y) {
        canvasIO.ctx.fillStyle = WorldData.TILE_COLORS["tower"];
        canvasIO.ctx.beginPath();
        this.addToPath(new Vector(x, y), canvasIO);
        canvasIO.ctx.fill();
    }
    static displaySlopedAccent(position, canvasIO, tile, world) {
        const inwardNormal = {
            "slope-floor-left": new Vector(-1, 1),
            "slope-floor-right": new Vector(1, 1),
            "slope-ceiling-left": new Vector(-1, -1),
            "slope-ceiling-right": new Vector(1, -1),
        }[tile];
        const tangent = inwardNormal.rotate(90);
        const center = position.add(1 / 2, 1 / 2).multiply(WorldData.TILE_SIZE);
        const [adjacentDirection1, perpendicularDirection1] = {
            "slope-floor-left": ["left", "up"],
            "slope-floor-right": ["down", "left"],
            "slope-ceiling-left": ["up", "right"],
            "slope-ceiling-right": ["right", "down"],
        }[tile];
        const distance1 = this.getSlopeAccentLength(position, adjacentDirection1, perpendicularDirection1, world);
        const [adjacentDirection2, perpendicularDirection2] = {
            "slope-floor-left": ["down", "right"],
            "slope-floor-right": ["right", "up"],
            "slope-ceiling-left": ["left", "down"],
            "slope-ceiling-right": ["up", "left"],
        }[tile];
        const distance2 = this.getSlopeAccentLength(position, adjacentDirection2, perpendicularDirection2, world);
        const endpoint1 = center.add(inwardNormal.multiply(WorldData.TILE_ACCENT_INSET / Math.SQRT2)).add(tangent.normalize().multiply(distance1));
        const endpoint2 = center.add(inwardNormal.multiply(WorldData.TILE_ACCENT_INSET / Math.SQRT2)).subtract(tangent.normalize().multiply(distance2));
        canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
        canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
        canvasIO.ctx.lineCap = "round";
        canvasIO.strokeLine(endpoint1.x, endpoint1.y, endpoint2.x, endpoint2.y);
        const directions = TowerTile.slopeEdges(tile);
        for (const [edge, direction] of [directions, [...directions].reverse()]) {
            const edgeCenter = center.add(Vector.unit(edge).multiply(WorldData.TILE_ACCENT_RADIUS));
            if (!TowerTile.isEdgeBasicSolid(world.originalTiles.get(position.add(Vector.unit(edge))), Directions.opposite[edge])) {
                const vertex1 = edgeCenter.add(Vector.unit(direction).multiply(-(WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2))));
                const vertex2 = edgeCenter.add(Vector.unit(direction).multiply(TowerTile.getAccentLength(position, edge, direction, world)));
                canvasIO.strokeLine(vertex1.x, vertex1.y, vertex2.x, vertex2.y);
            }
        }
    }
    static getSlopeAccentLength(position, adjacentDirection, perpendicularDirection, world) {
        const angle = TowerTile.angle(position, adjacentDirection, perpendicularDirection, false, world.originalTiles);
        const defaultLength = WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2);
        return {
            0: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2),
            45: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET,
            90: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET / 2,
            135: WorldData.TILE_SIZE * Math.SQRT2 / 2,
            180: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
            225: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET,
        }[angle] ?? defaultLength;
    }
    static getAccentLength(position, side, direction, world) {
        const angle = TowerTile.angle(position, direction, side, false, world.originalTiles);
        const defaultLength = WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 + 1);
        return {
            0: WorldData.TILE_ACCENT_RADIUS,
            45: WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
            90: WorldData.TILE_SIZE / 2,
            135: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
            180: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET,
        }[angle] ?? defaultLength;
    }
    static displayTileAccent(position, canvasIO, world) {
        canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
        canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
        canvasIO.ctx.lineCap = "butt";
        const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
        for (const side of Directions.DIRECTIONS) {
            const adjacentTile = world.originalTiles.get(position.add(Vector.unit(side)));
            if (TowerTile.isEdgeBasicSolid(adjacentTile, Directions.opposite[side])) {
                continue;
            }
            const edgeCenter = center.add(Vector.unit(side).multiply(WorldData.TILE_ACCENT_RADIUS));
            for (const direction of [Directions.rotateClockwise[side], Directions.rotateCounterclockwise[side]]) {
                const length = this.getAccentLength(position, side, direction, world);
                canvasIO.strokeLine(edgeCenter.x, edgeCenter.y, edgeCenter.x + Vector.unit(direction).x * length, edgeCenter.y + Vector.unit(direction).y * length);
            }
        }
    }
    static slopeEdges(tile) {
        return {
            "slope-floor-left": ["left", "down"],
            "slope-floor-right": ["right", "down"],
            "slope-ceiling-left": ["left", "up"],
            "slope-ceiling-right": ["right", "up"],
        }[tile];
    }
    static isEdgeBasicSolid(tile, direction) {
        if (tile instanceof SlopeTile) {
            const edges = TowerTile.slopeEdges(tile.shape);
            return edges.includes(direction);
        }
        return tile instanceof BasicTile;
    }
    static angle(position, adjacentDirection, perpendicularDirection, empty = true, tiles) {
        /* Returns the angle before encountering a solid/empty, when first moving in `adjacentDirection` and then in `perpendicularDirection` and then in a circle after that. */
        const tile = tiles.get(position);
        const adjacent = tiles.get(position.add(Vector.unit(adjacentDirection)));
        const diagonal = tiles.get(position.add(Vector.unit(adjacentDirection)).add(Vector.unit(perpendicularDirection)));
        const perpendicular = tiles.get(position.add(Vector.unit(perpendicularDirection)));
        if (TowerTile.isEdgeBasicSolid(adjacent, Directions.opposite[adjacentDirection]) === empty) {
            return 0;
        }
        if (TowerTile.isEdgeBasicSolid(adjacent, perpendicularDirection) === empty && adjacent instanceof SlopeTile) {
            return 45;
        }
        if (TowerTile.isEdgeBasicSolid(diagonal, Directions.opposite[perpendicularDirection]) === empty) {
            return 90;
        }
        if (TowerTile.isEdgeBasicSolid(diagonal, Directions.opposite[adjacentDirection]) === empty && diagonal instanceof SlopeTile) {
            return 135;
        }
        if (TowerTile.isEdgeBasicSolid(perpendicular, adjacentDirection) === empty) {
            return 180;
        }
        if (TowerTile.isEdgeBasicSolid(perpendicular, Directions.opposite[perpendicularDirection]) === empty && perpendicular instanceof SlopeTile) {
            return 225;
        }
        if (TowerTile.isEdgeBasicSolid(tile, perpendicularDirection) === empty) {
            return 270;
        }
        if (TowerTile.isEdgeBasicSolid(tile, adjacentDirection) === empty && tile instanceof SlopeTile) {
            return 315;
        }
        return 360;
    }
}
//# sourceMappingURL=TowerTile.mjs.map