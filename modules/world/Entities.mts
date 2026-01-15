import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { SetUtils } from "../../utils-ts/modules/core-extensions/SetUtils.mjs";

export class Entities {
	positions: Map<Entity, Vector[]> = new Map();
	entities: Grid<Set<Entity> | null> = new Grid(null);


	entityGridPositions(rectangle: Rectangle) {
		return Rectangle.fromBounds(
			Math.floor(rectangle.left() / WorldData.ENTITY_CHUNK_SIZE),
			Math.ceil((rectangle.right() + 1) / WorldData.ENTITY_CHUNK_SIZE),
			Math.floor(rectangle.top() / WorldData.ENTITY_CHUNK_SIZE),
			Math.ceil((rectangle.bottom() + 1) / WorldData.ENTITY_CHUNK_SIZE),
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
	hasEntity(entity: Entity) {
		return this.positions.has(entity);
	}
	removeEntity(entity: Entity) {
		for(const position of this.positions.get(entity) ?? []) {
			this.removeEntityFromGrid(entity, position);
		}
		this.positions.delete(entity);
	}
	clear() {
		this.positions = new Map();
		this.entities = new Grid(null);
	}
	allEntities() {
		const values = [...this.entities.values()].filter(v => v != null);
		return SetUtils.union(...values);
	}
	entitiesPossiblyIntersecting(rectangle: Rectangle) {
		const positions = [...this.entityGridPositions(rectangle).squares()];
		return new Set(positions.flatMap(v => [...(this.entities.get(v) ?? [])]));
	}
	collideablesIntersecting(rectangle: Rectangle, collides: (collideable: Collideable) => boolean = () => true) {
		return new Set([...this.entitiesPossiblyIntersecting(rectangle)].filter(
			e => e instanceof Collideable && collides(e) && e.hitboxes().some(h => h.interiorIntersects(rectangle)),
		)) as Set<Collideable>;
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
