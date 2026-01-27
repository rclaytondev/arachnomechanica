import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { ItemData, RoomData, WorldData } from "../constants/GameData.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { World } from "../world/World.mjs";
import { ThrowableTileEntity } from "./ThrowableTileEntity.mjs";
import { TileModifier } from "./TileModifier.mjs";

export class ThrowableTile {
	modifiers: TileModifier[];

	constructor(modifiers: TileModifier[]) {
		this.modifiers = modifiers;
	}

	use(world: World, canvasIO: CanvasIO) {
		const entity = new ThrowableTileEntity(new Vector(0, 0), this.modifiers);
		entity.reset();
		return world.player.throw(entity, world, canvasIO);
	}
}


LoadingManager.onload(() => {
	EntitySpawner.registerMandatoryEntityType((tileRegion: Rectangle, safeRegion: Rectangle, world: World) => {
		EntitySpawner.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * ItemData.BLOCK.BLOCKS_PER_ROOM,
			ItemData.BLOCK.BLOCKS_SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceEmpty,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.leftOrRightEmpty,
				EntitySpawner.spawnRequirements.solidBelow,
			],
			(position: Vector, world: World) => {
				return world.addEntityIfEmpty(new ThrowableTileEntity(position.multiply(WorldData.TILE_SIZE), []));
			},
			safeRegion,
			world,
		);
	});
});
