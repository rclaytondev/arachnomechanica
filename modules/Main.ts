import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { LizardData, RoomData } from "./constants/GameData.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { GameUtils } from "./GameUtils.mjs";
import { LevelGenerator } from "./level-generator/LevelGenerator.mjs";
import { Room } from "./level-generator/Room.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { ROOMS } from "./level-generator/Rooms.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { World } from "./World.js";
import { WorldGenerator } from "./level-generator/WorldGenerator.mjs";

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

const CORNER_SIZE = 3;
const EMPTY_ROOM = new World();
for(let i = 0; i < CORNER_SIZE; i ++) {
	EMPTY_ROOM.tiles.set(i, 0, "solid");
	EMPTY_ROOM.tiles.set(0, i, "solid");
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1 - i, 0, "solid");
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1, i, "solid");
	EMPTY_ROOM.tiles.set(0, RoomData.SIZE - 1 - i, "solid");
	EMPTY_ROOM.tiles.set(i, RoomData.SIZE - 1, "solid");
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1 - i, RoomData.SIZE - 1, "solid");
	EMPTY_ROOM.tiles.set(RoomData.SIZE - 1, RoomData.SIZE - 1 - i, "solid");
}

let frameCount = 0;
const FRAMERATE = 60;
const world = new World();
// world.tiles.set(0, 5, "solid")
// world.tiles.set(2, 5, "solid")
// world.tiles.set(5, 4, "solid")
// world.tiles.set(4, 0, "solid")
// world.tiles.set(5, 1, "solid")
// world.tiles.set(-2, 0, "solid")
// world.tiles.set(-3, 1, "solid")
// ROOMS.find(r => r.name === "empty-room")!.add(new Vector(-6, -6), world, []);
world.creatures.push(new Lizard(new Vector(25, 175), "down", 200, LizardData.SPEED));
// world.player.physicsObject.positionInt.y -= 350;
// world.creatures.push(new Lizard(new Vector(75, -75), "up", 300, LizardData.SPEED));
// world.creatures.push(new Lizard(new Vector(25, 75), "right", 300, LizardData.SPEED));

LevelGenerator.initializeRooms();

export class Main {
	static screen: World | RoomEditor = new WorldGenerator().generate();
	// static screen: World | RoomEditor = new RoomEditor();
	// static screen: World | RoomEditor = world;

	static update(canvasIO: CanvasIO) {
		this.screen.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
		if(DEBUG_SETTINGS.PRINT_RNG_KEY !== null && canvasIO.keys[DEBUG_SETTINGS.PRINT_RNG_KEY]) {
			console.log(recordedRNG.join(", "));
		}
	}
	static display(canvasIO: CanvasIO) {
		this.screen.display(canvasIO);
	}
}


if(DEBUG_SETTINGS.EDITOR_ROOM != null  && Main.screen instanceof RoomEditor) {
	const room = (typeof DEBUG_SETTINGS.EDITOR_ROOM === "number")
		? ROOMS[DEBUG_SETTINGS.EDITOR_ROOM]
		: ROOMS.find(r => r.name === DEBUG_SETTINGS.EDITOR_ROOM);
	if(!room) {
		throw new Error(`Room "${DEBUG_SETTINGS.EDITOR_ROOM}" does not exist.`);
	}
	console.log(`loaded room ${room.name} in the editor`);
	Main.screen = new RoomEditor(room);
}

const frameTimes: number[] = [];

window.setInterval(() => {
	Main.update(canvasIO!);
	Main.display(canvasIO!);
	frameCount ++;

	if(DEBUG_SETTINGS.LOG_FRAMERATE) {
		const now = Date.now();
		frameTimes.push(now);
		while(frameTimes[0] < now - 1000) {
			frameTimes.shift();
		}
		console.log(frameTimes.length);
	}
}, 1000 / FRAMERATE);

export { frameCount };
