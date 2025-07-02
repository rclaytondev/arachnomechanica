import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity } from "./World";

export class Entities {
	entities: Grid<Set<Entity> | null> = new Grid(null);


	entityGridPositions(rectangle: Rectangle) {
		return Rectangle.fromBounds(
			Math.floor(rectangle.left() / WorldData.ENTITY_CHUNK_SIZE),
			Math.ceil(rectangle.right() / WorldData.ENTITY_CHUNK_SIZE),
			Math.floor(rectangle.top() / WorldData.ENTITY_CHUNK_SIZE),
			Math.ceil(rectangle.bottom() / WorldData.ENTITY_CHUNK_SIZE),
		);
	}
	addEntity(entity: Entity) {
		const positions = this.entityGridPositions(entity.boundingBox());
		for(const position of positions.squares()){
			const entities = this.entities.get(position);
			if(entities) {
				entities.add(entity);
			}
			else {
				this.entities.set(position, new Set([entity]));
			}
		}
	}
	removeEntity(entity: Entity) {
		const positions = this.entityGridPositions(entity.boundingBox());
		for(const position of positions.squares()) {
			const entities = this.entities.get(position);
			if(entities) {
				entities.delete(entity);
				if(entities.size === 0) {
					this.entities.set(position, null);
				}
			}
		}
	}
	allEntities() {
		const values = [...this.entities.values()].filter(v => v != null);
		return Utils.union(...values);
	}
}
