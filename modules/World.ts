import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
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
import { Humanoid } from "./entities/Humanoid.mjs";
import { RoomEditor } from "./RoomEditor.mjs";

export type TileEntity = Gate | LaserBlock | SpikeballBlock;
export type Tile = (typeof WorldData.STRING_TILE_TYPES)[number] | TileEntity;
export type Slope = (typeof WorldData.SLOPES)[number];
export type TileWithPosition = { x: number, y: number, tile: Tile };
export type Entity = Lizard | Spikeball | Portal | Humanoid;

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
		this.displayDebugInfo(canvasIO);
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
				else if(World.isSlope(tile)) {
					this.displaySlopedTile(position, canvasIO, tile);
				}
				else if(typeof tile !== "string" && "display" in tile && !(tile instanceof LaserBlock)) {
					tile.display(canvasIO, x, y);
				}
				else if(tile instanceof LaserBlock) {
					// tile.displayBarrels(canvasIO, x, y);
				}
			}
		}
		
		for(let x = region.left(); x < region.right(); x ++) {
			for(let y = region.top(); y < region.bottom(); y ++) {
				const position = new Vector(x, y);
				const tile = this.tiles.get(position);
				if(tile === "solid") {
					this.displayTileAccent(position, canvasIO);
				}
				else if(World.isSlope(tile)) {
					this.displaySlopedAccent(position, canvasIO, tile);
				}
			}
		}
	}
	displaySlopedTile(position: Vector, canvasIO: CanvasIO, tile: Slope) {
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);
		const angles = {
			"slope-floor-right": 0,
			"slope-floor-left": MathUtils.toRadians(90),
			"slope-ceiling-right": MathUtils.toRadians(-90),
			"slope-ceiling-left": MathUtils.toRadians(-180),
		};
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(angles[tile]);
		canvasIO.ctx.fillStyle = WorldData.TILE_COLOR;
		canvasIO.fillPoly(
			WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
			WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
			-WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2,
		);
		canvasIO.ctx.restore();
	}
	displaySlopedAccent(position: Vector, canvasIO: CanvasIO, tile: Slope) {
		const accentInset = (WorldData.TILE_SIZE - WorldData.TILE_ACCENT_DISTANCE) / 2;
		const inwardNormal = {
			"slope-floor-left": new Vector(-1, 1),
			"slope-floor-right": new Vector(1, 1),
			"slope-ceiling-left": new Vector(-1, -1),
			"slope-ceiling-right": new Vector(1, -1),
		}[tile];
		const tangent = inwardNormal.rotate(90);
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);

		const [adjacentDirection1, perpendicularDirection1] = ({
			"slope-floor-left": ["left", "up"],
			"slope-floor-right": ["down", "left"],
			"slope-ceiling-left": ["up", "right"],
			"slope-ceiling-right": ["right", "down"]
		} as const)[tile];
		const distance1 = this.getSlopeAccentLength(position, adjacentDirection1, perpendicularDirection1);

		const [adjacentDirection2, perpendicularDirection2] = ({
			"slope-floor-left": ["down", "right"],
			"slope-floor-right": ["right", "up"],
			"slope-ceiling-left": ["left", "down"],
			"slope-ceiling-right": ["up", "left"]
		} as const)[tile];
		const distance2 = this.getSlopeAccentLength(position, adjacentDirection2, perpendicularDirection2);

		
		const endpoint1 = center.add(inwardNormal.multiply(accentInset / Math.SQRT2)).add(tangent.normalize().multiply(distance1));
		const endpoint2 = center.add(inwardNormal.multiply(accentInset / Math.SQRT2)).subtract(tangent.normalize().multiply(distance2));

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "round";
		canvasIO.strokeLine(endpoint1.x, endpoint1.y, endpoint2.x, endpoint2.y);

		const directions = ({
			"slope-floor-left": ["left", "down"],
			"slope-floor-right": ["right", "down"],
			"slope-ceiling-left": ["left", "up"],
			"slope-ceiling-right": ["right", "up"]
		} as const)[tile];
		for(const [edge, direction] of [directions, [...directions].reverse()]) {
			const edgeCenter = center.add(Vector.unit(edge).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
			if(!World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(edge))), Directions.opposite(edge))) {
				const vertex1 = edgeCenter.add(Vector.unit(direction).multiply(-(WorldData.TILE_SIZE / 2 - accentInset * (1 + Math.SQRT2))));
				const vertex2 = edgeCenter.add(Vector.unit(direction).multiply(this.getAccentLength(position, edge, direction)));
				canvasIO.strokeLine(vertex1.x, vertex1.y, vertex2.x, vertex2.y);
			}
		}
	}
	getSlopeAccentLength(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction) {
		const solid90Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(adjacentDirection))), Directions.opposite(adjacentDirection));
		const accentInset = (WorldData.TILE_SIZE - WorldData.TILE_ACCENT_DISTANCE) / 2;
		if(!solid90Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 - accentInset * (1 + Math.SQRT2);
		}
		const solid135Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(adjacentDirection))), perpendicularDirection);
		if(!solid135Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 - accentInset;
		}
		const solid180Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(adjacentDirection).add(Vector.unit(perpendicularDirection)))), Directions.opposite(perpendicularDirection));
		if(!solid180Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 - accentInset / 2;
		}
		const solid225Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(adjacentDirection).add(Vector.unit(perpendicularDirection)))), Directions.opposite(adjacentDirection));
		if(!solid225Degrees) {
			return WorldData.TILE_SIZE * Math.SQRT2 / 2;
		}
		const solid270Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(perpendicularDirection))), adjacentDirection);
		if(!solid270Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 + accentInset * (Math.SQRT2 - 1);
		}
		const solid315Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(perpendicularDirection))), Directions.opposite(perpendicularDirection));
		if(!solid315Degrees) {
			return WorldData.TILE_SIZE / Math.SQRT2 + accentInset;
		}
		return WorldData.TILE_SIZE / Math.SQRT2 + accentInset * (1 + Math.SQRT2);
	}
	displaySolidTile(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLOR;
		canvasIO.ctx.fillRect(
			position.x * WorldData.TILE_SIZE - 1, 
			position.y * WorldData.TILE_SIZE - 1, 
			WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2
		);
	}
	getAccentLength(position: Vector, side: Direction, direction: Direction): number {
		const accentInset = (WorldData.TILE_SIZE - WorldData.TILE_ACCENT_DISTANCE) / 2;
		const solid135Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(direction))), Directions.opposite(direction));
		if(!solid135Degrees) {
			return WorldData.TILE_ACCENT_DISTANCE / 2;
		}
		const solid180Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(direction))), side);
		if(!solid180Degrees) {
			return WorldData.TILE_SIZE / 2 - accentInset * (Math.SQRT2 - 1);
		}
		const solid225Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(direction).add(Vector.unit(side)))), Directions.opposite(side));
		if(!solid225Degrees) {
			return WorldData.TILE_SIZE / 2;
		}
		const solid270Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(direction).add(Vector.unit(side)))), Directions.opposite(direction));
		if(!solid270Degrees) {
			return WorldData.TILE_SIZE / 2 + accentInset * (Math.SQRT2 - 1);
		}
		const solid315Degrees = World.isSolidOrSlope(this.tiles.get(position.add(Vector.unit(side))), direction);
		if(!solid315Degrees) {
			return WorldData.TILE_SIZE / 2 + accentInset;
		}
		return WorldData.TILE_SIZE / 2 + accentInset * (Math.SQRT2 + 1);
	}
	displayTileAccent(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "butt";

		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const side of Directions.DIRECTIONS) {
			const adjacentTile = this.tiles.get(position.add(Vector.unit(side)));
			if(World.isSolidOrSlope(adjacentTile, Directions.opposite(side))) { continue; }
			
			const edgeCenter = center.add(Vector.unit(side).multiply(WorldData.TILE_ACCENT_DISTANCE / 2));
			for(const direction of [Directions.rotateClockwise(side), Directions.rotateCounterclockwise(side)] as Direction[]) {
				const length = this.getAccentLength(position, side, direction);
				canvasIO.strokeLine(
					edgeCenter.x, edgeCenter.y,
					edgeCenter.x + Vector.unit(direction).x * length,
					edgeCenter.y + Vector.unit(direction).y * length
				);
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
	displayDebugInfo(canvasIO: CanvasIO) {
		for(const entity of this.entities) {
			if("displayHitbox" in entity) {
				entity.displayHitbox(canvasIO);
			}
			else if("displayHitboxes" in entity) {
				entity.displayHitboxes(canvasIO);
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
		if(!(Main.screen instanceof RoomEditor)) {
			this.camera = GameUtils.moveVectorTowards(this.camera, this.player.physicsObject.hitbox().center(), WorldData.CAMERA_SPEED);
		}
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
		return this.tiles.get(position) === slope && this.slopeIntersectionDistance(rectangle, position, slope) === 0;
	}
	collidingTiles(rectangle: Rectangle, collides: (object: { x: number, y: number, tile: Tile } | Entity) => boolean = () => true) {
		const tiles = [];
		for(const { position, tile } of this.getTilesAt(rectangle)) {
			const { x, y } = position;
			if(collides({ x, y, tile }) && (
				tile === "solid" ||
				(tile instanceof Gate && tile.openness !== 1 && rectangle.intersects(tile.getPhysicsBox(x, y))) ||
				tile instanceof LaserBlock ||
				tile instanceof SpikeballBlock ||
				(World.isSlope(tile) && this.intersectsSlope(rectangle, position, tile))
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
	static isSlopeBoundarySolid(slope: Slope, direction: Direction) {
		const edges = ({
			"slope-floor-left": ["left", "down"],
			"slope-floor-right": ["right", "down"],
			"slope-ceiling-left": ["left", "up"],
			"slope-ceiling-right": ["right", "up"]
		} as const)[slope];
		return (edges as readonly Direction[]).includes(direction);
	}
	static isSolidOrSlope(tile: Tile, direction: Direction) {
		return tile === "solid" || (World.isSlope(tile) && World.isSlopeBoundarySolid(tile,direction));
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
			World.isSlope(tile) && World.isSlopeBoundarySolid(tile, direction)
			|| (World.isSlope(adjacent) && World.isSlopeBoundarySolid(adjacent, Directions.opposite(direction)))
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
		if(!World.isSlope(slope)) {
			return Infinity;
		}
		const tileBox = new Rectangle(tilePosition.x, tilePosition.y, 1, 1).scale(WorldData.TILE_SIZE);
		const endpoints = ({
			"slope-floor-left": ["top-left", "bottom-right"],
			"slope-floor-right": ["top-right", "bottom-left"],
			"slope-ceiling-left": ["top-right", "bottom-left"],
			"slope-ceiling-right": ["top-left", "bottom-right"],
		} as const)[slope];
		return GameUtils.rayIntersectsSegment(position, direction, tileBox.getCorner(endpoints[0]), tileBox.getCorner(endpoints[1]));
	}
	tileIntersectionDistance(position: Vector, direction: Vector, maxDistance: number, ignoredTiles: Tile[] = []) {
		const tilePosition = this.getTileCoordinates(position);
		let result = Infinity;
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
	static isSlope(value: unknown): value is (typeof WorldData.SLOPES)[number] {
		return WorldData.SLOPES.includes(value  as any);
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
		else if(World.isSlope(tile)) {
			const reflections: { [key: string]: Slope } = {
				"slope-floor-left": "slope-floor-right",
				"slope-floor-right": "slope-floor-left",
				"slope-ceiling-left": "slope-ceiling-right",
				"slope-ceiling-right": "slope-ceiling-left"
			};
			return reflections[tile];
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
