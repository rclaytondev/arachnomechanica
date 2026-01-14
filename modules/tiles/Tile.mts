import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { World } from "../world/World.mjs";

export abstract class Tile {
	abstract display(canvasIO: CanvasIO, x: number, y: number, world: World): void;
	abstract copy(): Tile;
}
