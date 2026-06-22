import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { FLOOR_ZERO, FloorZeroData } from "../constants/FloorZeroData.mjs";
import { WorldData, WorldGeneratorData } from "../constants/GameData.mjs";
import { World } from "../world/World.mjs";
import { TowerGenerator } from "./TowerGenerator.mjs";
import { WorldGenerationSegment } from "./WorldGenerationSegment.mjs";

export class FloorZero extends WorldGenerationSegment {
	generated: boolean = false;

	static getRegion() {
		const floorOne = TowerGenerator.nextLevelTileRectangle(0, true);
		return new Rectangle(
			floorOne.x, floorOne.bottom(),
			floorOne.width,
			FLOOR_ZERO.tiles.boundingBox().height,
		);
	}

	shouldGenerate(world: World): boolean {
		if(this.generated) { return false; }

		const region = FloorZero.getRegion().scale(WorldData.TILE_SIZE);
		return region.distanceTo(world.player.hitbox.center()) < WorldGeneratorData.GENERATION_DISTANCE;
	}

	generate(world: World) {
		const region = FloorZero.getRegion();
		const width = FLOOR_ZERO.tiles.boundingBox().width;
		const extensionLeft = Math.floor((region.width - width) / 2);
		const extensionRight = Math.ceil((region.width - width) / 2);
		const extended = FLOOR_ZERO.extend("left", extensionLeft).extend("right", extensionRight);

		extended.add(world, region.getCorner("top-left").add(extensionLeft, 0));
		this.generated = true;
	}
}

LoadingManager.onload(() => {
	FloorZeroData.initialize();
});
