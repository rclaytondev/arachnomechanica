import { assert } from "chai";
import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { lizardAdjacentTileScenario } from "../debug-scenarios/lizard-adjacent-tile-test.mjs";

describe("Lizard enemy", () => {
	const canvasIO = new CanvasIO();
	it("does not breathe fire when there is a block directly on top of it but no block in front", () => {
		const [world, lizard, tile] = lizardAdjacentTileScenario.setupWorld();

		for(let i = 0; i < 30; i ++) {
			world.update(canvasIO);
		}

		assert.isTrue(world.entities.has(tile));
	});
});
