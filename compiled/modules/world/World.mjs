import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Player } from "../Player.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Entities } from "./Entities.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tiles } from "./Tiles.mjs";
import { WorldGenerator } from "../world-generator/WorldGenerator.mjs";
import { Renderable } from "./Renderer.mjs";
import { Particles } from "../game-utilities/Particles.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";
import { StaticEntities } from "../game-utilities/StaticEntity.mjs";
export class World {
    tiles = new Tiles();
    originalTiles = new Tiles();
    entities = new Entities();
    particles = new Particles();
    worldScreen = null;
    worldGenerator = null;
    player = new Player();
    staticEntities = new StaticEntities();
    constructor(enableGeneration) {
        if (enableGeneration) {
            this.worldGenerator = new WorldGenerator();
            this.worldGenerator.towerGenerator.initialize(this);
        }
        this.entities.add(this.player);
    }
    render(canvasIO, camera, renderer) {
        this.entities.render(camera, renderer, canvasIO, this);
        this.staticEntities.render(renderer, this, camera);
        this.tiles.render(camera, renderer, canvasIO, this);
        this.particles.render(renderer);
        renderer.renderables.push(new Renderable(() => {
            canvasIO.ctx.save();
            camera.applyTranslation(canvasIO);
        }, "camera-translation"));
        renderer.renderables.push(new Renderable(() => canvasIO.ctx.restore(), "reset-camera-translation"));
        renderer.renderables.push(new Renderable(() => Debug.displayMouseCoordinates(canvasIO, camera), "debug-mouse-coordinates"));
    }
    update(canvasIO, camera) {
        this.entities.update(this, canvasIO, camera);
        this.staticEntities.update(this, canvasIO);
        this.particles.update();
        this.worldGenerator?.update(this);
    }
    onSlope(rectangle, slope, mode) {
        const corner = rectangle.getCorner({
            "slope-floor-right": "bottom-right",
            "slope-floor-left": "bottom-left",
            "slope-ceiling-right": "bottom-right",
            "slope-ceiling-left": "bottom-left",
        }[slope]);
        const position = (mode === "up") ? new Vector((slope === "slope-floor-left" || slope === "slope-ceiling-left") ? Math.ceil(corner.x / WorldData.TILE_SIZE) - 1 : Math.floor(corner.x / WorldData.TILE_SIZE), Math.ceil(corner.y / WorldData.TILE_SIZE) - 1) : new Vector((slope === "slope-floor-left" || slope === "slope-ceiling-left") ? Math.floor(corner.x / WorldData.TILE_SIZE) : Math.ceil(corner.x / WorldData.TILE_SIZE) - 1, Math.floor(corner.y / WorldData.TILE_SIZE));
        const tile = this.tiles.get(position);
        return tile instanceof SlopeTile && tile.shape === slope && tile.slopeIntersectionDistance(rectangle, position, false) === 0;
    }
    isInSolid(rectangle, collides = () => true) {
        return this.tiles.colliding(rectangle, collides).length !== 0 || this.entities.collideablesIntersecting(rectangle, collides).size !== 0;
    }
    lineIntersectionDistance(position, direction, maxDistance, ignoredTiles = [], collides = () => true) {
        return Math.min(this.tiles.rayIntersectionDistance(position, direction, maxDistance, ignoredTiles), this.entities.rayIntersectionDistance(position, direction, collides, maxDistance), maxDistance);
    }
    rectIntersectionDistance(rect, direction, maxDistance, collides) {
        return Math.min(this.tiles.rectIntersectionDistance(rect, direction, maxDistance), this.entities.rectIntersectionDistance(rect, direction, maxDistance, collides), maxDistance);
    }
    hasLineOfSight(position, rectangle, collides) {
        const center = rectangle.center();
        const direction = center.subtract(position);
        const distance = GameUtils.rayIntersectsRectangle(position, direction, rectangle);
        return distance <= this.lineIntersectionDistance(position, direction, distance, [], collides);
    }
    angularMotionBlockers(point, direction, collides) {
        const blockers = new Set([
            ...this.entities.angularMotionBlockers(point, collides),
            ...this.tiles.angularMotionBlockers(point, direction),
        ]);
        const opposite = (direction === "clockwise" ? "counterclockwise" : "clockwise");
        return [...blockers].filter(b => !blockers.has(Directions.rotate45[opposite][b]));
    }
    destroyTile(position) {
        this.tiles.set(position, EmptyTile.EMPTY);
    }
    addTile(position, tile) {
        this.tiles.set(position, tile);
    }
    removeTile(position) {
        this.tiles.set(position, EmptyTile.EMPTY);
    }
    addOriginalTile(position, tile) {
        this.addTile(position, tile);
        this.originalTiles.set(position, tile);
    }
    addEntityIfEmpty(entity) {
        if (!entity.hitboxes().some(h => this.isInSolid(h))) {
            this.entities.add(entity);
            return true;
        }
        return false;
    }
    damage(hurtbox, canvasIO, damages = () => true) {
        if (this.player.hitbox.intersects(hurtbox) && damages(this.player)) {
            this.player.damage(hurtbox, this);
        }
        for (const entity of this.entities.collideablesIntersecting(hurtbox)) {
            if (damages(entity) && entity.damageable) {
                entity.damage(hurtbox, this, canvasIO);
            }
        }
    }
    static intersectingSolids(tiles, entities) {
        const collideables = [...entities].filter(e => e instanceof Collideable);
        const entityCollisions = collideables.flatMap((e1, i1) => collideables.slice(i1 + 1).map(e2 => [e1, e2]));
        const tileCollisions = collideables.flatMap(e => tiles.filter(t => e.hitboxes().some(h => t.tile.intersects(h, t.position))).map(t => [e, t]));
        return [...entityCollisions, ...tileCollisions];
    }
}
//# sourceMappingURL=World.mjs.map