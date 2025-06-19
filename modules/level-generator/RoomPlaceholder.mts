import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Room, Traversability } from "./Room.mjs";

export class RoomPlaceholder {
	exits: Direction[];
	traversability: Traversability;
	room: Room | null = null;

	constructor(exits: Direction[], traversability: Traversability, position: Vector) {
		this.exits = exits;
		this.traversability = traversability;
		for(const { start, end } of traversability) {
			start.position = position;
			end.position = position;
		}
	}
}
