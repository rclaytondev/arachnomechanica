import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { ItemData, RoomData, WorldData } from "../constants/GameData.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { ThrowableTileEntity } from "./ThrowableTileEntity.mjs";
export class ThrowableTile {
    modifiers;
    constructor(modifiers) {
        this.modifiers = modifiers;
    }
    use(world, canvasIO) {
        const entity = new ThrowableTileEntity(new Vector(0, 0), this.modifiers);
        entity.reset();
        return world.player.throw(entity, world, canvasIO);
    }
    displayIcon(canvasIO, displayRect) {
        const entity = new ThrowableTileEntity(new Vector(0, 0), this.modifiers);
        const center = displayRect.center();
        entity.reset();
        entity.hitbox = entity.hitbox.translate(center.subtract(entity.hitbox.width / 2, entity.hitbox.height / 2));
        entity.display(canvasIO);
    }
}
LoadingManager.onload(() => {
    EntitySpawner.registerMandatoryEntityType((tileRegion, safeRegion, world) => {
        EntitySpawner.spawnEntities(tileRegion.area() / (RoomData.SIZE ** 2) * ItemData.BLOCK.BLOCKS_PER_ROOM, ItemData.BLOCK.BLOCKS_SPAWN_EVENNESS, tileRegion, [
            EntitySpawner.spawnRequirements.replaceEmpty,
            EntitySpawner.spawnRequirements.noAdjacentGates,
            EntitySpawner.spawnRequirements.leftOrRightEmpty,
            EntitySpawner.spawnRequirements.solidBelow,
            EntitySpawner.spawnRequirements.notOnPortal,
        ], (position, world) => {
            return world.addEntityIfEmpty(new ThrowableTileEntity(position.multiply(WorldData.TILE_SIZE), []));
        }, safeRegion, world);
    });
});
//# sourceMappingURL=ThrowableTile.mjs.map