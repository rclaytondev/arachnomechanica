import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

export abstract class Entity {
	abstract render(world: World): Renderable[];
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	displayDebug(canvasIO: CanvasIO, world: World) { }

	abstract update(world: World, canvasIO: CanvasIO): void;
	abstract boundingBox(): Rectangle;
}
