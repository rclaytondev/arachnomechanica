import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Room } from "./level-generator/Room.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { ROOMS, Rooms } from "./level-generator/Rooms.mjs";
import { World } from "./world/World.js";
import { WorldGenerator } from "./level-generator/WorldGenerator.mjs";
import { ScreenFade } from "./game-utilities/ScreenFade.mjs";
import { PlayerData } from "./constants/GameData.mjs";

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


export class Main {
	static screen: World | RoomEditor = new World(true).initializeGeneration();

	static screenFades: ScreenFade[] = [];

	static update(canvasIO: CanvasIO) {
		this.screen.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
		if(DEBUG_SETTINGS.PRINT_RNG_KEY !== null && canvasIO.keys[DEBUG_SETTINGS.PRINT_RNG_KEY]) {
			// eslint-disable-next-line no-console
			console.log(recordedRNG.join(", "));
		}
		Main.updateScreenFades();
	}
	static updateScreenFades() {
		for(const screenFade of Main.screenFades) {
			screenFade.update();
		}
	}
	static display(canvasIO: CanvasIO) {
		this.screen.display(canvasIO);
		Main.displayScreenFades(canvasIO);
	}
	static displayScreenFades(canvasIO: CanvasIO) {
		for(const screenFade of this.screenFades) {
			screenFade.display(canvasIO);
		}
	}

	static beginDeathTransition() {
		const delay = new ScreenFade(PlayerData.DEATH_RESET_DELAY, 0, 0, "black", "transition-start-delay");
		const fadeOut = new ScreenFade(PlayerData.FADE_DURATION, 0, 1, "black", "transition-fade-out");
		const pause = new ScreenFade(PlayerData.FADE_DELAY, 1, 1, "black", "transition-pause");
		const fadeIn = new ScreenFade(PlayerData.FADE_DURATION, 1, 0, "black", "transition-fade-in");
		Main.screenFades.push(ScreenFade.sequence(delay, fadeOut, pause, fadeIn));
	}
}


const FRAMERATE = 60;
const frameTimes: number[] = [];

window.setInterval(() => {
	if(GameUtils.frameCount === 0 && Main.screen instanceof RoomEditor) {
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

	if(GameUtils.frameCount === 1 && DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS !== 0) {
		// eslint-disable-next-line no-console
		console.log(WorldGenerator.roomFrequencies(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS));
		// eslint-disable-next-line no-debugger
		debugger;
	}
}, 1000 / FRAMERATE);
