import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { BackgroundData, LevelGeneratorData, PlayerData, RoomData, WorldData } from "../constants/GameData.mjs";
import { Main } from "../Main.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { Player } from "../Player.mjs";
import { Gate } from "../tiles/Gate.mjs";
import { GearsBackground } from "../backgrounds/GearsBackground.mjs";
import { SkyBackground } from "../backgrounds/SkyBackground.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { LaserBlock } from "../tiles/LaserBlock.mjs";
import { SpikeballBlock } from "../tiles/SpikeballBlock.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { RoomEditor } from "../RoomEditor.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { StoneTile } from "../tiles/StoneTile.mjs";
import { WorldGenerator } from "../level-generator/WorldGenerator.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { Entities } from "./Entities.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { SpawnPoint } from "../entities/SpawnPoint.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tile } from "../tiles/Tile.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { Tiles } from "./Tiles.mjs";

export type TileEntity = BasicTile | Gate | LaserBlock | SpikeballBlock;
export type Slope = (typeof WorldData.SLOPES)[number];
export type TileWithPosition = { x: number, y: number, tile: Tile };
export type TileEntityWithPosition = { x: number, y: number, tile: TileEntity };

export class World {
	tiles: Tiles = new Tiles();
	originalTiles: Tiles = new Tiles();
	entities: Entities = new Entities();
	particles: Particle[] = [];
	gearsBackground: GearsBackground = GearsBackground.generate();
	skyBackground: SkyBackground = new SkyBackground();
	screenShakeTimer: number = 0;
	screenShakeIntensity: number = 0;
	camera: Vector = new Vector(0, 0);
	levelsGenerated: number = 0;
	levelsVisited: number = 0;
	nextPlayerSpawnRoom: Vector = new Vector(0, 0);
	overlayText: string = "";
	overlayTextOpacity: number = 0;

	worldGenerator: WorldGenerator = new WorldGenerator();
	enableGeneration: boolean;

	player: Player = new Player();

	constructor(enableGeneration: boolean) {
		this.enableGeneration = enableGeneration;
		this.entities.addEntity(this.player);
	}

	initializeGeneration() {
		this.worldGenerator.generateLevel(this);
		this.spawnPlayer(this.worldGenerator);
		const rectangle = this.worldGenerator.levelRectangle().scale(RoomData.SIZE);
		const startRoom = this.worldGenerator.path[this.worldGenerator.path.length - 1];
		EntitySpawner.spawnAllEntities(
			Rectangle.fromBounds(rectangle.left() + 1, rectangle.right() - 1, rectangle.top() + 1, rectangle.bottom() - 1),
			new Rectangle(startRoom.x, startRoom.y, 1, 1).scale(RoomData.SIZE),
			this,
		);
		return this;
	}
	spawnPlayer(worldGenerator: WorldGenerator) {
		const startRoom = worldGenerator.path[worldGenerator.path.length - 1];
		const startRoomRect = Rectangle.square(startRoom.x, startRoom.y, 1).scale(RoomData.SIZE * WorldData.TILE_SIZE);
		const spawnPoint = [...this.entities.entitiesPossiblyIntersecting(startRoomRect)].find(e => e instanceof SpawnPoint)!;
		this.player.hitbox.x = spawnPoint.position.x;
		this.player.hitbox.y = spawnPoint.position.y;
		this.addEntityIfEmpty(this.player);
		this.camera = this.player.hitbox.center();
	}
	nextLevelTileRectangle(levels: number = this.levelsVisited) {
		const levelHeight = RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y;
		return new Rectangle(0, -levels * levelHeight, LevelGeneratorData.WIDTH * RoomData.SIZE, LevelGeneratorData.HEIGHT * RoomData.SIZE);
	}
	playerSpawnPosition(startRoom: Vector) {
		const levelHeight = RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y;
		const translatedStartRoom = startRoom.multiply(RoomData.SIZE).add(new Vector(0, -levelHeight * this.levelsGenerated));
		const emptyTiles = [];
		for(const position of Rectangle.square(translatedStartRoom.x, translatedStartRoom.y, RoomData.SIZE).squares()) {
			const tileBelow = this.tiles.get(position.x, position.y + 1);
			if(this.tiles.get(position) === EmptyTile.EMPTY && tileBelow instanceof BasicTile && tileBelow.shape === "full") {
				emptyTiles.push(position);
			}
		}
		return ArrayUtils.randomItem(emptyTiles);
	}
	generateNextLevel() {
		this.levelsGenerated ++;
		const levelHeight = RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y;
		const generator = new WorldGenerator(new Vector(0, -levelHeight * this.levelsGenerated));
		generator.generateLevel(this);
		const rectangle = generator.levelRectangle().scale(RoomData.SIZE).translate(new Vector(0, -levelHeight * this.levelsGenerated));
		const startRoom = generator.path[generator.path.length - 1];
		EntitySpawner.spawnAllEntities(
			Rectangle.fromBounds(rectangle.left() + 1, rectangle.right() - 1, rectangle.top() + 1, rectangle.bottom() - 1),
			new Rectangle(startRoom.x, startRoom.y, 1, 1).scale(RoomData.SIZE).translate(new Vector(0, -levelHeight * this.levelsGenerated)),
			this,
		);
		this.nextPlayerSpawnRoom = generator.path[generator.path.length - 1];
	}

	display(canvasIO: CanvasIO, visibleTileRegion: Rectangle = this.visibleTileRegion(canvasIO)) {
		this.displayBackground(canvasIO);
		canvasIO.ctx.save();
		this.applyScreenShake(canvasIO);
		const translation = this.translationToCamera(canvasIO);
		canvasIO.ctx.translate(translation.x, translation.y);
		this.displayGlowEffects(canvasIO);
		this.displayLaserBlocks(canvasIO, visibleTileRegion);
		this.displayLasers(canvasIO);
		this.displayParticles(canvasIO);
		this.displayEntities(canvasIO);
		this.displayTiles(canvasIO, visibleTileRegion);
		this.displayTileAccents(canvasIO, visibleTileRegion);
		this.displayDebugInfo(canvasIO);
		canvasIO.ctx.restore();

		this.displayOverlayText(canvasIO);

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
		const translation = this.translationToCamera(canvasIO);
		this.skyBackground.display(canvasIO);
		canvasIO.ctx.save();
		canvasIO.clipRect(
			translation.x, 0,
			LevelGeneratorData.WIDTH * RoomData.SIZE * WorldData.TILE_SIZE,
			canvasIO.canvas.height,
		);
		canvasIO.fillCanvas(BackgroundData.BACKGROUND_COLOR);
		this.gearsBackground.display(canvasIO, this.camera);
		canvasIO.ctx.restore();
	}
	translationToCamera(canvasIO: CanvasIO) {
		return new Vector(canvasIO.canvas.width / 2 - this.camera.x, canvasIO.canvas.height / 2 - this.camera.y);
	}
	visibleRegion(canvasIO: CanvasIO, offscreenAmount: number) {
		return Rectangle.fromBounds(
			this.camera.x - canvasIO.canvas.width / 2 - offscreenAmount,
			this.camera.x + canvasIO.canvas.width / 2 + offscreenAmount,
			this.camera.y - canvasIO.canvas.height / 2 - offscreenAmount,
			this.camera.y + canvasIO.canvas.height / 2 + offscreenAmount,
		);
	}
	visibleTileRegion(canvasIO: CanvasIO, offscreenTiles: number = 0) {
		const center = this.camera.divide(WorldData.TILE_SIZE);
		return Rectangle.fromBounds(
			Math.floor(center.x - (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)) - offscreenTiles,
			Math.ceil(center.x + (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)) + offscreenTiles,
			Math.floor(center.y - (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)) - offscreenTiles,
			Math.ceil(center.y + (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)) + offscreenTiles,
		);
	}
	displayGlowEffects(canvasIO: CanvasIO) {
		const entityRegion = this.visibleRegion(canvasIO, WorldData.GLOW_RENDER_DISTANCE);
		for(const entity of this.entities.entitiesPossiblyIntersecting(entityRegion)) {
			entity.displayGlowEffect(canvasIO);
		}
		for(const { tile, x, y } of this.entities.allTileEntities()) {
			if(tile instanceof LaserBlock) {
				tile.displayLaserGlow(canvasIO, x, y);
			}
			else if(tile instanceof SpikeballBlock) {
				tile.displayGlow(canvasIO, x, y);
			}
		}

		for(const particle of this.particles) {
			particle.displayGlow(canvasIO);
		}
	}
	displayLaserBlocks(canvasIO: CanvasIO, visibleTileRegion: Rectangle) {
		for(let x = visibleTileRegion.left(); x < visibleTileRegion.right(); x ++) {
			for(let y = visibleTileRegion.top(); y < visibleTileRegion.bottom(); y ++) {
				const tile = this.tiles.get(x, y);
				if(tile instanceof LaserBlock) {
					tile.display(canvasIO, x, y);
				}
			}
		}
	}
	displayLasers(canvasIO: CanvasIO) {
		for(const { tile, x, y } of this.entities.allTileEntities()) {
			if(tile instanceof LaserBlock) {
				tile.displayLasers(canvasIO, x, y);
			}
		}
	}
	displayTileEntities(canvasIO: CanvasIO, region: Rectangle) {
		for(const position of region.squares()) {
			const tile = this.tiles.get(position);
			if(typeof tile !== "string" && !(tile instanceof LaserBlock) && !(tile instanceof BasicTile)) {
				tile.display(canvasIO, position.x, position.y, this);
			}
		}
	}
	displayBasicTiles(canvasIO: CanvasIO, region: Rectangle) {
		for(const position of region.squares()) {
			const tile = this.tiles.get(position);
			if(tile instanceof BasicTile || tile instanceof Platform) {
				tile.display(canvasIO, position.x, position.y, this);
			}
		}

	}
	displayTiles(canvasIO: CanvasIO, region: Rectangle) {
		this.displayBasicTiles(canvasIO, region);
		this.displayTileEntities(canvasIO, region);
		StoneTile.displayStoneTiles(this, canvasIO, region);
	}
	displayTileAccents(canvasIO: CanvasIO, region: Rectangle) {
		for(let x = region.left(); x < region.right(); x ++) {
			for(let y = region.top(); y < region.bottom(); y ++) {
				const position = new Vector(x, y);
				const tile = this.tiles.get(position);
				if(tile instanceof BasicTile && tile.shape === "full" && tile.texture === "tower") {
					TowerTile.displayTileAccent(position, canvasIO, this);
				}
				else if(World.isSlopeTile(tile) && tile.texture === "tower") {
					TowerTile.displaySlopedAccent(position, canvasIO, tile.shape, this);
				}
			}
		}
	}
	displayEntities(canvasIO: CanvasIO) {
		const region = this.visibleRegion(canvasIO, WorldData.ENTITY_RENDER_DISTANCE);
		for(const entity of this.entities.entitiesPossiblyIntersecting(region)) {
			if(!(entity instanceof Player)) {
				entity.display(canvasIO, this);
			}
		}
		this.player.display(canvasIO);
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
		const region = this.visibleRegion(canvasIO, WorldData.ENTITY_RENDER_DISTANCE);
		for(const entity of this.entities.entitiesPossiblyIntersecting(region)) {
			entity.displayDebug(canvasIO, this);
			if(entity instanceof Collideable) {
				entity.displayHitboxes(canvasIO);
			}
		}
	}
	displayOverlayText(canvasIO: CanvasIO) {
		if(Main.screen instanceof RoomEditor) { return; }
		canvasIO.ctx.save();
		canvasIO.ctx.font = WorldData.OVERLAY_FONT;
		canvasIO.ctx.fillStyle = WorldData.OVERLAY_COLOR;
		canvasIO.ctx.globalAlpha = MathUtils.constrain(this.overlayTextOpacity, 0, 1);
		canvasIO.ctx.textAlign = "center";
		canvasIO.ctx.fillText(this.overlayText, canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
		canvasIO.ctx.restore();
	}

	update(canvasIO: CanvasIO) {
		this.updateEntities(canvasIO);
		this.updateTiles(canvasIO);
		this.updateParticles();
		this.updateGeneration();
		this.screenShakeTimer --;
		this.overlayTextOpacity -= WorldData.OVERLAY_FADE_SPEED;
		this.updateCamera();
	}
	updateEntities(canvasIO: CanvasIO) {
		const region = this.visibleRegion(canvasIO, WorldData.ENTITY_UPDATE_DISTANCE);
		for(const entity of this.entities.entitiesPossiblyIntersecting(region)) {
			entity.update(this, canvasIO);
		}
	}
	updateTiles(canvasIO: CanvasIO) {
		const region = this.visibleTileRegion(canvasIO, WorldData.TILE_UPDATE_DISTANCE);
		for(const { tile, x, y } of this.entities.tileEntitiesIntersecting(region)) {
			if("update" in tile) {
				tile.update(this, x, y, canvasIO);
			}
		}
		Gate.update(this);
	}
	updateParticles() {
		for(const particle of this.particles) {
			particle.update();
		}
		this.particles = this.particles.filter(p => !p.isDead());
	}
	updateCamera() {
		if(!(Main.screen instanceof RoomEditor)) {
			this.camera = GameUtils.moveVectorTowards(this.camera, this.player.hitbox.center(), WorldData.CAMERA_SPEED);
		}
	}
	updateGeneration() {
		const levelHeight = WorldData.TILE_SIZE * (RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y);
		if(this.enableGeneration && this.player.hitbox.top() < RoomData.SIZE * WorldData.TILE_SIZE - this.levelsGenerated * levelHeight) {
			this.generateNextLevel();
		}

		if(this.player.hitbox.top() < -(this.levelsVisited - 1) * levelHeight) {
			this.levelsVisited ++;
			const floorText = `${this.levelsVisited.toString().padStart(2, "0")}`;
			this.overlayText = `Floor ${floorText}`;
			this.overlayTextOpacity = WorldData.OVERLAY_INITIAL_OPACITY;
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
			Math.floor(onscreenPosition.y / WorldData.TILE_SIZE),
		);
	}
	getTileAt(onscreenPosition: Vector) {
		return this.tiles.get(this.getTileCoordinates(onscreenPosition));
	}
	*getTilesAt(rectangle: Rectangle) {
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
		return tile instanceof BasicTile && tile.shape === slope && this.slopeIntersectionDistance(rectangle, position, slope) === 0;
	}
	collidingTiles(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		const tiles = [];
		for(const { position, tile } of this.getTilesAt(rectangle)) {
			const { x, y } = position;
			if(collides({ x, y, tile }) && (
				tile instanceof BasicTile && tile.shape === "full" ||
				(tile instanceof Gate && tile.openness !== 1 && rectangle.interiorIntersects(tile.getPhysicsBox(x, y))) ||
				tile instanceof LaserBlock ||
				tile instanceof SpikeballBlock ||
				(World.isSlopeTile(tile) && this.intersectsSlope(rectangle, position, tile.shape))
			)) {
				tiles.push({ x, y, tile });
			}
		}
		return tiles;
	}
	isInSolid(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		return this.collidingTiles(rectangle, collides).length !== 0 || this.entities.collideablesIntersecting(rectangle, collides).size !== 0;
	}
	isBoundarySolid(worldPosition: Vector, direction: Direction, ignoredTiles: Tile[] = []) {
		const tilePosition = (
			(direction === "up") ? new Vector(Math.floor(worldPosition.x / WorldData.TILE_SIZE), Math.round(worldPosition.y / WorldData.TILE_SIZE))
			: (direction === "down") ? new Vector(Math.floor(worldPosition.x / WorldData.TILE_SIZE), Math.round(worldPosition.y / WorldData.TILE_SIZE) - 1)
			: (direction === "left") ? new Vector(Math.round(worldPosition.x / WorldData.TILE_SIZE), Math.floor(worldPosition.y / WorldData.TILE_SIZE))
			: new Vector(Math.round(worldPosition.x / WorldData.TILE_SIZE) - 1, Math.floor(worldPosition.y / WorldData.TILE_SIZE))
		);
		const adjacentPosition = tilePosition.add(Vector.unit(direction));
		if(direction === "down" && this.tiles.get(adjacentPosition) === Platform.PLATFORM) {
			return true;
		}

		const tile = this.tiles.get(tilePosition);
		const adjacent = this.tiles.get(adjacentPosition);
		if(
			World.isEdgeBasicSolid(tile, direction)
			|| World.isEdgeBasicSolid(adjacent, Directions.opposite[direction])
		) { return true; }

		for(const position of [tilePosition, adjacentPosition]) {
			const tile = this.tiles.get(position);
			if(!ignoredTiles.includes(tile) && (
				World.isFullTile(tile) ||
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
			GameUtils.rayIntersectsHSegment(position, direction, direction.y >= 0 ? bottom : top, left, right),
		);
	}
	slopeLineIntersectionDistance(position: Vector, direction: Vector, tilePosition: Vector) {
		const slope = this.tiles.get(tilePosition);
		if(!(slope instanceof BasicTile && World.isSlope(slope.shape))) {
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
				x * WorldData.TILE_SIZE,
			);
			const intersection = position.add(direction.multiply(distance));
			const slopeIntersection = this.slopeLineIntersectionDistance(
				position, direction,
				new Vector(x + (direction.x >= 0 ? -1 : 0), Math.floor(intersection.y / WorldData.TILE_SIZE)),
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
				y * WorldData.TILE_SIZE,
			);
			const intersection = position.add(direction.multiply(distance));
			const slopeIntersection = this.slopeLineIntersectionDistance(
				position, direction,
				new Vector(Math.floor(intersection.x / WorldData.TILE_SIZE), y + (direction.y >= 0 ? -1 : 0)),
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
	entityIntersectionDistance(position: Vector, direction: Vector, collides: (entity: Entity) => boolean = () => true, maxLength: number) {
		let result = Infinity;
		const furthestEndpoint = position.add(direction.multiply(maxLength));
		const rectangle = Rectangle.fromOppositeCorners(position, furthestEndpoint);
		for(const entity of this.entities.entitiesPossiblyIntersecting(rectangle)) {
			if(!(entity instanceof Collideable) || !collides(entity)) { continue; }
			for(const hitbox of entity.hitboxes()) {
				result = Math.min(result, GameUtils.rayIntersectsRectangle(position, direction, hitbox));
			}
		}
		return result;
	}
	lineIntersectionDistance(position: Vector, direction: Vector, maxDistance: number, ignoredTiles: Tile[] = [], collides: (entity: Entity) => boolean = () => true) {
		return Math.min(
			this.tileIntersectionDistance(position, direction, maxDistance, ignoredTiles),
			this.entityIntersectionDistance(position, direction, collides, maxDistance),
		);
	}
	hasLineOfSight(position: Vector, rectangle: Rectangle, collides: (entity: Entity) => boolean) {
		const center = rectangle.center();
		const direction = center.subtract(position);
		const distance = GameUtils.rayIntersectsRectangle(position, direction, rectangle);
		return distance <= this.lineIntersectionDistance(position, direction, distance, [], collides);
	}

	angle(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, empty: boolean = true, basicOnly: boolean = true) {
		return World.angle(position, adjacentDirection, perpendicularDirection, empty, basicOnly, this.tiles);
	}
	static angle(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, empty: boolean = true, basicOnly: boolean = true, tiles: Tiles) {
		/* Returns the angle before encountering a solid/empty, when first moving in `adjacentDirection` and then in `perpendicularDirection` and then in a circle after that. */
		const tile = tiles.get(position);
		const adjacent = tiles.get(position.add(Vector.unit(adjacentDirection)));
		const diagonal = tiles.get(position.add(Vector.unit(adjacentDirection)).add(Vector.unit(perpendicularDirection)));
		const perpendicular = tiles.get(position.add(Vector.unit(perpendicularDirection)));
		if(World.isEdgeSolid(adjacent, Directions.opposite[adjacentDirection], basicOnly) === empty) {
			return 0;
		}
		if(World.isEdgeSolid(adjacent, perpendicularDirection, basicOnly) === empty && World.isSlopeTile(adjacent)) {
			return 45;
		}
		if(World.isEdgeSolid(diagonal, Directions.opposite[perpendicularDirection], basicOnly) === empty) {
			return 90;
		}
		if(World.isEdgeSolid(diagonal, Directions.opposite[adjacentDirection], basicOnly) === empty && World.isSlopeTile(diagonal)) {
			return 135;
		}
		if(World.isEdgeSolid(perpendicular, adjacentDirection, basicOnly) === empty) {
			return 180;
		}
		if(World.isEdgeSolid(perpendicular, Directions.opposite[perpendicularDirection], basicOnly) === empty && World.isSlopeTile(perpendicular)) {
			return 225;
		}
		if(World.isEdgeSolid(tile, perpendicularDirection, basicOnly) === empty) {
			return 270;
		}
		if(World.isEdgeSolid(tile, adjacentDirection, basicOnly) === empty && World.isSlopeTile(tile)) {
			return 315;
		}
		return 360;
	}


	destroyTile(position: Vector) {
		const tile = this.tiles.get(position);
		this.tiles.set(position, EmptyTile.EMPTY);
		for(const direction of Directions.DIRECTIONS) {
			const adjacentPosition = position.add(Vector.unit(direction));
			const adjacentTile = this.tiles.get(adjacentPosition);
			if(adjacentTile instanceof Gate && adjacentTile.direction === Directions.opposite[direction]) {
				this.destroyTile(adjacentPosition);
			}
			else if(tile instanceof BasicTile && tile.shape === "full" && adjacentTile instanceof Gate && adjacentTile.direction === direction) {
				this.destroyTile(adjacentPosition);
			}
		}
		if(World.isTileEntity(tile)) {
			this.entities.removeTileEntity(position);
		}
	}
	destroyNonGateTile(position: Vector) {
		const isGate = this.tiles.get(position) instanceof Gate;
		const adjacentGate = Directions.DIRECTIONS.some(d => {
			const tile = this.tiles.get(position.add(Vector.unit(d)));
			return tile instanceof Gate && tile.direction === d;
		});
		if(!isGate && !adjacentGate) {
			if(World.isTileEntity(this.tiles.get(position))) {
				this.entities.removeTileEntity(position);
			}
			this.tiles.set(position, EmptyTile.EMPTY);
		}
	}
	addTile(position: Vector, tile: Tile) {
		this.tiles.set(position, tile);
		if(World.isTileEntity(tile)) {
			this.entities.addTileEntity(tile, position);
		}
	}
	removeTile(position: Vector) {
		this.entities.removeTileEntity(position);
		this.tiles.set(position, EmptyTile.EMPTY);
	}
	addOriginalTile(position: Vector, tile: Tile) {
		this.addTile(position, tile);
		this.originalTiles.set(position, tile);
	}
	addParticle(particle: Particle, canvasIO: CanvasIO) {
		const player = this.player.hitbox.center();
		const distanceX = MathUtils.dist(particle.position.x, player.x);
		const distanceY = MathUtils.dist(particle.position.y, player.y);
		if(
			distanceX < canvasIO.canvas.width / 2 + PlayerData.MAX_X_VELOCITY * particle.lifetime()
			&& distanceY < canvasIO.canvas.height / 2 + WorldData.PARTICLE_RENDER_DISTANCE_Y * particle.lifetime()
		) {
			this.particles.push(particle);
		}
	}
	addEntityIfEmpty(entity: Collideable) {
		if(!entity.hitboxes().some(h => this.isInSolid(h))) {
			this.entities.addEntity(entity);
			return true;
		}
		return false;
	}
	damage(hurtbox: Rectangle, canvasIO: CanvasIO) {
		if(this.player.hitbox.intersects(hurtbox)) {
			this.player.damage(hurtbox, this);
		}
		for(const entity of this.entities.collideablesIntersecting(hurtbox)) {
			entity.damage(hurtbox, this, canvasIO);
		}
	}

	static isSlope(value: unknown): value is (typeof WorldData.SLOPES)[number] {
		return (WorldData.SLOPES as readonly unknown[]).includes(value);
	}
	static isSlopeTile(value: unknown): value is BasicTile & { shape: Slope } {
		return value instanceof BasicTile && (WorldData.SLOPES as readonly unknown[]).includes(value.shape);
	}
	static isFullBasicTile(value: unknown): value is BasicTile & { shape: "full" } {
		return value instanceof BasicTile && value.shape === "full";
	}
	static isTileEntity(value: unknown): value is TileEntity {
		return value instanceof Gate || value instanceof LaserBlock || value instanceof SpikeballBlock;
	}
	static isFullTile(tile: Tile) {
		return (
			tile instanceof BasicTile && tile.shape === "full"
			|| (tile instanceof Gate && tile.openness === 0)
			|| tile instanceof LaserBlock || tile instanceof SpikeballBlock
		);
	}
	static isSemifullTile(tile: Tile, includePlaforms: boolean = false) {
		return (
			World.isFullTile(tile)
			|| (tile instanceof Gate && tile.openness !== 1)
			|| tile instanceof BasicTile
			|| (includePlaforms && tile === Platform.PLATFORM)
		);
	}
	static isEdgeBasicSolid(tile: Tile, direction: Direction) {
		if(tile instanceof BasicTile && World.isSlope(tile.shape)) {
			const edges = ({
				"slope-floor-left": ["left", "down"],
				"slope-floor-right": ["right", "down"],
				"slope-ceiling-left": ["left", "up"],
				"slope-ceiling-right": ["right", "up"],
			} as const)[tile.shape];
			return (edges as readonly Direction[]).includes(direction);
		}
		return tile instanceof BasicTile && tile.shape === "full";
	}
	static isEdgeSolid(tile: Tile, direction: Direction, basicOnly: boolean = false) {
		if(World.isEdgeBasicSolid(tile, direction)) { return true; }
		return !basicOnly && (
			(tile instanceof LaserBlock || tile instanceof SpikeballBlock)
			|| (tile === Platform.PLATFORM && direction === "up")
			|| (tile instanceof Gate && tile.openness === 0)
		);
	}

	intersectingEntities() {
		const entities = [...this.entities.allEntities()].filter(e => e instanceof Collideable);
		const pairs = entities.flatMap((e1, i1) => entities.slice(i1 + 1).map(e2 => [e1, e2] as [Collideable, Collideable]));
		return pairs.filter(([e1, e2]) => e1.intersects(e2));
	}
}
