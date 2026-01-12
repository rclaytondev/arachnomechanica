import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Collideable } from "../../game-utilities/physics-engine/Collideable.mjs";
import { Explosion } from "../../game-utilities/Explosion.mjs";
import { TileWithPosition, World } from "../../world/World.mjs";
import { ThrowableTileEntity } from "../ThrowableTileEntity.mjs";
import { TileModifier } from "../TileModifier.mjs";

export class ExplosiveModifier extends TileModifier {
	onCollision(tile: ThrowableTileEntity, collider: Collideable | TileWithPosition, direction: Direction, world: World, canvasIO: CanvasIO): void {
		const explosion = new Explosion(tile.hitbox.center());
		explosion.explode(world, canvasIO);
	}

	displayIcon(): void {
		// TODO
	}

	reset() { }
}
