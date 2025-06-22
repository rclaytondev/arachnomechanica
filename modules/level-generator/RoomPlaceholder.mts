import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Room, Traversability } from "./Room.mjs";

export class RoomPlaceholder {
	exits: Direction[];
	room: Room;
	generated: boolean = false;

	constructor(exits: Direction[], room: Room) {
		this.exits = exits;
		this.room = room;
	}
}
