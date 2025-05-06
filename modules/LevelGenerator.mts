import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { Lizard } from "./creatures/Lizard.js";
import { GameUtils } from "./GameUtils.mjs";
import { Room } from "./Room.mjs";
import { ROOMS } from "./Rooms.mjs";
import { World } from "./World.js";
import { LevelGeneratorData, LizardData, RoomData, WorldData } from "./constants/GameData.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { GateState } from "./tiles/Gate.mjs";

export type RoomPlaceholder = { exits: Direction[], traversability: GateState[][] };

export class LevelGenerator {
	path: Vector[] = [];
	rooms: Grid<RoomPlaceholder> = new Grid({ exits: [], traversability: [] });

	static initializeRooms() {
		const length = ROOMS.length;
		for(let i = 0; i < length; i ++) {
			ROOMS.push(ROOMS[i].reflect());
		}
	}
}
