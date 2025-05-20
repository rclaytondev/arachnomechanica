import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { BackgroundData, LevelGeneratorData, PlayerData, RoomData, WorldData } from "./constants/GameData.mjs";
import { LevelGenerator } from "./level-generator/LevelGenerator.mjs";
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
import { WorldGenerator } from "./level-generator/WorldGenerator.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";

export type TileEntity = Gate | LaserBlock | SpikeballBlock;
export type Tile = (typeof WorldData.STRING_TILE_TYPES)[number] | TileEntity;
export type Entity = Lizard | Spikeball | Portal;

export class World {
	tiles: Grid<Tile> = new Grid("empty");
	entities: Entity[] = [];
	tileEntities: { position: Vector, tile: TileEntity }[] = [];
	particles: Particle[] = [];
	gearsBackground: GearsBackground = GearsBackground.generate();
	skyBackground: SkyBackground = new SkyBackground();
	tileGlowGradient: CanvasGradient | null = null;
	diagonalGlowGradient: CanvasGradient | null = null;
	screenShakeTimer: number = 0;
	screenShakeIntensity: number = 0;
	camera: Vector = new Vector(0, 0);
	levels: number = 0;

	player: Player = new Player();


	display(canvasIO: CanvasIO, visibleRegion: Rectangle = this.visibleRegion(canvasIO)) {
		canvasIO.fillCanvas("white");
		this.displayBackground(canvasIO);
		canvasIO.ctx.save();
		this.applyScreenShake(canvasIO);
		if(Main.screen instanceof World && !DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			const translation = this.translationToCamera(canvasIO);
			canvasIO.ctx.translate(translation.x, translation.y);
		}
		if(Main.screen instanceof World && DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			const amount = Math.min(
				canvasIO.canvas.width / (LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) * WorldData.TILE_SIZE),
				canvasIO.canvas.height / (LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) * WorldData.TILE_SIZE)
			);
			canvasIO.ctx.scale(amount, amount);
			visibleRegion = new Rectangle(
				0, 0,
				LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) * WorldData.TILE_SIZE,
				LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) * WorldData.TILE_SIZE,
			);
		}
		this.displayGlowEffects(canvasIO, visibleRegion);
		this.displayLaserBlocks(canvasIO, visibleRegion);
		this.displayLasers(canvasIO);
		if(!this.player.dead) {
			this.player.display(canvasIO);
		}
		this.displayParticles(canvasIO);
		this.displayEntities(canvasIO);
		this.displayTiles(canvasIO, visibleRegion);
		canvasIO.ctx.restore();
		this.player.displayEnergyBar(canvasIO);

		if(DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			debugger;
		}
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
		this.skyBackground.display(canvasIO);
		canvasIO.ctx.save();
		const rectangle = new Rectangle(
			-LevelGeneratorData.BORDER_X, -LevelGeneratorData.BORDER_Y,
			LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) * WorldData.TILE_SIZE + 2 * LevelGeneratorData.BORDER_X,
			LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) * WorldData.TILE_SIZE + 2 * LevelGeneratorData.BORDER_Y,
		).translate(this.translationToCamera(canvasIO));
		canvasIO.clipRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
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
	getTileGlowGradent() {
		if(this.tileGlowGradient) { return this.tileGlowGradient; }
		this.tileGlowGradient = GameUtils.glowLineGradient(
			0, 0, 0, -WorldData.TILE_GLOW_SIZE, 
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.tileGlowGradient;
	}
	getDiagonalGlowGradient(canvasIO: CanvasIO) {
		if(this.diagonalGlowGradient) { return this.diagonalGlowGradient; }
		this.diagonalGlowGradient = GameUtils.glowCircleGradient(
			0, 0, WorldData.TILE_GLOW_SIZE,
			WorldData.TILE_GLOW_INTENSITY,
			WorldData.TILE_GLOW_COLOR.red, WorldData.TILE_GLOW_COLOR.green, WorldData.TILE_GLOW_COLOR.blue
		);
		return this.diagonalGlowGradient;
	}
	displayGlowEffects(canvasIO: CanvasIO, visibleRegion: Rectangle) {
		for(const entity of this.entities) {
			if("displayGlowEffect" in entity) {
				entity.displayGlowEffect(canvasIO);
			}
		}
		for(let x = visibleRegion.left(); x < visibleRegion.right(); x ++) {
			for(let y = visibleRegion.top(); y < visibleRegion.bottom(); y ++) {
				if(this.tiles.get(x, y) === "solid") {
					this.displayTileGlow(new Vector(x, y), canvasIO);
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
				if(tile === "solid") {
					this.displaySolidTile(position, canvasIO);
				}
				else if(tile === "platform") {
					canvasIO.ctx.fillStyle = WorldData.TILE_COLOR;
					canvasIO.ctx.fillRect(
						x * WorldData.TILE_SIZE,
						y * WorldData.TILE_SIZE,
						WorldData.TILE_SIZE, WorldData.PLATFORM_THICKNESS
					);
				}
				else if(tile !== "empty" && !(tile instanceof LaserBlock)) {
					tile.display(canvasIO, x, y);
				}
				else if(tile instanceof LaserBlock) {
					// tile.displayBarrels(canvasIO, x, y);
				}
			}
		}
	}
	displaySolidTile(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLOR;
		canvasIO.ctx.fillRect(
			position.x * WorldData.TILE_SIZE - 1, 
			position.y * WorldData.TILE_SIZE - 1, 
			WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2
		);

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "round";

		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const direction of Directions.DIRECTIONS) {
			const adjacentTile = this.tiles.get(position.add(Vector.unit(direction))) === "solid";
			const left = Directions.rotateCounterclockwise(direction);
			const right = Directions.rotateClockwise(direction);
			const edgeCenter = center.add(Vector.unit(direction).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
			const leftCorner = edgeCenter.add(Vector.unit(left).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
			const rightCorner = edgeCenter.add(Vector.unit(right).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
			const tileLeft = this.tiles.get(position.add(Vector.unit(left))) === "solid";
			const tileRight = this.tiles.get(position.add(Vector.unit(right))) === "solid";
			const tileDiagonalLeft = this.tiles.get(position.add(Vector.unit(direction)).add(Vector.unit(left))) === "solid";
			const tileDiagonalRight = this.tiles.get(position.add(Vector.unit(direction)).add(Vector.unit(right))) === "solid";
			if(!adjacentTile) {
				canvasIO.strokeLine(leftCorner.x, leftCorner.y, rightCorner.x, rightCorner.y);
			}
			if((!adjacentTile && tileLeft) || (adjacentTile && tileLeft && !tileDiagonalLeft)) {
				const farLeftCorner = edgeCenter.add(Vector.unit(left).multiply(WorldData.TILE_SIZE / 2));
				canvasIO.strokeLine(leftCorner.x, leftCorner.y, farLeftCorner.x, farLeftCorner.y);
			}
			if((!adjacentTile && tileRight) || (adjacentTile && tileRight && !tileDiagonalRight)) {
				const farRightCorner = edgeCenter.add(Vector.unit(right).multiply(WorldData.TILE_SIZE / 2));
				canvasIO.strokeLine(rightCorner.x, rightCorner.y, farRightCorner.x, farRightCorner.y);
			}
		}
	}
	displayTileGlow(position: Vector, canvasIO: CanvasIO) {
		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const direction of Directions.DIRECTIONS) {
			const adjacentTile = this.tiles.get(position.add(Vector.unit(direction))) === "solid";
			const right = Directions.rotateClockwise(direction);
			const tileRight = this.tiles.get(position.add(Vector.unit(right))) === "solid";
			const tileDiagonalRight = this.tiles.get(position.add(Vector.unit(direction)).add(Vector.unit(right))) === "solid";
			if(!adjacentTile) {
				const tileEdgeCenter = center.add(Vector.unit(direction).multiply(WorldData.TILE_SIZE / 2));
				canvasIO.ctx.save();
				canvasIO.ctx.translate(tileEdgeCenter.x, tileEdgeCenter.y);
				canvasIO.ctx.rotate(-Directions.angle(direction) + Math.PI / 2);
				canvasIO.ctx.fillStyle = this.getTileGlowGradent();
				canvasIO.ctx.globalCompositeOperation = "lighter";
				canvasIO.ctx.fillRect(-WorldData.TILE_SIZE / 2, -WorldData.TILE_GLOW_SIZE, WorldData.TILE_SIZE, WorldData.TILE_GLOW_SIZE);
				canvasIO.ctx.restore();

				if(!tileRight && !tileDiagonalRight) {
					const rightEdgeCorner = tileEdgeCenter.add(Vector.unit(right).multiply(WorldData.TILE_SIZE / 2));
					canvasIO.ctx.save();
					canvasIO.ctx.translate(rightEdgeCorner.x, rightEdgeCorner.y);
					canvasIO.ctx.rotate(-Directions.angle(direction) + Math.PI / 2);
					canvasIO.ctx.fillStyle = this.getDiagonalGlowGradient(canvasIO);
					canvasIO.ctx.globalCompositeOperation = "lighter";
					canvasIO.ctx.fillRect(0, -WorldData.TILE_GLOW_SIZE, WorldData.TILE_SIZE, WorldData.TILE_GLOW_SIZE);
					canvasIO.ctx.restore();
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

	update(canvasIO: CanvasIO) {
		this.updateEntities(canvasIO);
		this.player.update(this, canvasIO);
		this.updateTiles(canvasIO);
		this.updateParticles();
		this.screenShakeTimer --;
		this.updateCamera();
		this.checkDebugInputs(canvasIO);
	}
	updateEntities(canvasIO: CanvasIO) {
		for(const entity of this.entities) {
			entity.update(this, canvasIO);
		}
		this.entities = this.entities.filter(c => !("dead" in c) || !c.dead);
	}
	updateTiles(canvasIO: CanvasIO) {
		for(const { tile, position } of this.tileEntities) {
			if(typeof tile !== "string") {
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
		this.camera = GameUtils.moveVectorTowards(this.camera, this.player.physicsObject.hitbox().center(), WorldData.CAMERA_SPEED);
	}
	checkDebugInputs(canvasIO: CanvasIO) {
		if(canvasIO.keys[DEBUG_SETTINGS.SKIP_LEVEL_KEY]) {
			this.player.physicsObject.positionInt = [...this.entities].reverse().find(e => e instanceof Portal)!.position;
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
	getTilesAt(rectangle: Rectangle) {
		const tiles = [];
		const left = this.getTileX(rectangle.left());
		const right = this.getTileX(rectangle.right() - 1);
		const top = this.getTileY(rectangle.top());
		const bottom = this.getTileY(rectangle.bottom() - 1);
		for(let x = left; x <= right; x ++) {
			for(let y = top; y <= bottom; y ++) {
				tiles.push({ position: new Vector(x, y), tile: this.tiles.get(x, y) });
			}
		}
		return tiles;
	}
	isInSolid(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		for(const { position, tile } of this.getTilesAt(rectangle)) {
			const { x, y } = position;
			if(collides({ x, y, tile }) && (
				tile === "solid" ||
				(tile instanceof Gate && tile.openness !== 1 && rectangle.intersects(tile.getPhysicsBox(x, y))) ||
				tile instanceof LaserBlock ||
				tile instanceof SpikeballBlock
			)) { return true; }
		}
		for(const entity of this.entities) {
			if(collides(entity) && "hitboxes" in entity && entity.hitboxes().some(b => rectangle.intersects(b))) {
				return true;
			}
		}
		return false;
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
		for(const position of [tilePosition, adjacentPosition]) {
			const tile = this.tiles.get(position);
			if(!ignoredTiles.includes(tile) && (
				World.isSolidTile(tile) ||
				tile instanceof Gate && tile.getPhysicsBox(position.x, position.y).contains(worldPosition)
			)) { return true; }
		}
		return false;
	}
	destroyTile(position: Vector) {
		const tile = this.tiles.get(position);
		this.tiles.set(position, "empty");
		for(const direction of Directions.DIRECTIONS) {
			const adjacentPosition = position.add(Vector.unit(direction));
			const adjacentTile = this.tiles.get(adjacentPosition);
			if(adjacentTile instanceof Gate && adjacentTile.direction === Directions.opposite(direction)) {
				this.destroyTile(adjacentPosition);
			}
			else if(tile === "solid" && adjacentTile instanceof Gate && adjacentTile.direction === direction) {
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

	generateNextLevel() {
		const generator = new WorldGenerator(new Vector(
			0,
			-(LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y)) * this.levels
		), this);
		generator.generate();
	}

	static isTile(value: unknown): value is Tile {
		return (typeof value === "string" && (WorldData.STRING_TILE_TYPES as readonly string[]).includes(value))
			|| World.isTileEntity(value);
	}
	static isTileEntity(value: unknown): value is TileEntity {
		return value instanceof Gate || value instanceof LaserBlock || value instanceof SpikeballBlock;
	}
	static isSolidTile(tile: Tile) {
		return (
			tile === "solid"
			|| (tile instanceof Gate && tile.openness === 0)
			|| tile instanceof LaserBlock
		);
	}
	static reflectTile(tile: Tile) {
		if(tile === "solid" || tile === "empty" || tile === "platform") {
			return tile;
		}
		else if(tile instanceof Gate) {
			const result = tile.copy();
			result.direction = Directions.reflectX(result.direction);
			return result;
		}
		else {
			throw new Error("Cannot reflect tile.");
		}
	}
}
