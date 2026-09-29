import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { SpikeballBlock } from "../entities/hazards/SpikeballBlock.mjs";
import { World } from "../game-engine/world/World.mjs";
import { ThrowableTileEntity } from "../items/ThrowableTileEntity.mjs";
import { SpikeballBlockData, WorldData } from "../constants/GameData.mjs";
import { TestScenario } from "../dev/TestScenario.mjs";

export const spikeballObstructionScenario = new TestScenario("spikeball-obstruction-scenario", () => {
	const world = new World(false);

	world.tiles.fillRect(Rectangle.fromDimensions(-2, -3, 10, 7), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(-1, -2, 8, 4), EmptyTile.EMPTY);
	world.tiles.set(5, 2, EmptyTile.EMPTY);
	world.entities.add(SpikeballBlock.atTile(new Vector(5, 2), SpikeballBlockData.PATTERNS[0], world));
	world.entities.add(new ThrowableTileEntity(new Vector(5 * WorldData.TILE_SIZE, WorldData.TILE_SIZE), [], world));

	return [world];
});

