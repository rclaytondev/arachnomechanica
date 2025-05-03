import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../utils-ts/modules/Grid.mjs";
import { Room } from "./Room.mjs";

export const ROOMS: Room[] = [
	new Room(
		"two-wide-platforms",
		Grid.fromPositions("empty", "solid", [
			new Vector(0,0),
			new Vector(1,0),
			new Vector(2,0),
			new Vector(0,1),
			new Vector(0,2),
			new Vector(0,9),
			new Vector(0,10),
			new Vector(0,11),
			new Vector(1,11),
			new Vector(2,11),
			new Vector(9,11),
			new Vector(10,11),
			new Vector(11,11),
			new Vector(11,10),
			new Vector(11,9),
			new Vector(11,2),
			new Vector(11,1),
			new Vector(11,0),
			new Vector(10,0),
			new Vector(9,0),
			new Vector(3,8),
			new Vector(4,8),
			new Vector(5,8),
			new Vector(6,8),
			new Vector(7,8),
			new Vector(8,8),
			new Vector(3,3),
			new Vector(4,3),
			new Vector(5,3),
			new Vector(6,3),
			new Vector(7,3),
			new Vector(8,3),
		]),
		[],
		["left", "right", "up", "down"]
	)
];
