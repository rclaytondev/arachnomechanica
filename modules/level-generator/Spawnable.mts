import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { World } from "../world/World.mjs";

export type SpawnableID = "throwable-tiles" | "lizards" | "spiders" | "teleporting-creatures" | "spikeballs" | "lasers";
export type SpawnFunction = ((tileRegion: Rectangle, safeRegion: Rectangle, world: World) => void);

export class Spawnable {
	id: SpawnableID;
	spawn: SpawnFunction;
	optional: boolean;

	constructor(id: SpawnableID, optional: boolean, spawn: SpawnFunction) {
		this.id = id;
		this.spawn = spawn;
		this.optional = optional;
	}
}
