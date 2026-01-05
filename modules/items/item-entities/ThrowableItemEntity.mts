import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, PlayerData } from "../../constants/GameData.mjs";
import { RectangularCollideable } from "../../game-utilities/Collideable.mjs";
import { World } from "../../world/World";

export abstract class ThrowableItemEntity extends RectangularCollideable {
	velocity: Vector = new Vector(0, 0);

	constructor(hitbox: Rectangle) {
		super(hitbox);
	}

	update(world: World, _canvas: CanvasIO) {
		this.velocity.x *= ItemData.FRICTION_X;
		this.velocity.y += PlayerData.GRAVITY;
		this.move(this.velocity, world, {
			onCollision: (direction) => {
				if(Directions.isVertical(direction)) {
					this.velocity.y = 0;
				}
			},
			collides: (obj) => obj !== this,
		});
		world.entities.moveEntity(this);
	}
}
