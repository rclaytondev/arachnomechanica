import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
export class Tiles extends Grid {
    constructor() {
        super(EmptyTile.EMPTY);
    }
    static getTileX(onscreenX) {
        return Math.floor(onscreenX / WorldData.TILE_SIZE);
    }
    static getTileY(onscreenY) {
        return Math.floor(onscreenY / WorldData.TILE_SIZE);
    }
    static getTileCoordinates(onscreenPosition) {
        return new Vector(Math.floor(onscreenPosition.x / WorldData.TILE_SIZE), Math.floor(onscreenPosition.y / WorldData.TILE_SIZE));
    }
    static getTileSquare(tilePosition) {
        return Rectangle.square(tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);
    }
    getTileAt(onscreenPosition) {
        return this.get(Tiles.getTileCoordinates(onscreenPosition));
    }
    *getTilesAt(rectangle) {
        const left = Tiles.getTileX(rectangle.left);
        const right = Tiles.getTileX(rectangle.right - 1);
        const top = Tiles.getTileY(rectangle.top);
        const bottom = Tiles.getTileY(rectangle.bottom - 1);
        for (let x = left; x <= right; x++) {
            for (let y = top; y <= bottom; y++) {
                yield { position: new Vector(x, y), tile: this.get(x, y) };
            }
        }
    }
    angularMotionBlockers(point, direction) {
        const getGridValues = (value) => [...new Set([
                Math.floor(value / WorldData.TILE_SIZE),
                Math.ceil(value / WorldData.TILE_SIZE) - 1,
            ])];
        const xValues = getGridValues(point.x);
        const yValues = getGridValues(point.y);
        return xValues.map(x => (yValues.map(y => (this.get(x, y).angularMotionBlockers(new Vector(x, y), point, direction))))).flat(2);
    }
    rayIntersectionDistance(rayStart, rayDirection, maxDistance, ignoredTiles = []) {
        let result = Infinity;
        let iterationsSinceFound = -Infinity;
        for (const tilePosition of GameUtils.gridSquaresOnRay(rayStart, rayDirection, maxDistance, WorldData.TILE_SIZE)) {
            const tile = this.get(tilePosition);
            if (!ignoredTiles.includes(tile)) {
                const distance = this.get(tilePosition).rayIntersectionDistance(tilePosition, rayStart, rayDirection);
                result = Math.min(result, distance);
                if (result !== Infinity) {
                    iterationsSinceFound = 0;
                }
            }
            if (iterationsSinceFound >= 3) {
                return result;
            }
            iterationsSinceFound++;
        }
        return result;
    }
    rectIntersectionDistance(rect, direction, maxDistance) {
        const tileRect = Rectangle.boundingBox([rect, rect.translate(Vector.unit(direction).multiply(maxDistance))]);
        const tiles = [...this.getTilesAt(tileRect)];
        const distances = tiles.map(({ position, tile }) => (tile.rectIntersectionDistance(position, rect, direction)));
        return Math.min(maxDistance, ...distances);
    }
    colliding(rectangle, collides = () => true) {
        const tiles = [];
        for (const { position, tile } of this.getTilesAt(rectangle)) {
            if (collides({ position, tile }) && tile.intersects(rectangle, position)) {
                tiles.push({ position, tile });
            }
        }
        return tiles;
    }
    blockingMovement(collideable, direction, hitboxes, newHitboxes) {
        const tiles = [];
        for (const hitbox of hitboxes) {
            for (const { position, tile } of this.getTilesAt(hitbox.extend("all", 1))) {
                if (!tiles.some(t => t.position.equals(position)) &&
                    tile.blocksMovement(position, collideable, direction, hitboxes, newHitboxes)) {
                    tiles.push({ position, tile });
                }
            }
        }
        return tiles;
    }
    render(camera, renderer, canvasIO, world) {
        const region = camera.visibleTileRegion(canvasIO, 0);
        for (const position of region.squares()) {
            for (const renderable of this.get(position).render(position, world)) {
                renderer.renderables.push(renderable);
            }
        }
    }
    copy() {
        const copy = new Tiles();
        for (const [tile, position] of this.entries()) {
            copy.set(position, tile);
        }
        return copy;
    }
}
//# sourceMappingURL=Tiles.mjs.map