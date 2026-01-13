import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { ThrowableTileEntity } from "./ThrowableTileEntity.mjs";

/* eslint @typescript-eslint/no-unused-vars: 0 */

export abstract class TileModifier {
	gravity: "normal" | "none" | "reverse" = "normal";
	frictionY: number | null = 1;

	update(tile: ThrowableTileEntity, world: World, canvasIO: CanvasIO) { }
	abstract displayIcon(canvasIO: CanvasIO, world: World): void;
	onCollision(tile: ThrowableTileEntity, collision: CollisionEvent, world: World, canvasIO: CanvasIO) { }
	abstract reset(): void;
}
