import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Room, Traversability } from "./Room.mjs";

export class RoomPlaceholder {
	exits: Direction[];
	traversability: Traversability;
	room: Room | null = null;

	constructor(exits: Direction[], traversability: Traversability) {
		this.exits = exits;
		this.traversability = traversability;
	}
}
