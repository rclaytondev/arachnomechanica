import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../world/World.mjs";
import { Slope, SlopeTile } from "./SlopeTile.mjs";
import { StoneTileRenderer } from "./StoneTile.mjs";
import { Tile } from "./Tile.mjs";

export class StoneSlope extends SlopeTile {
	constructor(shape: Slope) {
		super(shape);
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
		const reflections: { [key: string]: Slope } = {
			"slope-floor-left": "slope-floor-right",
			"slope-floor-right": "slope-floor-left",
			"slope-ceiling-left": "slope-ceiling-right",
			"slope-ceiling-right": "slope-ceiling-left",
		};
		return new StoneSlope(reflections[this.shape]);
	}
	equals(tile: Tile): boolean {
		return tile instanceof StoneSlope && tile.shape === this.shape;
	}
}
