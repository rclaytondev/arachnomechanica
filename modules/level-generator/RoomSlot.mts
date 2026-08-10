import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Room } from "./Room.mjs";

export class RoomSlot {
	exits: Set<Direction>;
	#room: Room;
	#generated: boolean = false;

	constructor(exits: Iterable<Direction>, room: Room) {
		this.exits = new Set(exits);
		this.#room = room;
	}

	getRoom() {
		return this.#room;
	}
	setRoom(room: Room) {
		if(this.#generated) {
			throw new Error("Cannot place a room in a room slot that has already been generated.");
		}
		this.#room = room;
	}

	getGenerated() {
		return this.#generated;
	}
	setGenerated() {
		this.#generated = true;
	}
}
