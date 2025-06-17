import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Traversability } from "./Room.mjs";

export class RoomPlaceholder {
	exits: Direction[];
	traversability: Traversability;

	constructor(exits: Direction[], traversability: Traversability) {
		this.exits = exits;
		this.traversability = traversability;
	}
}
