import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { LaserBlockData, LizardData, PlayerData, RoomData, SpikeballBlockData } from "./constants/GameData.mjs";
import { Lizard } from "./entities/Lizard.js";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Room } from "./level-generator/Room.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { Rooms, ROOMS } from "./level-generator/Rooms.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { World } from "./World.js";
import { LaserBlock } from "./tiles/LaserBlock.mjs";
import { Spikeball } from "./entities/Spikeball.mjs";
import { SpikeballBlock } from "./tiles/SpikeballBlock.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Portal } from "./entities/Portal.mjs";
import { Humanoid } from "./entities/Humanoid.mjs";
import { SolidTile } from "./tiles/SolidTile.mjs";
import { WorldGenerator } from "./level-generator/WorldGenerator.mjs";
import { PointOnSurface, Spider, SpiderProjectile, Surface } from "./entities/Spider.mjs";

const recordedRNG: number[] = [];
let rngOverrideIndex = 0;
if(DEBUG_SETTINGS.PRINT_RNG_KEY) {
	const oldRandom = Math.random;
	Math.random = () => {
		const result = (rngOverrideIndex < DEBUG_SETTINGS.RNG_OVERRIDE_VALUES.length)
			? DEBUG_SETTINGS.RNG_OVERRIDE_VALUES[rngOverrideIndex]
			: oldRandom();
		rngOverrideIndex ++;
		recordedRNG.push(result);
		return result;
	};
}

Rooms.initialize();
Room.addRoomVariants();

const CORNER_SIZE = 3;
const EMPTY_ROOM = new World(false);
for(let i = 0; i < CORNER_SIZE; i ++) {
	EMPTY_ROOM.tiles.set(i, 0, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(0, i, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1 - i, 0, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1, i, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(0, RoomData.SIZE - 1 - i, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(i, RoomData.SIZE - 1, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1 - i, RoomData.SIZE - 1, new SolidTile("solid", "tower"));
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1, RoomData.SIZE - 1 - i, new SolidTile("solid", "tower"));
}

let frameCount = 0;
const FRAMERATE = 60;
const world = new World(false);
world.tiles.fillRect(new Rectangle(-5, -5, 10, 20), new SolidTile("solid", "tower"));
world.tiles.fillRect(new Rectangle(-4, -4, 8, 8), "empty");
const spider = new Spider(new Vector(75, 25));
// const spider = new Spider(new Vector(75, 125));
spider.movement = "counterclockwise";
spider.basepoint = new PointOnSurface(new Surface(new Vector(1, 4), "up"), 0);
// spider.basepoint = new PointOnSurface(new Surface(new Vector(2, 2), "down"), 25);
world.entities.push(spider);
world.entities.push(new SpiderProjectile(new Vector(0, -100), new Vector(0, 6)));

export class Main {
	// static screen: World | RoomEditor = new World(true).initializeGeneration();
	// static screen: World | RoomEditor = new RoomEditor();
	static screen: World | RoomEditor = world;

	static fadingOpacity: number = 0;
	static fadingDestination: number = 0;
	static fadingTimer: number = 0;

	static update(canvasIO: CanvasIO) {
		this.screen.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
		if(DEBUG_SETTINGS.PRINT_RNG_KEY !== null && canvasIO.keys[DEBUG_SETTINGS.PRINT_RNG_KEY]) {
			console.log(recordedRNG.join(", "));
		}
		Main.updateFading();
	}
	static updateFading() {
		if(this.screen instanceof World && this.screen.player.timeSinceDeath > PlayerData.DEATH_RESET_DELAY) {
			Main.fadingDestination = 1;
		}
		Main.fadingOpacity = GameUtils.moveTowards(Main.fadingOpacity, Main.fadingDestination, PlayerData.FADE_SPEED);
		if(Main.fadingOpacity === 1) {
			Main.fadingTimer ++;
		}
		if(Main.fadingTimer > PlayerData.FADE_DELAY) {
			Main.fadingTimer = 0;
			Main.fadingDestination = 0;
			throw new Error("Unimplemented: should reset world.");
		}
	}
	static display(canvasIO: CanvasIO) {
		this.screen.display(canvasIO);
		Main.displayFading(canvasIO);
	}
	static displayFading(canvasIO: CanvasIO) {
		canvasIO.fillCanvas(`rgba(0, 0, 0, ${this.fadingOpacity})`);
	}
}


if(Main.screen instanceof RoomEditor) {
	const room = (
		(typeof DEBUG_SETTINGS.EDITOR_ROOM === "number") ? ROOMS[DEBUG_SETTINGS.EDITOR_ROOM]
		: (typeof DEBUG_SETTINGS.EDITOR_ROOM === "string") ? ROOMS.find(r => r.name === DEBUG_SETTINGS.EDITOR_ROOM)
		: [...ROOMS].reverse().find(r => !r.name.includes("-reflected") && !r.name.includes("-toggled"))
	);
	if(!room) {
		throw new Error(`Room "${DEBUG_SETTINGS.EDITOR_ROOM}" does not exist.`);
	}
	console.log(`loaded room ${room.name} in the editor`);
	Main.screen = new RoomEditor(room);
}

if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof World) {
	console.time("generating chunk");
	const debugWorld = new World(false);
	debugWorld.worldGenerator.generateChunk(new Vector(0, 0), debugWorld);
	debugWorld.worldGenerator.visualize(canvasIO!, false);
	console.timeEnd("generating chunk");
	debugger;
}

const frameTimes: number[] = [];

window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	frameCount ++;

	if(DEBUG_SETTINGS.SHOW_FRAMERATE) {
		const now = Date.now();
		frameTimes.push(now);
		while(frameTimes[0] < now - 1000) {
			frameTimes.shift();
		}
		canvasIO!.ctx.resetTransform();
		canvasIO!.ctx.fillStyle = "red";
		canvasIO!.ctx.textBaseline = "top";
		canvasIO!.ctx.font = "30px monospace";
		canvasIO!.ctx.fillText(`${frameTimes.length} FPS`, 0, 0);
	}
}, 1000 / FRAMERATE);

export { frameCount };
