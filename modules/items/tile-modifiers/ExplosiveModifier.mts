import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Explosion } from "../../game-utilities/Explosion.mjs";
import { World } from "../../world/World.mjs";
import { ThrowableTileEntity } from "../ThrowableTileEntity.mjs";
import { TileModifier } from "../TileModifier.mjs";
import { CollisionEvent } from "../../game-utilities/physics-engine/CollisionEvent.mjs";

export class ExplosiveModifier extends TileModifier {
	onCollision(tile: ThrowableTileEntity, collision: CollisionEvent, world: World, canvasIO: CanvasIO): void {
		const explosion = new Explosion(tile.hitbox.center());
		explosion.explode(world, canvasIO);
	}

	displayIcon(): void {
		// TODO
	}

	reset() { }
}
