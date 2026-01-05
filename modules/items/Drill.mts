import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { World } from "../world/World";
import { DrillEntity } from "./item-entities/DrillEntity.mjs";

export class Drill {
	use(world: World, canvasIO: CanvasIO) {
		const direction = world.player.throwDirection(canvasIO);
		const entity = new DrillEntity(direction);
		world.player.throw(entity, world, canvasIO);
		if(Directions.isHorizontal(direction)) {
			entity.velocity.y = 0;
		}
	}
}
