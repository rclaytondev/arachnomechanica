import { canvasIO, CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Tile, TileWithPosition, World } from "../world/World";

/* eslint @typescript-eslint/no-unused-vars: 0 */

export abstract class Entity {
	abstract display(canvasIO: CanvasIO, world: World): void;
	displayGlowEffect(canvasIO: CanvasIO) { }
	displayDebug(canvasIO: CanvasIO) { }

	abstract update(world: World, canvasIO: CanvasIO): void;
	abstract boundingBox(): Rectangle;
}
