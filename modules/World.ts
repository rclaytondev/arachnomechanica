import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { BackgroundData, LevelGeneratorData, PlayerData, RoomData, WorldData } from "./constants/GameData.mjs";
import { Main } from "./Main.js";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { Particle } from "./game-utilities/Particle.mjs";
import { Player } from "./Player.mjs";
import { Room } from "./level-generator/Room.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { GearsBackground } from "./backgrounds/GearsBackground.mjs";
import { SkyBackground } from "./backgrounds/SkyBackground.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { LaserBlock } from "./tiles/LaserBlock.mjs";
import { Lizard } from "./entities/Lizard.js";
import { Spikeball } from "./entities/Spikeball.mjs";
import { SpikeballBlock } from "./tiles/SpikeballBlock.mjs";
import { Portal } from "./entities/Portal.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { Humanoid } from "./entities/Humanoid.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { TowerTile } from "./tiles/TowerTile.mjs";
import { SolidTile } from "./tiles/SolidTile.mjs";
import { StoneTile } from "./tiles/StoneTile.mjs";
import { WorldGenerator } from "./level-generator/WorldGenerator.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { Spider } from "./entities/Spider.mjs";

export type TileEntity = SolidTile | Gate | LaserBlock | SpikeballBlock;
export type Tile = (typeof WorldData.STRING_TILE_TYPES)[number] | TileEntity;
export type Slope = (typeof WorldData.SLOPES)[number];
export type TileWithPosition = { x: number, y: number, tile: Tile };
export type Entity = Lizard | Spikeball | Portal | Humanoid | Spider;

export class World {
	tiles: Grid<Tile> = new Grid("empty");
	entities: Entity[] = [];
	tileEntities: { position: Vector, tile: TileEntity }[] = [];
	particles: Particle[] = [];
	gearsBackground: GearsBackground = GearsBackground.generate();
	skyBackground: SkyBackground = new SkyBackground();
	screenShakeTimer: number = 0;
	screenShakeIntensity: number = 0;
	camera: Vector = new Vector(0, 0);
	levels: number = 0;
	worldGenerator: WorldGenerator = new WorldGenerator();
	enableGeneration: boolean;

	player: Player = new Player();

	constructor(enableGeneration: boolean) {
		this.enableGeneration = enableGeneration;
	}

	initializeGeneration() {
		this.worldGenerator.generateChunk(new Vector(0, 0), this);
		this.spawnPlayer();
		return this;
	}
	spawnPlayer() {
		const emptyTiles = [];
		for(const position of Rectangle.square(0, 0, RoomData.SIZE).squares()) {
			const tileBelow = this.tiles.get(position.x, position.y + 1);
			if(this.tiles.get(position) === "empty" && tileBelow instanceof SolidTile && tileBelow.shape === "solid") {
				emptyTiles.push(position);
			}
		}
		const tile = Utils.randomItem(emptyTiles);
		this.player.physicsObject.positionInt = tile.multiply(WorldData.TILE_SIZE)
		this.camera = this.player.physicsObject.hitbox().center();
	}

	display(canvasIO: CanvasIO, visibleRegion: Rectangle = this.visibleRegion(canvasIO)) {
		this.displayBackground(canvasIO);
		canvasIO.ctx.save();
		this.applyScreenShake(canvasIO);
		const translation = this.translationToCamera(canvasIO);
		canvasIO.ctx.translate(translation.x, translation.y);
		this.displayGlowEffects(canvasIO, visibleRegion);
		this.displayLaserBlocks(canvasIO, visibleRegion);
		this.displayLasers(canvasIO);
		if(!this.player.dead) {
			this.player.display(canvasIO);
		}
		this.displayParticles(canvasIO);
		this.displayEntities(canvasIO);
		this.displayTiles(canvasIO, visibleRegion);
		this.displaytTileAccents(canvasIO, visibleRegion);
		this.displayDebugInfo(canvasIO);
		canvasIO.ctx.restore();
		this.player.displayEnergyBar(canvasIO);

		if(DEBUG_SETTINGS.SHOW_MOUSE_COORDINATES) {
			this.displayMouseCoordinates(canvasIO);
		}
	}
	applyScreenShake(canvasIO: CanvasIO) {
		if(this.screenShakeTimer > 0) {
			const amountX = GameUtils.random(-this.screenShakeIntensity, this.screenShakeIntensity);
			const amountY = GameUtils.random(-this.screenShakeIntensity, this.screenShakeIntensity);
			canvasIO.ctx.translate(amountX, amountY);
		}
	}
	displayBackground(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.fillCanvas(BackgroundData.BACKGROUND_COLOR);
		this.gearsBackground.display(canvasIO, this.camera);
		canvasIO.ctx.restore();
	}
	translationToCamera(canvasIO: CanvasIO) {
		return new Vector(canvasIO.canvas.width / 2 - this.camera.x, canvasIO.canvas.height / 2 - this.camera.y);
	}
	visibleRegion(canvasIO: CanvasIO) {
		const center = this.camera.divide(WorldData.TILE_SIZE);
		return Rectangle.fromBounds(
			Math.floor(center.x - (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)),
			Math.ceil(center.x + (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)),
			Math.floor(center.y - (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)),
			Math.ceil(center.y + (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE))
		);
	}
	displayGlowEffects(canvasIO: CanvasIO, visibleRegion: Rectangle) {
		for(const entity of this.entities) {
			if("displayGlowEffect" in entity) {
				entity.displayGlowEffect(canvasIO);
			}
		}
		for(let x = visibleRegion.left(); x < visibleRegion.right(); x ++) {
			for(let y = visibleRegion.top(); y < visibleRegion.bottom(); y ++) {
				const position = new Vector(x, y);
				const tile = this.tiles.get(position);
				if(tile instanceof SolidTile && tile.shape === "solid" && tile.texture === "tower") {
					TowerTile.displayTileGlow(position, canvasIO, this);
				}
				else if(World.isSlopeTile(tile) && tile.texture === "tower") {
					TowerTile.displaySlopeGlow(position, canvasIO, tile.shape, this);
				}
			}
		}
		for(const { tile, position } of this.tileEntities) {
			if(tile instanceof LaserBlock) {
				tile.displayLaserGlow(canvasIO, position.x, position.y, this);
			}
			else if(tile instanceof SpikeballBlock) {
				tile.displayGlow(canvasIO, position.x, position.y);
			}
		}

		for(const particle of this.particles) {
			particle.displayGlow(canvasIO);
		}
	}
	displayLaserBlocks(canvasIO: CanvasIO, visibleRegion: Rectangle) {
		for(let x = visibleRegion.left(); x < visibleRegion.right(); x ++) {
			for(let y = visibleRegion.top(); y < visibleRegion.bottom(); y ++) {
				const tile = this.tiles.get(x, y);
				if(tile instanceof LaserBlock) {
					tile.display(canvasIO, x, y);
				}
			}
		}
	}
	displayLasers(canvasIO: CanvasIO) {
		for(const { tile, position } of this.tileEntities) {
			if(tile instanceof LaserBlock) {
				tile.displayLasers(canvasIO, position.x, position.y, this);
			}
		}
	}
	displayTiles(canvasIO: CanvasIO, region: Rectangle) {
		for(let x = region.left(); x < region.right(); x ++) {
			for(let y = region.top(); y < region.bottom(); y ++) {
				const position = new Vector(x, y);
				const tile = this.tiles.get(position);
				if(tile instanceof SolidTile) {
					SolidTile.displayTile(position, canvasIO, tile);
				}
				else if(tile === "platform") {
					canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
					canvasIO.ctx.fillRect(
						x * WorldData.TILE_SIZE,
						y * WorldData.TILE_SIZE,
						WorldData.TILE_SIZE, WorldData.PLATFORM_THICKNESS
					);
				}
				else if(typeof tile !== "string" && "display" in tile && !(tile instanceof LaserBlock)) {
					tile.display(canvasIO, x, y);
				}
				else if(tile instanceof LaserBlock) {
					// tile.displayBarrels(canvasIO, x, y);
				}
			}
		}

		StoneTile.displayStoneTiles(this, canvasIO, region);
	}
	displaytTileAccents(canvasIO: CanvasIO, region: Rectangle) {
		for(let x = region.left(); x < region.right(); x ++) {
			for(let y = region.top(); y < region.bottom(); y ++) {
				const position = new Vector(x, y);
				const tile = this.tiles.get(position);
				if(tile instanceof SolidTile && tile.shape === "solid" && tile.texture === "tower") {
					TowerTile.displayTileAccent(position, canvasIO, this);
				}
				else if(World.isSlopeTile(tile) && tile.texture === "tower") {
					TowerTile.displaySlopedAccent(position, canvasIO, tile.shape, this);
				}
			}
		}
	}
	displayEntities(canvasIO: CanvasIO) {
		for(const entity of this.entities) {
			entity.display(canvasIO);
		}
	}
	displayParticles(canvasIO: CanvasIO) {
		for(const particle of this.particles) {
			particle.display(canvasIO);
		}
	}
	displayMouseCoordinates(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = "rgb(200, 200, 200)";
		const coordinates = canvasIO.mouse.position.subtract(this.translationToCamera(canvasIO)).divide(WorldData.TILE_SIZE).floor();
		canvasIO.ctx.font = "20px monospace";
		canvasIO.ctx.textAlign = "left";
		canvasIO.ctx.textBaseline = "top";
		canvasIO.ctx.fillText(coordinates.toString(), canvasIO.mouse.position.x, canvasIO.mouse.position.y);
	}
	displayDebugInfo(canvasIO: CanvasIO) {
		for(const entity of this.entities) {
			if("displayHitbox" in entity) {
				entity.displayHitbox(canvasIO);
			}
			else if("displayHitboxes" in entity) {
				entity.displayHitboxes(canvasIO);
			}
			else if("displayDebug" in entity) {
				entity.displayDebug(canvasIO);
			}
		}
	}

	update(canvasIO: CanvasIO) {
		this.updateEntities(canvasIO);
		this.player.update(this, canvasIO);
		this.updateTiles(canvasIO);
		this.updateParticles();
		this.screenShakeTimer --;
		this.updateCamera();
		this.checkWorldGeneration();
	}
	updateEntities(canvasIO: CanvasIO) {
		for(const entity of this.entities) {
			entity.update(this, canvasIO);
		}
		this.entities = this.entities.filter(c => !("dead" in c) || !c.dead);
	}
	updateTiles(canvasIO: CanvasIO) {
		for(const { tile, position } of this.tileEntities) {
			if("update" in tile) {
				tile.update(this, position.x, position.y, canvasIO);
			}
		}
		Gate.cooldown --;
	}
	updateParticles() {
		for(const particle of this.particles) {
			particle.update();
		}
		this.particles = this.particles.filter(p => !p.isDead());
	}
	updateCamera() {
		if(!(Main.screen instanceof RoomEditor)) {
			this.camera = GameUtils.moveVectorTowards(this.camera, this.player.physicsObject.hitbox().center(), WorldData.CAMERA_SPEED);
		}
	}

	checkWorldGeneration() {
		if(!this.enableGeneration) { return; }
		const position = this.player.physicsObject.hitbox().center();
		const chunk = position.divide(WorldData.TILE_SIZE * RoomData.SIZE * LevelGeneratorData.CHUNK_SIZE).floor();
		for(const adjacent of [chunk, ...chunk.adjacentVectors()]) {
			if(!this.worldGenerator.isChunkGenerated(adjacent)) {
				this.worldGenerator.generateChunk(adjacent, this);
			}
		}
	}

	getTileX(onscreenX: number) {
		return Math.floor(onscreenX / WorldData.TILE_SIZE);
	}
	getTileY(onscreenY: number) {
		return Math.floor(onscreenY / WorldData.TILE_SIZE);
	}
	getTileCoordinates(onscreenPosition: Vector) {
		return new Vector(
			Math.floor(onscreenPosition.x / WorldData.TILE_SIZE), 
			Math.floor(onscreenPosition.y / WorldData.TILE_SIZE)
		);
	}
	getTileAt(onscreenPosition: Vector) {
		return this.tiles.get(this.getTileCoordinates(onscreenPosition));
	}
	*getTilesAt(rectangle: Rectangle) {
		const tiles = [];
		const left = this.getTileX(rectangle.left());
		const right = this.getTileX(rectangle.right() - 1);
		const top = this.getTileY(rectangle.top());
		const bottom = this.getTileY(rectangle.bottom() - 1);
		for(let x = left; x <= right; x ++) {
			for(let y = top; y <= bottom; y ++) {
				yield { position: new Vector(x, y), tile: this.tiles.get(x, y) };
			}
		}
	}
	slopeIntersectionDistance(rectangle: Rectangle, position: Vector, slope: Slope) {
		const tileRectangle = Rectangle.square(position.x, position.y, 1).scale(WorldData.TILE_SIZE);
		if(!rectangle.intersects(tileRectangle)) { return -Infinity; }
		const center = tileRectangle.center();
		if(slope === "slope-floor-left") {
			const corner = rectangle.getCorner("bottom-left");
			return center.x + corner.y - center.y - corner.x;
		}
		else if(slope === "slope-floor-right") {
			const corner = rectangle.getCorner("bottom-right");
			return corner.x - (center.x + center.y - corner.y);
		}
		else if(slope === "slope-ceiling-left") {
			const corner = rectangle.getCorner("top-left");
			return center.x + center.y - corner.y - corner.x;
		}
		else {
			const corner = rectangle.getCorner("top-right");
			return corner.x - (center.x + corner.y - center.y);
		}
	}
	intersectsSlope(rectangle: Rectangle, position: Vector, slope: Slope) {
		return this.slopeIntersectionDistance(rectangle, position, slope) > 0;
	}
	onSlope(rectangle: Rectangle, slope: Slope) {
		const corner = rectangle.getCorner(({
			"slope-floor-right": "bottom-right",
			"slope-floor-left": "bottom-left",
			"slope-ceiling-right": "bottom-right",
			"slope-ceiling-left": "bottom-left"
		} as const)[slope]);
		const position = new Vector(
			(slope === "slope-floor-left" || slope === "slope-ceiling-left") ? Math.ceil(corner.x / WorldData.TILE_SIZE) - 1 : Math.floor(corner.x / WorldData.TILE_SIZE),
			Math.ceil(corner.y / WorldData.TILE_SIZE) - 1
		);
		const tile = this.tiles.get(position);
		return tile instanceof SolidTile && tile.shape === slope && this.slopeIntersectionDistance(rectangle, position, slope) === 0;
	}
	collidingTiles(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		const tiles = [];
		for(const { position, tile } of this.getTilesAt(rectangle)) {
			const { x, y } = position;
			if(collides({ x, y, tile }) && (
				tile instanceof SolidTile && tile.shape === "solid" ||
				(tile instanceof Gate && tile.openness !== 1 && rectangle.intersects(tile.getPhysicsBox(x, y))) ||
				tile instanceof LaserBlock ||
				tile instanceof SpikeballBlock ||
				(World.isSlopeTile(tile) && this.intersectsSlope(rectangle, position, tile.shape))
			)) {
				tiles.push({ x, y, tile });
			}
		}
		return tiles;
	}
	collidingEntities(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		const solids = [];
		for(const entity of this.entities) {
			if(collides(entity) && "hitboxes" in entity && entity.hitboxes().some(b => rectangle.intersects(b))) {
				solids.push(entity);
			}
		}
		return solids;
	}
	isInSolid(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		return this.collidingTiles(rectangle, collides).length !== 0 || this.collidingEntities(rectangle, collides).length !== 0;
	}
	isBoundarySolid(worldPosition: Vector, direction: Direction, ignoredTiles: Tile[] = []) {
		const tilePosition = (
			(direction === "up") ? new Vector(Math.floor(worldPosition.x / WorldData.TILE_SIZE), Math.round(worldPosition.y / WorldData.TILE_SIZE))
			: (direction === "down") ? new Vector(Math.floor(worldPosition.x / WorldData.TILE_SIZE), Math.round(worldPosition.y / WorldData.TILE_SIZE) - 1)
			: (direction === "left") ? new Vector(Math.round(worldPosition.x / WorldData.TILE_SIZE), Math.floor(worldPosition.y / WorldData.TILE_SIZE))
			: new Vector(Math.round(worldPosition.x / WorldData.TILE_SIZE) - 1, Math.floor(worldPosition.y / WorldData.TILE_SIZE))
		);
		const adjacentPosition = tilePosition.add(Vector.unit(direction));
		if(direction === "down" && this.tiles.get(adjacentPosition) === "platform") {
			return true;
		}

		const tile = this.tiles.get(tilePosition);
		const adjacent = this.tiles.get(adjacentPosition);
		if(
			TowerTile.isSolidOrSlope(tile, direction)
			|| TowerTile.isSolidOrSlope(adjacent, Directions.opposite[direction])
		) { return true; }

		for(const position of [tilePosition, adjacentPosition]) {
			const tile = this.tiles.get(position);
			if(!ignoredTiles.includes(tile) && (
				World.isSolidTile(tile) ||
				tile instanceof Gate && tile.getPhysicsBox(position.x, position.y).contains(worldPosition)
			)) { return true; }
		}
		return false;
	}
	screenIntersectionDistance(position: Vector, direction: Vector, screenSize: Rectangle) {
		const left = this.camera.x - screenSize.width / 2;
		const right = this.camera.x + screenSize.width / 2;
		const top = this.camera.y - screenSize.height / 2;
		const bottom = this.camera.y + screenSize.height / 2;
		return Math.min(
			GameUtils.rayIntersectsVSegment(position, direction, direction.x >= 0 ? right : left, top, bottom),
			GameUtils.rayIntersectsHSegment(position, direction, direction.y >= 0 ? bottom : top, left, right)
		);
	}
	slopeLineIntersectionDistance(position: Vector, direction: Vector, tilePosition: Vector) {
		const slope = this.tiles.get(tilePosition);
		if(!(slope instanceof SolidTile && World.isSlope(slope.shape))) {
			return Infinity;
		}
		const tileBox = new Rectangle(tilePosition.x, tilePosition.y, 1, 1).scale(WorldData.TILE_SIZE);
		const endpoints = ({
			"slope-floor-left": ["top-left", "bottom-right"],
			"slope-floor-right": ["top-right", "bottom-left"],
			"slope-ceiling-left": ["top-right", "bottom-left"],
			"slope-ceiling-right": ["top-left", "bottom-right"],
		} as const)[slope.shape];
		return GameUtils.rayIntersectsSegment(position, direction, tileBox.getCorner(endpoints[0]), tileBox.getCorner(endpoints[1]));
	}
	tileIntersectionDistance(position: Vector, direction: Vector, maxDistance: number, ignoredTiles: Tile[] = []) {
		const tilePosition = this.getTileCoordinates(position);
		let result = maxDistance;
		for(let x = (direction.x >= 0) ? tilePosition.x + 1 : tilePosition.x; true; x += (direction.x >= 0) ? 1 : -1) {
			if(direction.x === 0) { break; }
			const distance = GameUtils.rayIntersectsVertical(
				position,
				direction,
				x * WorldData.TILE_SIZE
			);
			const intersection = position.add(direction.multiply(distance));
			const slopeIntersection = this.slopeLineIntersectionDistance(
				position, direction,
				new Vector(x + (direction.x >= 0 ? -1 : 0), Math.floor(intersection.y / WorldData.TILE_SIZE))
			);
			result = Math.min(result, slopeIntersection);
			if(this.isBoundarySolid(intersection, direction.x >= 0 ? "right" : "left", ignoredTiles)) {
				result = Math.min(result, distance);
				break;
			}
			if(distance > maxDistance) { break; }
		}
		for(let y = (direction.y >= 0) ? tilePosition.y + 1 : tilePosition.y; true; y += (direction.y >= 0) ? 1 : -1) {
			if(direction.y === 0) { break; }
			const distance = GameUtils.rayIntersectsHorizontal(
				position,
				direction,
				y * WorldData.TILE_SIZE
			);
			const intersection = position.add(direction.multiply(distance));
			const slopeIntersection = this.slopeLineIntersectionDistance(
				position, direction,
				new Vector(Math.floor(intersection.x / WorldData.TILE_SIZE), y + (direction.y >= 0 ? -1 : 0))
			);
			result = Math.min(result, slopeIntersection);
			if(this.isBoundarySolid(intersection, direction.y >= 0 ? "down" : "up", ignoredTiles)) {
				result = Math.min(result, distance);
				break;
			}
			if(distance > maxDistance) { break; }
		}
		return result;
	}
	entityIntersectionDistance(position: Vector, direction: Vector) {
		let result = Infinity;
		for(const entity of this.entities) {
			for(const hitbox of ("hitboxes" in entity) ? entity.hitboxes() : []) {
				result = Math.min(result, GameUtils.rayIntersectsRectangle(position, direction, hitbox));
			}
		}
		return result;
	}
	lineIntersectionDistance(position: Vector, direction: Vector, maxDistance: number, ignoredTiles: Tile[] = []) {
		return Math.min(
			this.tileIntersectionDistance(position, direction, maxDistance, ignoredTiles),
			this.entityIntersectionDistance(position, direction)
		);
	}
	hasLineOfSight(position: Vector, rectangle: Rectangle) {
		const center = rectangle.center();
		const direction = center.subtract(position);
		const distance = GameUtils.rayIntersectsRectangle(position, direction, rectangle);
		return distance <= this.lineIntersectionDistance(position, direction, distance);
	}


	destroyTile(position: Vector) {
		const tile = this.tiles.get(position);
		this.tiles.set(position, "empty");
		for(const direction of Directions.DIRECTIONS) {
			const adjacentPosition = position.add(Vector.unit(direction));
			const adjacentTile = this.tiles.get(adjacentPosition);
			if(adjacentTile instanceof Gate && adjacentTile.direction === Directions.opposite[direction]) {
				this.destroyTile(adjacentPosition);
			}
			else if(tile instanceof SolidTile && tile.shape === "solid" && adjacentTile instanceof Gate && adjacentTile.direction === direction) {
				this.destroyTile(adjacentPosition);
			}
		}
		if(World.isTileEntity(tile)) {
			this.tileEntities = this.tileEntities.filter(t => t.tile !== tile);
		}
	}
	addTile(position: Vector, tile: Tile) {
		this.tiles.set(position, tile);
		if(World.isTileEntity(tile)) {
			this.tileEntities.push({ position, tile });
		}
	}
	addParticle(particle: Particle, canvasIO: CanvasIO) {
		const player = this.player.physicsObject.hitbox().center();
		const distanceX = MathUtils.dist(particle.position.x, player.x);
		const distanceY = MathUtils.dist(particle.position.y, player.y);
		if(
			distanceX < canvasIO.canvas.width / 2 + PlayerData.MAX_X_VELOCITY * particle.lifetime()
			&& distanceY < canvasIO.canvas.height / 2 + WorldData.PARTICLE_RENDER_DISTANCE_Y * particle.lifetime()
		) {
			this.particles.push(particle);
		}
	}

	static isTile(value: unknown): value is Tile {
		return (typeof value === "string" && (WorldData.STRING_TILE_TYPES as readonly string[]).includes(value))
			|| value instanceof SolidTile
			|| World.isTileEntity(value);
	}
	static isSlope(value: string): value is (typeof WorldData.SLOPES)[number] {
		return WorldData.SLOPES.includes(value  as any);
	}
	static isSlopeTile(value: unknown): value is SolidTile & { shape: Slope } {
		return value instanceof SolidTile && WorldData.SLOPES.includes(value.shape as any);
	}
	static isTileEntity(value: unknown): value is TileEntity {
		return value instanceof Gate || value instanceof LaserBlock || value instanceof SpikeballBlock;
	}
	static isSolidTile(tile: Tile) {
		return (
			tile instanceof SolidTile && tile.shape === "solid"
			|| (tile instanceof Gate && tile.openness === 0)
			|| tile instanceof LaserBlock
		);
	}
	static reflectTile(tile: Tile) {
		if(tile === "empty" || tile === "platform") {
			return tile;
		}
		else if(tile instanceof SolidTile && World.isSlopeTile(tile)) {
			const reflections: { [key: string]: Slope } = {
				"slope-floor-left": "slope-floor-right",
				"slope-floor-right": "slope-floor-left",
				"slope-ceiling-left": "slope-ceiling-right",
				"slope-ceiling-right": "slope-ceiling-left"
			};
			return new SolidTile(reflections[tile.shape], tile.texture);
		}
		else if(tile instanceof SolidTile) {
			return tile;
		}
		else if(tile instanceof Gate) {
			const result = tile.copy();
			result.direction = Directions.reflectX[result.direction];
			return result;
		}
		else {
			throw new Error("Cannot reflect tile.");
		}
	}
}
