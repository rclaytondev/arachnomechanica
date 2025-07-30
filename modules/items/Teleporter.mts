import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../world/World";

export class Teleporter {
	use(world: World, canvasIO: CanvasIO) {
		const directionY = canvasIO.keys.ArrowUp ? -1 : (canvasIO.keys.ArrowDown ? 1 : 0);
		const directionX = (directionY === 0) ? Vector.unit(world.player.facing).x : 0;
		const direction = new Vector(directionX, directionY);
		let box = world.player.physicsObject.hitbox();
		while(!world.isInSolid(box)) {
			box = box.translate(direction);
		}
		box = box.translate(direction.multiply(-1));
		world.player.physicsObject.positionInt = box.center().subtract(box.width / 2, box.height / 2);
	}
}
