import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { World } from "../world/World";

/* eslint @typescript-eslint/no-unused-vars: 0 */

export abstract class Entity {
	abstract display(canvasIO: CanvasIO, world: World): void;
	displayGlowEffect(canvasIO: CanvasIO) { }
	displayDebug(canvasIO: CanvasIO) { }

	abstract update(world: World, canvasIO: CanvasIO): void;
	damage(hurtbox: Rectangle, world: World, canvasIO: CanvasIO) {
		world.entities.removeEntity(this);
	}

	abstract hitboxes(): Rectangle[];
	abstract boundingBox(): Rectangle;
}
