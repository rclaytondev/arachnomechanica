import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Room } from "./Room.mjs";

export class RoomSlot {
	exits: Set<Direction>;
	room: Room;
	generated: boolean = false;

	constructor(exits: Iterable<Direction>, room: Room) {
		this.exits = new Set(exits);
		this.room = room;
	}
}
