import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballBlockData, SpikeballData, SpikeballPattern, WorldData } from "../constants/GameData.mjs";
import { Spikeball } from "../entities/Spikeball.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { World } from "../world/World.mjs";
import { Diagonal } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { EmptyTile } from "./EmptyTile.mjs";
import { Tile } from "./Tile.mjs";

export class SpikeballBlock extends Tile {
	timeUntilSpawn: number = 0;
	timeSinceSpawn: number = 0;
	pattern: SpikeballPattern;
	patternStep: number = 0;
	spikeballs: Spikeball[] = [];
	doors: { [diagonal in Diagonal]: number } = {
		"up-left": 0,
		"up-right": 0,
		"down-left": 0,
		"down-right": 0,
	};

	constructor(pattern: SpikeballPattern = SpikeballBlockData.PATTERNS[0]) {
		super();
		this.pattern = pattern;
	}

	displayGlow(canvasIO: CanvasIO, x: number, y: number) {
		GameUtils.glowCircle(
			(x + 1/2) * WorldData.TILE_SIZE, (y + 1/2) * WorldData.TILE_SIZE, SpikeballBlockData.GLOW_SIZE,
			SpikeballBlockData.GLOW_INTENSITY,
			canvasIO,
			SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue,
		);
	}
	display(canvasIO: CanvasIO, x: number, y: number) {
		canvasIO.ctx.fillStyle = SpikeballBlockData.TILE_COLOR;
		canvasIO.fillSquare(x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);

		const center = new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE);

		for(const direction of Directions.DIAGONALS) {
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.rotateTo("up", direction);



			const openness = this.doors[direction];
			canvasIO.ctx.strokeStyle = `rgb(${SpikeballData.ACCENT_COLOR.red}, ${SpikeballData.ACCENT_COLOR.green}, ${SpikeballData.ACCENT_COLOR.blue})`;
			canvasIO.ctx.lineWidth = SpikeballBlockData.ACCENT_WIDTH;
			canvasIO.ctx.fillStyle = `rgb(${SpikeballData.ACCENT_COLOR.red}, ${SpikeballData.ACCENT_COLOR.green}, ${SpikeballData.ACCENT_COLOR.blue})`;
			canvasIO.strokeLine(0, 0, 0, -WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT);
			canvasIO.ctx.fillRect(-5, -5, 10, 10);


			canvasIO.ctx.fillStyle = SpikeballBlockData.DOOR_COLOR;
			canvasIO.ctx.fillRect(
				-WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
				WorldData.TILE_SIZE / 2 - openness, SpikeballBlockData.DOOR_HEIGHT,
			);
			canvasIO.ctx.fillRect(
				openness, -WorldData.TILE_SIZE / 2,
				WorldData.TILE_SIZE / 2 - openness, SpikeballBlockData.DOOR_HEIGHT,
			);
			canvasIO.ctx.restore();
			// debugger;
		}
		for(const direction of Directions.DIAGONALS) {
			const openness = this.doors[direction];
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.rotateTo("up", direction);
			canvasIO.ctx.strokeStyle = GameUtils.formatColor(SpikeballData.ACCENT_COLOR);
			canvasIO.ctx.lineWidth = SpikeballBlockData.ACCENT_WIDTH;
			canvasIO.ctx.lineCap = "round";
			for(const sign of [1, -1]) {
				canvasIO.strokeLine(
					sign * (-WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2),
					-WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2,
					sign * Math.max(-openness - SpikeballBlockData.DOOR_HEIGHT / 2, -WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2),
					-WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2,
				);
			}
			canvasIO.ctx.restore();
		}
	}

	update(world: World, x: number, y: number, canvasIO: CanvasIO) {
		this.updateSpikeballs(world, x, y);
		this.updateDoors(world, x, y, canvasIO);
	}
	updateSpikeballs(world: World, x: number, y: number) {
		this.spikeballs = this.spikeballs.filter(
			s => world.entities.hasEntity(s) && s.bounces > SpikeballBlockData.BOUNCES_LEFT_BEFORE_SPAWN,
		);
		if(this.spikeballs.length === 0) {
			this.timeUntilSpawn --;
		}
		this.timeSinceSpawn ++;
		if(this.timeUntilSpawn < 0) {
			this.spawnSpikeballs(world, x, y);
			this.timeUntilSpawn = SpikeballBlockData.SPAWN_FREQUENCY;
			this.timeSinceSpawn = 0;
		}
	}
	updateDoors(world: World, x: number, y: number, canvasIO: CanvasIO) {
		for(const xDirection of ["left", "right"] as const) {
			for(const yDirection of ["up", "down"] as const) {
				const patternStep = this.pattern[this.patternStep];
				const direction = `${yDirection}-${xDirection}` as Diagonal;
				const open = (
					this.timeUntilSpawn < SpikeballBlockData.DOOR_OPENING_TIME
					&& patternStep.some(p => p[0] === xDirection && p[1] === yDirection)
				) || (
					this.doors[direction] === SpikeballBlockData.DOOR_OPENNESS
					&& this.timeSinceSpawn < SpikeballBlockData.DOOR_CLOSE_DELAY
				);
				const target = open ? SpikeballBlockData.DOOR_OPENNESS : 0;
				this.doors[direction] = GameUtils.moveTowards(this.doors[direction], target, SpikeballBlockData.DOOR_OPENING_SPEED);
				if(open) {
					this.spawnParticles(x, y, xDirection, yDirection, world, canvasIO);
				}
			}
		}
	}
	spawnParticles(x: number, y: number, xDirection: "left" | "right", yDirection: "up" | "down", world: World, canvasIO: CanvasIO) {
		const diagonal = `${yDirection}-${xDirection}` as Diagonal;
		const perpendicular = Directions.rotateClockwise[diagonal];
		for(let i = 0; i < SpikeballBlockData.PARTICLE_SPAWN_ATTEMPTS; i ++) {
			if(Math.random() < SpikeballBlockData.PARTICLE_SPAWN_PROBABILITY) {
				const offset = GameUtils.random(-SpikeballBlockData.PARTICLE_PERPENDICULAR_OFFSET, SpikeballBlockData.PARTICLE_PERPENDICULAR_OFFSET);
				const velocity = GameUtils.random(SpikeballBlockData.PARTICLE_MIN_VELOCITY, SpikeballBlockData.PARTICLE_MAX_VELOCITY);
				world.addParticle(new Particle(
					new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE).add(Vector.unit(perpendicular).multiply(offset)),
					Vector.unit(diagonal).multiply(velocity),
					SpikeballBlockData.PARTICLE_SETTINGS,
				), canvasIO);
			}
		}
	}

	spawnSpikeballs(world: World, x: number, y: number) {
		const spikeballs = [];
		for(const [xDirection, yDirection] of this.pattern[this.patternStep]) {
			if(this.canSpawnSpikeball(x, y, xDirection, yDirection, world)) {
				const spikeball = this.spawnSpikeball(x, y, xDirection, yDirection, world);
				if(spikeball != null) {
					spikeballs.push(spikeball);
				}
			}
		}

		for(const spikeball of spikeballs) {
			for(const other of spikeballs.filter(s => s !== spikeball)) {
				spikeball.overlappingObjects.push(other);
			}
		}

		this.nextPatternStep(world, x, y);
	}
	nextPatternStep(world: World, x: number, y: number) {
		let foundSpawnable = false;
		while(!foundSpawnable) {
			this.patternStep ++;
			this.patternStep %= this.pattern.length;
			for(const [xDirection, yDirection] of this.pattern[this.patternStep]) {
				if(this.canSpawnSpikeball(x, y, xDirection, yDirection, world)) {
					foundSpawnable = true;
				}
			}
		}
	}
	canSpawnSpikeball(x: number, y: number, xDirection: Direction, yDirection: Direction, world: World) {
		const tileX = world.tiles.get(Vector.unit(xDirection).add(x, y));
		const tileY = world.tiles.get(Vector.unit(yDirection).add(x, y));
		const tileDiagonal = world.tiles.get(Vector.unit(xDirection).add(Vector.unit(yDirection)).add(x, y));
		return (tileX === EmptyTile.EMPTY || tileY === EmptyTile.EMPTY) && tileDiagonal === EmptyTile.EMPTY;
	}
	spawnSpikeball(x: number, y: number, xDirection: Direction, yDirection: Direction, world: World) {
		const spikeball = new Spikeball(
			new Vector(x + 1/2, y + 1/2).multiply(WorldData.TILE_SIZE).subtract(SpikeballData.RADIUS, SpikeballData.RADIUS),
			Vector.unit(xDirection).add(Vector.unit(yDirection)).multiply(SpikeballData.SPEED),
		);
		spikeball.overlappingObjects.push(
			new Vector(x, y),
			new Vector(x, y).add(Vector.unit(xDirection)),
			new Vector(x, y).add(Vector.unit(yDirection)),
			new Vector(x, y).add(Vector.unit(xDirection)).add(Vector.unit(yDirection)),
		);
		const intersecting = world.entities.collideablesIntersecting(spikeball.hitbox);
		if(intersecting.size === 0) {
			this.spikeballs.push(spikeball);
			world.entities.addEntity(spikeball);
			return spikeball;
		}
		return null;
	}

	copy() {
		const copy = new SpikeballBlock([]);
		copy.timeUntilSpawn = this.timeUntilSpawn;
		return copy;
	}

	static canSpawn(position: Vector, world: World) {
		const block = new SpikeballBlock([]);
		return (
			block.canSpawnSpikeball(position.x, position.y, "left", "up", world)
			|| block.canSpawnSpikeball(position.x, position.y, "left", "down", world)
			|| block.canSpawnSpikeball(position.x, position.y, "right", "up", world)
			|| block.canSpawnSpikeball(position.x, position.y, "right", "down", world)
		);
	}

	angularMotionBlockers(tilePosition: Vector, point: Vector): (Direction | Diagonal)[] {
		return Tile.fullAngularMotionBlockers(tilePosition, point);
	}
}
