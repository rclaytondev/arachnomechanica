import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { Entities } from "../world/Entities.mjs";
import { Tiles } from "../world/Tiles.mjs";
export class WorldPart {
    tiles;
    entities;
    static parseTiles(tilesData) {
        const tiles = new Tiles();
        for (const { x, y, type } of tilesData) {
            const tile = (type === "solid" ? TowerTile.TOWER_TILE
                : SlopeTile.isSlope(type) ? new TowerSlope(type)
                    : Platform.PLATFORM);
            tiles.set(x, y, tile);
        }
        return tiles;
    }
    static parse(tilesData, entitiesData) {
        const tiles = WorldPart.parseTiles(tilesData);
        const entities = new Entities(entitiesData);
        return new WorldPart(tiles, entities);
    }
    constructor(tiles = new Tiles(), entities = new Entities()) {
        this.tiles = tiles;
        this.entities = entities;
    }
    add(world, tileOffset) {
        for (const [tile, position] of this.tiles.entries()) {
            const copy = tile.copy(); // TODO: remove this (all tiles are singletons now)
            world.addOriginalTile(position.add(tileOffset), copy);
        }
        for (const entity of this.entities) {
            world.entities.add(entity.copyAndTranslate(tileOffset.multiply(WorldData.TILE_SIZE)));
        }
    }
    extend(direction, amount) {
        /* Copies the first/last row/column to increase the size by the specified amount. */
        const copy = new WorldPart(this.tiles.copy(), new Entities([...this.entities].map(e => e.copy())));
        const boundingBox = this.tiles.boundingBox();
        if (Directions.isHorizontal(direction)) {
            const sourceX = (direction === "left") ? boundingBox.left : (boundingBox.right - 1);
            for (let i = 0; i < amount; i++) {
                const targetX = (direction === "left") ? (boundingBox.left - i - 1) : (boundingBox.right + i);
                for (let y = boundingBox.top; y < boundingBox.bottom; y++) {
                    copy.tiles.set(targetX, y, this.tiles.get(sourceX, y));
                }
            }
        }
        else {
            const sourceY = (direction === "up") ? boundingBox.top : (boundingBox.bottom - 1);
            for (let i = 0; i < amount; i++) {
                const targetY = (direction === "up") ? (boundingBox.top - i - 1) : (boundingBox.bottom + i);
                for (let x = boundingBox.left; x < boundingBox.right; x++) {
                    copy.tiles.set(x, targetY, this.tiles.get(x, sourceY));
                }
            }
        }
        return copy;
    }
}
//# sourceMappingURL=WorldPart.mjs.map