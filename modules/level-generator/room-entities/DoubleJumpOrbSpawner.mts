import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData, WorldData } from "../../constants/GameData.mjs";
import { DoubleJumpOrb } from "../../entities/DoubleJumpOrb.mjs";
import { World } from "../../game-engine/world/World.mjs";
import { FixedEntitySpawner } from "../FixedEntitySpawner.mjs";

export class DoubleJumpOrbSpawner extends FixedEntitySpawner {
	position: Vector;
	constructor(position: Vector) {
		super();
		this.position = position;
	}
	static atTile(tilePos: Vector) {
		return new DoubleJumpOrbSpawner(tilePos.multiply(WorldData.TILE_SIZE));
	}

	spawn(tileOffset: Vector, world: World): void {
		world.entities.add(new DoubleJumpOrb(this.position.add(tileOffset.multiply(WorldData.TILE_SIZE)), world));
	}

	reflect(): FixedEntitySpawner {
		return new DoubleJumpOrbSpawner(new Vector(
			RoomData.SIZE * WorldData.TILE_SIZE - this.position.x,
			this.position.y,
		));
	}
}
