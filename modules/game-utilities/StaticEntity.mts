import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Camera } from "../world/Camera.mjs";
import { Renderable, Renderer } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

export abstract class StaticEntity {
	abstract update(world: World, canvasIO: CanvasIO): void;
	abstract render(world: World, camera: Camera): Renderable[];
}

export class StaticEntities {
	entitiesList: StaticEntity[] = [];

	update(world: World, canvasIO: CanvasIO) {
		for(const entity of this.entitiesList) {
			entity.update(world, canvasIO);
		}
	}
	render(renderer: Renderer, world: World, camera: Camera) {
		for(const entity of this.entitiesList) {
			for(const renderable of entity.render(world, camera)) {
				renderer.renderables.push(renderable);
			}
		}
	}

	delete(entity: StaticEntity) {
		this.entitiesList = this.entitiesList.filter(e => e !== entity);
	}
	add(entity: StaticEntity) {
		this.entitiesList.push(entity);
	}
}
