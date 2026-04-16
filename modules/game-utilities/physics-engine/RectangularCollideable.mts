import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../../world/World.mjs";
import { Collideable, MoveUnitOptions } from "./Collideable.mjs";

export abstract class RectangularCollideable extends Collideable {
	hitbox: Rectangle;

	constructor(hitbox: Rectangle) {
		super();
		const corner = hitbox.getCorner("top-left");
		this.hitbox = new Rectangle(
			Math.floor(hitbox.x), Math.floor(hitbox.y),
			hitbox.width, hitbox.height,
		);
		this.subpixel = corner.subtract(corner.floor());
	}

	hitboxes() {
		return [this.hitbox];
	}
	boundingBox() {
		return this.hitbox;
	}
	translate(amount: Vector, world: World): void {
		this.hitbox.x += amount.x;
		this.hitbox.y += amount.y;
		world.entities.updatePosition(this);
	}

	extend(amount: number, direction: Direction, world: World, canvasIO: CanvasIO, options: MoveUnitOptions) {
		if(amount < 0) {
			this.hitbox = this.hitbox.extend(direction, Math.floor(amount));
		}
		for(let i = 0; i < amount; i ++) {
			const moved = this.moveUnit(direction, world, canvasIO, options);
			if(moved) {
				this.hitbox = this.hitbox.extend(Directions.opposite[direction], 1);
			}
		}
	}
}
