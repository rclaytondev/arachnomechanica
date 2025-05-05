import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Creature } from "./creatures/Creature.js";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { DEBUG_SETTINGS, Main } from "./Main.js";
import { Particle } from "./Particle.mjs";
import { Player } from "./Player.mjs";
import { Room } from "./Room.mjs";
import { Gate } from "./tiles/Gate.mjs";

export type Tile = (typeof World.STRING_TILE_TYPES)[number] | Gate;

export class World {
	static TILE_SIZE = 50;
	static TILE_COLOR = "rgb(100, 100, 100)";
	static PLATFORM_THICKNESS = World.TILE_SIZE * 0.1;

	static STRING_TILE_TYPES = ["solid", "empty", "platform"] as const;

	tiles: Grid<Tile> = new Grid("empty");
	creatures: Creature[] = [];
	particles: Particle[] = [];

	player: Player = new Player();


	display(canvasIO: CanvasIO) {
		canvasIO.fillCanvas("white");
		canvasIO.ctx.save();
		if(Main.screen instanceof World && !DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			const playerPosition = this.player.physicsObject.hitbox().center();
			canvasIO.ctx.translate(canvasIO.canvas.width / 2 - playerPosition.x, canvasIO.canvas.height / 2 - playerPosition.y);
		}
		if(Main.screen instanceof World && DEBUG_SETTINGS.DISPLAY_WHOLE_LEVEL) {
			const amount = Math.min(
				canvasIO.canvas.width / (LevelGenerator.WIDTH * (Room.SIZE + LevelGenerator.MARGIN_X) * World.TILE_SIZE),
				canvasIO.canvas.height / (LevelGenerator.HEIGHT * (Room.SIZE + LevelGenerator.MARGIN_Y) * World.TILE_SIZE)
			);
			canvasIO.ctx.scale(amount, amount);
		}
		this.displayTiles(canvasIO);
		this.displayParticles(canvasIO);
		this.displayCreatures(canvasIO);
		if(!this.player.dead) {
			this.player.display(canvasIO);
		}
		canvasIO.ctx.restore();
	}
	displayTiles(canvasIO: CanvasIO) {
		for(const [tile, position] of this.tiles.entries()) {
			if(tile === "solid") {
				canvasIO.ctx.fillStyle = World.TILE_COLOR;
				canvasIO.ctx.fillRect(
					position.x * World.TILE_SIZE - 1, 
					position.y * World.TILE_SIZE - 1, 
					World.TILE_SIZE + 2, World.TILE_SIZE + 2
				);
			}
			else if(tile === "platform") {
				canvasIO.ctx.fillStyle = World.TILE_COLOR;
				canvasIO.ctx.fillRect(
					position.x * World.TILE_SIZE,
					position.y * World.TILE_SIZE,
					World.TILE_SIZE, World.PLATFORM_THICKNESS
				)
			}
			else if(tile !== "empty") {
				tile.display(canvasIO, position.x, position.y);
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
		return Math.floor(onscreenX / World.TILE_SIZE);
	}
	getTileY(onscreenY: number) {
		return Math.floor(onscreenY / World.TILE_SIZE);
	}
	getTileCoordinates(onscreenPosition: Vector) {
		return new Vector(
			Math.floor(onscreenPosition.x / World.TILE_SIZE), 
			Math.floor(onscreenPosition.y / World.TILE_SIZE)
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
		return (typeof value === "string" && (World.STRING_TILE_TYPES as readonly string[]).includes(value))
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
