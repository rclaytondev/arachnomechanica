import { SetUtils } from "../../utils-ts/modules/core-extensions/SetUtils.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { HashSet } from "../../utils-ts/modules/HashSet.mjs";

export class BoundingBoxStructure<T> {
	boundingBox: (entity: T) => Rectangle;
	chunkSize: number;
	private positions = new Map<T, Vector[]>();
	private entities = new Grid<Set<T> | null>(null);

	constructor(chunkSize: number, boundingBox: (entity: T) => Rectangle) {
		this.chunkSize = chunkSize;
		this.boundingBox = boundingBox;
	}



	private entityGridPositions(rectangle: Rectangle) {
		return Rectangle.fromBounds(
			Math.floor(rectangle.left() / this.chunkSize),
			Math.ceil((rectangle.right() + 1) / this.chunkSize),
			Math.floor(rectangle.top() / this.chunkSize),
			Math.ceil((rectangle.bottom() + 1) / this.chunkSize),
		);
	}
	add(entity: T) {
		const positions = this.entityGridPositions(this.boundingBox(entity)).squares();
		for(const position of positions) {
			this.addEntityToGrid(entity, position);
		}
		this.positions.set(entity, positions);
	}
	updatePosition(entity: T) {
		if(!this.positions.has(entity)) {
			return;
		}
		const positions = this.entityGridPositions(this.boundingBox(entity)).squares();
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
	has(entity: T) {
		return this.positions.has(entity);
	}
	delete(entity: T) {
		for(const position of this.positions.get(entity) ?? []) {
			this.removeEntityFromGrid(entity, position);
		}
		this.positions.delete(entity);
	}
	clear() {
		this.positions = new Map();
		this.entities = new Grid(null);
	}
	*[Symbol.iterator]() {
		const values = [...this.entities.values()].filter(v => v != null);
		yield* SetUtils.union(...values);
	}
	possiblyIntersecting(rectangle: Rectangle) {
		const positions = [...this.entityGridPositions(rectangle).squares()];
		return new Set(positions.flatMap(v => [...(this.entities.get(v) ?? [])]));
	}

	private addEntityToGrid(entity: T, gridSquare: Vector) {
		const entities = this.entities.get(gridSquare);
		if(entities) {
			entities.add(entity);
		}
		else {
			this.entities.set(gridSquare, new Set([entity]));
		}
	}
	private removeEntityFromGrid(entity: T, gridSquare: Vector) {
		const entities = this.entities.get(gridSquare);
		if(entities) {
			entities.delete(entity);
			if(entities.size === 0) {
				this.entities.set(gridSquare, null);
			}
		}
	}

	isValid(entity: T) {
		const squares1 = this.entityGridPositions(this.boundingBox(entity)).squares();
		const squares2 = this.positions.get(entity);
		const squares3 = [...this.entities.positions()].filter(p => (this.entities.get(p) ?? new Set()).has(entity));

		if(squares2) {
			const set1 = new HashSet(squares1);
			const set2 = new HashSet(squares2);
			const set3 = new HashSet(squares3);
			return set1.equals(set2) && set2.equals(set3);
		}
		else {
			return squares3.length === 0;
		}
	}
}
