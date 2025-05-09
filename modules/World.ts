import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Creature } from "./creatures/Creature.js";
import { BackgroundData, LevelGeneratorData, RoomData, WorldData } from "./constants/GameData.mjs";
import { LevelGenerator } from "./level-generator/LevelGenerator.mjs";
import { Main } from "./Main.js";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { Particle } from "./Particle.mjs";
import { Player } from "./Player.mjs";
import { Room } from "./level-generator/Room.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { GearsBackground } from "./GearsBackground.mjs";

export type Tile = (typeof WorldData.STRING_TILE_TYPES)[number] | Gate;

export class World {
	tiles: Grid<Tile> = new Grid("empty");
	creatures: Creature[] = [];
	particles: Particle[] = [];
	background: GearsBackground = GearsBackground.generate();

	player: Player = new Player();


	display(canvasIO: CanvasIO) {
		canvasIO.fillCanvas(BackgroundData.BACKGROUND_COLOR);
		this.background.display(canvasIO, this.player.physicsObject.hitbox().center());
		canvasIO.ctx.save();
		if(Main.screen instanceof World && !DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			const playerPosition = this.player.physicsObject.hitbox().center();
			canvasIO.ctx.translate(canvasIO.canvas.width / 2 - playerPosition.x, canvasIO.canvas.height / 2 - playerPosition.y);
		}
		if(Main.screen instanceof World && DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			const amount = Math.min(
				canvasIO.canvas.width / (LevelGeneratorData.WIDTH * (RoomData.SIZE + LevelGeneratorData.MARGIN_X) * WorldData.TILE_SIZE),
				canvasIO.canvas.height / (LevelGeneratorData.HEIGHT * (RoomData.SIZE + LevelGeneratorData.MARGIN_Y) * WorldData.TILE_SIZE)
			);
			canvasIO.ctx.scale(amount, amount);
		}
		if(!this.player.dead) {
			this.player.display(canvasIO);
		}
		this.displayParticles(canvasIO);
		this.displayCreatures(canvasIO);
		this.displayTiles(canvasIO);
		canvasIO.ctx.restore();
	}
	visibleRegion(canvasIO: CanvasIO) {
		const center = this.player.physicsObject.hitbox().center().divide(WorldData.TILE_SIZE);
		return Rectangle.fromBounds(
			Math.floor(center.x - (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)),
			Math.ceil(center.x + (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)),
			Math.floor(center.y - (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)),
			Math.ceil(center.y + (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE))
		);
	}
	displayTiles(canvasIO: CanvasIO) {
		const region = this.visibleRegion(canvasIO);
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
				else if(tile !== "empty") {
					tile.display(canvasIO, x, y);
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
	displayCreatures(canvasIO: CanvasIO) {
		for(const creature of this.creatures) {
			creature.display(canvasIO);
		}
	}
	displayParticles(canvasIO: CanvasIO) {
		for(const particle of this.particles) {
			particle.display(canvasIO);
		}
	}

	update(canvasIO: CanvasIO) {
		this.updateCreatures();
		this.player.update(this, canvasIO);
		this.updateTiles();
		this.updateParticles();
	}
	updateCreatures() {
		for(const creature of this.creatures) {
			creature.update(this);
		}
		this.creatures = this.creatures.filter(c => !c.dead);
	}
	updateTiles() {
		for(const [tile, position] of this.tiles.entries()) {
			if(tile instanceof Gate) {
				tile.update(this, position.x, position.y);
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
	isInSolid(rectangle: Rectangle) {
		for(const { position, tile } of this.getTilesAt(rectangle)) {
			const { x, y } = position;
			if(
				tile === "solid" ||
				(tile instanceof Gate && tile.openness !== 1 && rectangle.intersects(tile.getPhysicsBox(x, y)))
			) { return true; }
		}
		for(const lizard of this.creatures) {
			if(lizard.hitboxes().some(b => rectangle.intersects(b))) {
				return true;
			}
		}
		return false;
	}

	static isTile(value: unknown): value is Tile {
		return (typeof value === "string" && (WorldData.STRING_TILE_TYPES as readonly string[]).includes(value))
			|| value instanceof Gate;
	}
	static reflectTile(tile: Tile) {
		if(tile === "solid" || tile === "empty" || tile === "platform") {
			return tile;
		}
		else if(tile instanceof Gate) {
			const result = tile.copy();
			tile.direction = Directions.reflectX(tile.direction);
			return result;
		}
		else { const _: never = tile; throw new Error(); }
	}
}
