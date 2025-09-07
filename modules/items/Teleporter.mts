import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../world/World";

export class Teleporter {
	use(world: World, canvasIO: CanvasIO) {
		const directionY = canvasIO.keys.ArrowUp ? -1 : (canvasIO.keys.ArrowDown ? 1 : 0);
		const directionX = (directionY === 0) ? Vector.unit(world.player.facing).x : 0;
		const direction = new Vector(directionX, directionY);
		let collided = false;
		while(!collided) {
			world.player.move(direction, world, { onCollision: () => { collided = true; }});
		}
	}
}
