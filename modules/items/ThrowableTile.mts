import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../world/World";
import { ThrowableTileEntity } from "./ThrowableTileEntity.mjs";
import { TileModifier } from "./TileModifier.mjs";

export class ThrowableTile {
	modifiers: TileModifier[];

	constructor(modifiers: TileModifier[]) {
		this.modifiers = modifiers;
	}

	use(world: World, canvasIO: CanvasIO) {
		const entity = new ThrowableTileEntity(new Vector(0, 0), this.modifiers);
		entity.reset();
		return world.player.throw(entity, world, canvasIO);
	}
}
