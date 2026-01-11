import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { World } from "../world/World";

/* eslint @typescript-eslint/no-unused-vars: 0 */

export abstract class TileModifier {
	gravity: "normal" | "none" | "reverse" = "normal";
	frictionY: number | null = 1;

	update(world: World, canvasIO: CanvasIO) { }
	abstract displayIcon(canvasIO: CanvasIO, world: World): void;
}
