import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import {PlayerData } from "./constants/GameData.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Room } from "./level-generator/Room.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { Rooms, ROOMS } from "./level-generator/Rooms.mjs";
import { World } from "./world/World.js";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { SolidTile } from "./tiles/SolidTile.mjs";

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

const world = new World(false);
world.tiles.fillRect(new Rectangle(-5, 0, 9, 3), new SolidTile("solid", "tower"));


export class Main {
	static screen: World | RoomEditor = new World(true).initializeGeneration();
	// static screen: World | RoomEditor = new RoomEditor();
	// static screen: World | RoomEditor = world;

	static fadingOpacity: number = 0;
	static fadingDestination: number = 0;
	static fadingTimer: number = 0;

	static update(canvasIO: CanvasIO) {
		this.screen.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
		if(DEBUG_SETTINGS.PRINT_RNG_KEY !== null && canvasIO.keys[DEBUG_SETTINGS.PRINT_RNG_KEY]) {
			// eslint-disable-next-line no-console
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
	// eslint-disable-next-line no-console
	console.log(`loaded room ${room.name} in the editor`);
	Main.screen = new RoomEditor(room);
}

if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof World) {
	// eslint-disable-next-line no-console
	console.time("generating chunk");
	const debugWorld = new World(false);
	debugWorld.worldGenerator.generateLevel(debugWorld);
	debugWorld.worldGenerator.visualize(canvasIO!, false);
	// eslint-disable-next-line no-console
	console.timeEnd("generating chunk");
	// eslint-disable-next-line no-debugger
	debugger;
}


const FRAMERATE = 60;
const frameTimes: number[] = [];

window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	GameUtils.frameCount ++;

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
