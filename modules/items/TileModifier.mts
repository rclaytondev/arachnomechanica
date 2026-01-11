import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Collideable } from "../game-utilities/Collideable.mjs";
import { TileWithPosition, World } from "../world/World";
import { ThrowableTileEntity } from "./ThrowableTileEntity.mjs";

/* eslint @typescript-eslint/no-unused-vars: 0 */

export abstract class TileModifier {
	gravity: "normal" | "none" | "reverse" = "normal";
	frictionY: number | null = 1;

	update(world: World, canvasIO: CanvasIO) { }
	abstract displayIcon(canvasIO: CanvasIO, world: World): void;
	onCollision(tile: ThrowableTileEntity, collider: Collideable | TileWithPosition, direction: Direction, world: World, canvasIO: CanvasIO) { }
}
