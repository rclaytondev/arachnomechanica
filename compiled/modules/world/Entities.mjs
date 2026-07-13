import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { BoundingBoxStructure } from "../game-utilities/BoundingBoxStructure.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Octants } from "../game-utilities/Octant.mjs";
import { Renderable } from "./Renderer.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
export class Entities extends BoundingBoxStructure {
    constructor(entities = []) {
        super(WorldData.ENTITY_CHUNK_SIZE, (e) => e.boundingBox());
        for (const entity of entities) {
            this.add(entity);
        }
    }
    update(world, canvasIO, camera) {
        const entities = camera ? this.possiblyIntersecting(camera.visibleRegion(canvasIO, WorldData.ENTITY_UPDATE_DISTANCE)) : this;
        for (const entity of entities) {
            entity.update(world, canvasIO);
        }
    }
    collideablesIntersecting(rectangle, collides = () => true) {
        return new Set([...this.possiblyIntersecting(rectangle)].filter(e => e instanceof Collideable && collides(e) && e.hitboxes().some(h => h.interiorIntersects(rectangle))));
    }
    angularMotionBlockers(point, collides = () => true) {
        const nearEntities = this.collideablesIntersecting(Rectangle.square(point.x - 1, point.y - 1, 2));
        const hitboxes = [...nearEntities].filter(collides).flatMap(e => e.hitboxes());
        return [...new Set(hitboxes.flatMap(h => Octants.octantsOfRect(point, h))
                .flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]))];
    }
    rayIntersectionDistance(position, direction, collides = () => true, maxLength) {
        let result = Infinity;
        const furthestEndpoint = position.add(direction.multiply(maxLength));
        const rectangle = Rectangle.fromOppositeCorners(position, furthestEndpoint);
        for (const entity of this.possiblyIntersecting(rectangle)) {
            if (!(entity instanceof Collideable) || !collides(entity) || !entity.tangible) {
                continue;
            }
            for (const hitbox of entity.hitboxes()) {
                result = Math.min(result, GameUtils.rayIntersectsRectangle(position, direction, hitbox));
            }
        }
        return result;
    }
    rectIntersectionDistance(rect, direction, maxDistance, collides) {
        const searchRegion = Rectangle.boundingBox([rect, rect.translate(Vector.unit(direction).multiply(maxDistance))]);
        const entities = this.possiblyIntersecting(searchRegion);
        const hitboxes = [...entities].filter(e => e instanceof Collideable && collides(e) && e.tangible).flatMap(e => e.hitboxes());
        const distances = hitboxes.map(h => GameUtils.rectIntersectionDistance(rect, direction, h));
        return Math.min(maxDistance, ...distances);
    }
    render(camera, renderer, canvasIO, world) {
        const region = camera.visibleRegion(canvasIO, WorldData.ENTITY_RENDER_DISTANCE);
        for (const entity of this.possiblyIntersecting(region)) {
            for (const renderable of entity.render(world)) {
                renderer.renderables.push(renderable);
            }
            if (entity instanceof Collideable) {
                renderer.renderables.push(new Renderable((c) => entity.displayHitboxes(c), "hitbox"));
            }
        }
    }
}
//# sourceMappingURL=Entities.mjs.map