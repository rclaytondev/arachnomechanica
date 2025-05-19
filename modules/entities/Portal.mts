import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { PortalData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { World } from "../World";

export class Portal {
	position: Vector;
	lines: { position: Vector, length: number }[] = [];

	constructor(position: Vector) {
		this.position = position;
	}

	update(world: World, canvasIO: CanvasIO) {
		for(let i = 0; i < PortalData.LINES_PER_FRAME; i ++) {
			this.addLine();
		}

		for(const line of this.lines) {
			line.position.y -= PortalData.LINE_SPEED;
		}
	}
	addLine() {
		this.lines.push({
			position: new Vector(
				this.position.x + GameUtils.random(-PortalData.LINE_SPAWN_WIDTH / 2, PortalData.LINE_SPAWN_WIDTH / 2),
				this.position.y
			),
			length: GameUtils.random(PortalData.MIN_LINE_LENGTH, PortalData.MAX_LINE_LENGTH)
		});
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PortalData.COLOR;
		canvasIO.ctx.fillRect(
			this.position.x - PortalData.WIDTH / 2, this.position.y - PortalData.BASE_HEIGHT,
			PortalData.WIDTH, PortalData.BASE_HEIGHT
		);

		canvasIO.ctx.strokeStyle = PortalData.LINE_COLOR;
		canvasIO.ctx.lineWidth = PortalData.LINE_WIDTH
		for(const { position, length } of this.lines) {
			canvasIO.strokeLine(position.x, position.y, position.x, position.y + length);
		}
	}
}
