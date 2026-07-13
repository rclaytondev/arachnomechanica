import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Octants } from "../game-utilities/Octant.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Tile } from "./Tile.mjs";
export class BasicTile extends Tile {
    copy() {
        return this;
    }
    reflect() {
        return this;
    }
    equals(tile) {
        return tile instanceof BasicTile;
    }
    contains(point, tilePosition) {
        const square = Tiles.getTileSquare(tilePosition);
        return square.contains(point);
    }
    solidOctants(tilePosition, point) {
        return Octants.octantsOfRect(point, Tiles.getTileSquare(tilePosition));
    }
    angularMotionBlockers(tilePosition, point) {
        const octants = this.solidOctants(tilePosition, point);
        return [...new Set(octants.flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]))];
    }
    intersects(rect, tilePosition) {
        const tileSquare = Tiles.getTileSquare(tilePosition);
        return rect.intersects(tileSquare);
    }
    addToPath(position, canvasIO) {
        canvasIO.ctx.rect(position.x * WorldData.TILE_SIZE - 1, position.y * WorldData.TILE_SIZE - 1, WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2);
    }
    rayIntersectionDistance(tilePosition, rayStart, rayDirection) {
        return GameUtils.rayIntersectsRectangle(rayStart, rayDirection, Tiles.getTileSquare(tilePosition));
    }
    rectIntersectionDistance(tilePosition, rect, direction) {
        const tileSquare = Tiles.getTileSquare(tilePosition);
        return GameUtils.rectIntersectionDistance(rect, direction, tileSquare);
    }
    blocksMovement(tilePosition, collideable, direction, hitboxes, newHitboxes) {
        const tileSquare = Tiles.getTileSquare(tilePosition);
        return newHitboxes.some(h => h.interiorIntersects(tileSquare));
    }
    corners(tilePosition) {
        const square = Tiles.getTileSquare(tilePosition);
        return square.getCorners();
    }
}
//# sourceMappingURL=BasicTile.mjs.map