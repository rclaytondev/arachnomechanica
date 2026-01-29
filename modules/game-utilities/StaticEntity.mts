import { World } from "../world/World.mjs";

export abstract class StaticEntity {
	abstract update(world: World): void;
}

export class StaticEntities {
	entitiesList: StaticEntity[] = [];

	update(world: World) {
		for(const entity of this.entitiesList) {
			entity.update(world);
		}
	}
}
