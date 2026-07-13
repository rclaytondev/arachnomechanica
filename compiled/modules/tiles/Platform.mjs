import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Tile } from "./Tile.mjs";
export class Platform extends Tile {
    constructor() {
        super();
    }
    static PLATFORM = new Platform();
    render(position, world) {
        return [new Renderable(c => this.display(c, position.x, position.y, world), "tile")];
    }
    display(canvasIO, x, y, world) {
        canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
        canvasIO.ctx.fillRect(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE + 1, 2 * WorldData.TILE_ACCENT_INSET);
        const platformLeft = (world.tiles.get(x - 1, y) === Platform.PLATFORM);
        const platformRight = (world.tiles.get(x + 1, y) === Platform.PLATFORM);
        const accentStart = platformLeft ? -1 : WorldData.TILE_ACCENT_INSET;
        const accentEnd = WorldData.TILE_SIZE - (platformRight ? -1 : WorldData.TILE_ACCENT_INSET);
        const accentY = y * WorldData.TILE_SIZE + WorldData.TILE_ACCENT_INSET;
        canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
        canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
        canvasIO.strokeLine(x * WorldData.TILE_SIZE + accentStart, accentY, x * WorldData.TILE_SIZE + accentEnd, accentY);
    }
    equals(tile) {
        return tile instanceof Platform;
    }
    copy() {
        return this;
    }
    reflect() {
        return this;
    }
    intersects() {
        return false;
    }
    angularMotionBlockers(tilePosition, point, direction) {
        const onTop = (point.y === tilePosition.y * WorldData.TILE_SIZE);
        const left = tilePosition.x * WorldData.TILE_SIZE;
        const right = (tilePosition.x + 1) * WorldData.TILE_SIZE;
        if (direction === "clockwise") {
            return (onTop && point.x >= left && point.x < right) ? ["right"] : [];
        }
        else {
            return (onTop && point.x > left && point.x <= right) ? ["left"] : [];
        }
    }
    rayIntersectionDistance(tilePosition, rayStart, rayDirection) {
        if (rayDirection.y <= 0) {
            return Infinity;
        }
        return GameUtils.rayIntersectsHSegment(rayStart, rayDirection, tilePosition.y * WorldData.TILE_SIZE, tilePosition.x * WorldData.TILE_SIZE, (tilePosition.x + 1) * WorldData.TILE_SIZE);
    }
    blocksMovement(tilePosition, collideable, direction, hitboxes) {
        return direction === "down" && hitboxes.some(hitbox => (hitbox.bottom === tilePosition.y * WorldData.TILE_SIZE
            && hitbox.right >= tilePosition.x * WorldData.TILE_SIZE
            && hitbox.left <= (tilePosition.x + 1) * WorldData.TILE_SIZE));
    }
    rectIntersectionDistance(tilePosition, rect, direction) {
        if (direction !== "down") {
            return Infinity;
        }
        const tileSquare = Tiles.getTileSquare(tilePosition);
        return GameUtils.rectIntersectionDistance(rect, direction, tileSquare);
    }
    corners(tilePosition) {
        const rect = Tiles.getTileSquare(tilePosition);
        return [new Vector(rect.left, rect.top), new Vector(rect.right, rect.top)];
    }
}
//# sourceMappingURL=Platform.mjs.map