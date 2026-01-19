import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { BoundingBoxStructure } from "../game-utilities/BoundingBoxStructure.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Octants } from "../game-utilities/Octant.mjs";

export class Entities extends BoundingBoxStructure<Entity> {
	constructor() {
		super(WorldData.ENTITY_CHUNK_SIZE, (e) => e.boundingBox());
	}

	collideablesIntersecting(rectangle: Rectangle, collides: (collideable: Collideable) => boolean = () => true) {
		return new Set([...this.possiblyIntersecting(rectangle)].filter(
			e => e instanceof Collideable && collides(e) && e.hitboxes().some(h => h.interiorIntersects(rectangle)),
		)) as Set<Collideable>;
	}

	angularMotionBlockers(point: Vector, collides: (entity: Collideable) => boolean = () => true): (Direction | Diagonal)[] {
		const nearEntities = this.collideablesIntersecting(Rectangle.square(point.x - 1, point.y - 1, 2));
		const hitboxes = [...nearEntities].filter(collides).flatMap(e => e.hitboxes());
		return [...new Set(
			hitboxes.flatMap(h => Octants.octantsOfRect(point, h))
			.flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]),
		)];
	}
}
