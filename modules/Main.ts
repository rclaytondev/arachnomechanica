import { CanvasIO, canvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { LevelGenerator } from "./LevelGenerator.mjs";
import { Room } from "./Room.mjs";
import { World } from "./World.js";

const CORNER_SIZE = 3;
const EMPTY_ROOM = new World();
for(let i = 0; i < CORNER_SIZE; i ++) {
	EMPTY_ROOM.tiles.set(i, 0, "solid");
	EMPTY_ROOM.tiles.set(0, i, "solid");
	EMPTY_ROOM.tiles.set(Room.SIZE - 1 - i, 0, "solid");
	EMPTY_ROOM.tiles.set(Room.SIZE - 1, i, "solid");
	EMPTY_ROOM.tiles.set(0, Room.SIZE - 1 - i, "solid");
	EMPTY_ROOM.tiles.set(i, Room.SIZE - 1, "solid");
	EMPTY_ROOM.tiles.set(Room.SIZE - 1 - i, Room.SIZE - 1, "solid");
	EMPTY_ROOM.tiles.set(Room.SIZE - 1, Room.SIZE - 1 - i, "solid");
}

let frameCount = 0;
const FRAMERATE = 60;
const world = EMPTY_ROOM;
// world.tiles.set(7, 3, "solid");
// world.tiles.set(7, 1, "solid");
// world.tiles.set(0, 5, "solid");
// world.creatures.push(new Lizard(new Vector(200, 175), "right", 200, 3));

export const DEBUG_SETTINGS = {
	LIZARD_JOINT_COLOR: "rgba(255, 150, 0, 0)", // set to transparent to disable
	PLACE_BLOCKS_WITH_CURSOR: true,
	LOG_BLOCKS_KEY: "Enter",
	HOVERED_TILE_COLOR: "rgb(0, 0, 0)" // set to transparent to disable
};

window.setInterval(() => {
	world.update(canvasIO!);
	world.display(canvasIO!);
	frameCount ++;
}, 1000 / FRAMERATE);

export { frameCount };
