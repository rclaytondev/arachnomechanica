import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity } from "./World";

export class Entities {
	positions: Map<Entity, Vector[]> = new Map();
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
		const positions = this.entityGridPositions(entity.boundingBox()).squares();
		for(const position of positions) {
			this.addEntityToGrid(entity, position);
		}
		this.positions.set(entity, positions);
	}
	moveEntity(entity: Entity) {
		if(!this.positions.has(entity)) {
			return;
		}
		const positions = this.entityGridPositions(entity.boundingBox()).squares();
		for(const position of positions) {
			this.addEntityToGrid(entity, position);
		}
		for(const position of this.positions.get(entity) ?? []) {
			if(!positions.some(p => p.equals(position))) {
				this.removeEntityFromGrid(entity, position);
			}
		}
		this.positions.set(entity, positions);
	}
	removeEntity(entity: Entity) {
		const positions = this.entityGridPositions(entity.boundingBox());
		for(const position of positions.squares()) {
			this.removeEntityFromGrid(entity, position);
		}
		this.positions.delete(entity);
	}
	allEntities() {
		const values = [...this.entities.values()].filter(v => v != null);
		return Utils.union(...values);
	}

	private addEntityToGrid(entity: Entity, gridSquare: Vector) {
		const entities = this.entities.get(gridSquare);
		if(entities) {
			entities.add(entity);
		}
		else {
			this.entities.set(gridSquare, new Set([entity]));
		}
	}
	private removeEntityFromGrid(entity: Entity, gridSquare: Vector) {
		const entities = this.entities.get(gridSquare);
		if(entities) {
			entities.delete(entity);
			if(entities.size === 0) {
				this.entities.set(gridSquare, null);
			}
		}
	}
}
