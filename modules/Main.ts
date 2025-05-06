import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { RoomData } from "./constants/GameData.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { GameUtils } from "./GameUtils.mjs";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { Room } from "./Room.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { ROOMS } from "./Rooms.mjs";
import { Gate } from "./tiles/Gate.mjs";
import { World } from "./World.js";
import { WorldGenerator } from "./WorldGenerator.mjs";

Math.random = () => 0;

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
// world.tiles.set(7, 3, "solid");
// world.tiles.set(7, 1, "solid");
world.tiles.set(0, 5, "solid");
world.tiles.set(1, 5, "solid");
world.tiles.set(1, 3, "solid");
world.tiles.set(2, 3, "solid");
// world.tiles.set(3, 3, "solid");
// world.tiles.set(4, 3, "solid");
world.tiles.set(-1, 5, "solid");
world.tiles.set(2, 5, "solid");
world.tiles.set(3, 5, "solid");
world.tiles.set(4, 5, "solid");
world.tiles.set(1, 4, new Gate("down", true));
world.tiles.set(1, 2, new Gate("up", false));
world.tiles.set(1, 1, new Gate("down", false));
world.tiles.set(-5, 8, "platform");
world.creatures.push(new Lizard(new Vector(-75, -25), "right", 200, 3));
world.tiles.set(0, -1, "solid");
world.tiles.set(-1, -2, "platform");
world.tiles.set(-1, 0, "solid");
// world.creatures[0].fireTimer = 120;
// world.creatures.push(new Lizard(new Vector(225, 25), "left", 200, 3));

LevelGenerator.initializeRooms();

export class Main {
	// static screen: World | RoomEditor = new WorldGenerator().generate();
	static screen: World | RoomEditor = new RoomEditor();
	// static screen: World | RoomEditor = world;

	static update(canvasIO: CanvasIO) {
		this.screen.update(canvasIO);

		Object.assign(GameUtils.pastKeys, canvasIO.keys);
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
