import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { HealthPickupData, RoomData, WorldData } from "../constants/GameData.mjs";
import { RectangularCollideable } from "../game-utilities/Collideable.mjs";

export class HealthPickup extends RectangularCollideable {
	constructor(tilePosition: Vector) {
		super(Rectangle.square(
			tilePosition.x * WorldData.TILE_SIZE,
			tilePosition.y * WorldData.TILE_SIZE,
			HealthPickupData.SIZE,
		));
	}

	display(canvasIO: CanvasIO) {
		const image = HealthPickupData.IMAGE;
		canvasIO.ctx.drawImage(image, this.hitbox.x, this.hitbox.y);
	}
	update() {}

	copy() {
		return new HealthPickup(this.hitbox.getCorner("top-left").divide(WorldData.TILE_SIZE));
	}
	copyAndTranslate(amount: Vector) {
		const copy = this.copy();
		copy.translate(amount);
		return copy;
	}
	reflect() {
		return new HealthPickup(new Vector(
			RoomData.SIZE - this.hitbox.x / WorldData.TILE_SIZE,
			this.hitbox.y / WorldData.TILE_SIZE,
		));
	}
}
