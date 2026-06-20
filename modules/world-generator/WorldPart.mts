import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { RoomEntity } from "../level-generator/Room.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";
import { Entities } from "../world/Entities.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Slope, World } from "../world/World.mjs";

export class WorldPart<EntityType extends RoomEntity> {
	tiles: Tiles;
	entities: Entities<EntityType>;

	static parseTiles(tilesData: { x: number, y: number, type: | "solid" | "platform" | Slope }[]) {
		const tiles = new Tiles();
		for(const { x, y, type } of tilesData) {
			const tile = (
				type === "solid" ? BasicTile.BASIC_TILE
				: World.isSlope(type as string) ? new SlopeTile(type as Slope)
				: Platform.PLATFORM
			);
			tiles.set(x, y, tile);
		}
		return tiles;
	}
	static parse(tilesData: { x: number, y: number, type: | "solid" | "platform" | Slope }[], entitiesData: RoomEntity[]) {
		const tiles = WorldPart.parseTiles(tilesData);
		const entities = new Entities(entitiesData);
		return new WorldPart(tiles, entities);
	}

	constructor(tiles: Tiles = new Tiles(), entities: Entities<EntityType> = new Entities()) {
		this.tiles = tiles;
		this.entities = entities;
	}

	add(world: World, tileOffset: Vector) {
		for(const [tile, position] of this.tiles.entries()) {
			const copy = tile.copy(); // TODO: remove this (all tiles are singletons now)
			world.addOriginalTile(position.add(tileOffset), copy);
		}
		for(const entity of this.entities) {
			world.entities.add(entity.copyAndTranslate(tileOffset.multiply(WorldData.TILE_SIZE)));
		}
	}
}
