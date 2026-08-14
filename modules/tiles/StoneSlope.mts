import { Diagonal, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../world/World.mjs";
import { SlopeTile } from "./SlopeTile.mjs";
import { StoneTileRenderer } from "./StoneTile.mjs";
import { Tile } from "./Tile.mjs";

export class StoneSlope extends SlopeTile {
	constructor(normal: Diagonal) {
		super(normal);
	}

	render(tilePosition: Vector, world: World) {
		const stoneTileRenderer = world.staticEntities.entitiesList.find(e => e instanceof StoneTileRenderer);
		if(!stoneTileRenderer) {
			world.staticEntities.entitiesList.push(new StoneTileRenderer());
		}
		return [];
	}
	display() { }

	copy() { return this; }

	reflect() {
		const reflected = Directions.reflectX[this.normal];
		return new StoneSlope(reflected);
	}
	equals(tile: Tile): boolean {
		return tile instanceof StoneSlope && tile.normal === this.normal;
	}
}
