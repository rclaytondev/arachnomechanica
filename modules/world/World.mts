import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Player } from "../Player.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Entities } from "./Entities.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tile } from "../tiles/Tile.mjs";
import { Tiles } from "./Tiles.mjs";
import { WorldScreen } from "./WorldScreen.mjs";
import { Camera } from "./Camera.mjs";
import { WorldGenerator } from "../world-generator/WorldGenerator.mjs";
import { Renderable, Renderer } from "./Renderer.mjs";
import { Particles } from "../game-utilities/Particles.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { Slope, SlopeTile } from "../tiles/SlopeTile.mjs";
import { StaticEntities } from "../game-utilities/StaticEntity.mjs";

export type TileWithPosition = { position: Vector, tile: Tile };

export class World {
	tiles: Tiles = new Tiles();
	originalTiles: Tiles = new Tiles();
	entities: Entities = new Entities();
	particles: Particles = new Particles();
	worldScreen: WorldScreen | null = null;
	worldGenerator: WorldGenerator | null = null;
	player: Player = new Player();
	staticEntities: StaticEntities = new StaticEntities();

	constructor(enableGeneration: boolean) {
		if(enableGeneration) {
			this.worldGenerator = new WorldGenerator();
			this.worldGenerator.towerGenerator.initialize(this);
		}
		this.entities.add(this.player);
	}

	render(canvasIO: CanvasIO, camera: Camera, renderer: Renderer) {
		this.entities.render(camera, renderer, canvasIO, this);
		this.staticEntities.render(renderer, this);
		this.tiles.render(camera, renderer, canvasIO, this);
		this.particles.render(renderer);

		renderer.renderables.push(new Renderable(
			() => {
				canvasIO.ctx.save();
				camera.applyTranslation(canvasIO);
			},
			"camera-translation",
		));
		renderer.renderables.push(new Renderable(
			() => canvasIO.ctx.restore(),
			"reset-camera-translation",
		));
		renderer.renderables.push(new Renderable(
			() => Debug.displayMouseCoordinates(canvasIO, camera),
			"debug-mouse-coordinates",
		));
	}

	update(canvasIO: CanvasIO, camera?: Camera) {
		this.entities.update(this, canvasIO, camera);
		this.staticEntities.update(this, canvasIO);
		this.particles.update();
		this.worldGenerator?.update(this);
	}

	onSlope(rectangle: Rectangle, slope: Slope, mode: "up" | "down") {
		const corner = rectangle.getCorner(({
			"slope-floor-right": "bottom-right",
			"slope-floor-left": "bottom-left",
			"slope-ceiling-right": "bottom-right",
			"slope-ceiling-left": "bottom-left",
		} as const)[slope]);
		const position = (mode === "up") ? new Vector(
			(slope === "slope-floor-left" || slope === "slope-ceiling-left") ? Math.ceil(corner.x / WorldData.TILE_SIZE) - 1 : Math.floor(corner.x / WorldData.TILE_SIZE),
			Math.ceil(corner.y / WorldData.TILE_SIZE) - 1,
		) : new Vector(
			(slope === "slope-floor-left" || slope === "slope-ceiling-left") ? Math.floor(corner.x / WorldData.TILE_SIZE) : Math.ceil(corner.x / WorldData.TILE_SIZE) - 1,
			Math.floor(corner.y / WorldData.TILE_SIZE),
		);
		const tile = this.tiles.get(position);
		return tile instanceof SlopeTile && tile.shape === slope && tile.slopeIntersectionDistance(rectangle, position, false) === 0;
	}
	isInSolid(rectangle: Rectangle, collides: (object: TileWithPosition | Entity) => boolean = () => true) {
		return this.tiles.colliding(rectangle, collides).length !== 0 || this.entities.collideablesIntersecting(rectangle, collides).size !== 0;
	}
	lineIntersectionDistance(position: Vector, direction: Vector, maxDistance: number, ignoredTiles: Tile[] = [], collides: (entity: Entity) => boolean = () => true) {
		return Math.min(
			this.tiles.rayIntersectionDistance(position, direction, maxDistance, ignoredTiles),
			this.entities.rayIntersectionDistance(position, direction, collides, maxDistance),
			maxDistance,
		);
	}
	rectIntersectionDistance(rect: Rectangle, direction: Direction, maxDistance: number, collides: (entity: Entity) => boolean) {
		return Math.min(
			this.tiles.rectIntersectionDistance(rect, direction, maxDistance),
			this.entities.rectIntersectionDistance(rect, direction, maxDistance, collides),
			maxDistance,
		);
	}
	hasLineOfSight(position: Vector, rectangle: Rectangle, collides: (entity: Entity) => boolean) {
		const center = rectangle.center();
		const direction = center.subtract(position);
		const distance = GameUtils.rayIntersectsRectangle(position, direction, rectangle);
		return distance <= this.lineIntersectionDistance(position, direction, distance, [], collides);
	}

	angularMotionBlockers(point: Vector, direction: "clockwise" | "counterclockwise", collides: (e: Collideable) => boolean) {
		const blockers = new Set([
			...this.entities.angularMotionBlockers(point, collides),
			...this.tiles.angularMotionBlockers(point, direction),
		]);
		const opposite = (direction === "clockwise" ? "counterclockwise" : "clockwise");
		return [...blockers].filter(b => !blockers.has(Directions.rotate45[opposite][b]));
	}


	destroyTile(position: Vector) {
		this.tiles.set(position, EmptyTile.EMPTY);
	}
	addTile(position: Vector, tile: Tile) {
		this.tiles.set(position, tile);
	}
	removeTile(position: Vector) {
		this.tiles.set(position, EmptyTile.EMPTY);
	}
	addOriginalTile(position: Vector, tile: Tile) {
		this.addTile(position, tile);
		this.originalTiles.set(position, tile);
	}
	addEntityIfEmpty(entity: Collideable) {
		if(!entity.hitboxes().some(h => this.isInSolid(h))) {
			this.entities.add(entity);
			return true;
		}
		return false;
	}
	damage(hurtbox: Rectangle, canvasIO: CanvasIO, damages: (e: Entity) => boolean = () => true) {
		if(this.player.hitbox.intersects(hurtbox) && damages(this.player)) {
			this.player.damage(hurtbox, this);
		}
		for(const entity of this.entities.collideablesIntersecting(hurtbox)) {
			if(damages(entity)) {
				entity.damage(hurtbox, this, canvasIO);
			}
		}
	}

	intersectingEntities() {
		const entities = [...this.entities].filter(e => e instanceof Collideable);
		const pairs = entities.flatMap((e1, i1) => entities.slice(i1 + 1).map(e2 => [e1, e2] as [Collideable, Collideable]));
		return pairs.filter(([e1, e2]) => e1.intersects(e2));
	}
}
