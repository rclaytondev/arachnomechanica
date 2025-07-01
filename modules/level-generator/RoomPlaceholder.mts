import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Room } from "./Room.mjs";

export class RoomPlaceholder {
	exits: Direction[];
	room: Room;
	generated: boolean = false;

	constructor(exits: Direction[], room: Room) {
		this.exits = exits;
		this.room = room;
	}
}
