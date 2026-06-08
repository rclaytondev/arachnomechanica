import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldUIData } from "../constants/GameData.mjs";
import { World } from "../world/World.mjs";

export class WorldUI {
	display(world: World, canvasIO: CanvasIO) {
		this.displayHealth(world.player.health, canvasIO);
	}

	displayHealth(amount: number, canvasIO: CanvasIO) {
		const center = new Vector(
			WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE / 2,
			WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE / 2,
		);
		canvasIO.ctx.fillStyle = WorldUIData.HEALTH_COLOR;
		canvasIO.fillRegularPoly(center, WorldUIData.HEALTH_BOX_SIZE / 2, 6, 0);

		canvasIO.ctx.fillStyle = "black";
		canvasIO.ctx.font = WorldUIData.HEALTH_TEXT_FONT;
		canvasIO.ctx.textAlign = "center";
		canvasIO.ctx.textBaseline = "middle";
		canvasIO.ctx.fillText(amount.toString(), center.x, center.y);
	}
}
