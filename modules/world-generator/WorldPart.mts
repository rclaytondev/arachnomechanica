import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { RoomEntity } from "../level-generator/Room.mjs";
import { Entities } from "../world/Entities.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";

export class WorldPart<EntityType extends RoomEntity> {
	tiles: Tiles;
	entities: Entities<EntityType>;

	constructor(tiles: Tiles, entities: Entities<EntityType>) {
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
