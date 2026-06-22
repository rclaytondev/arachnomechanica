import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";

export class Camera {
	position: Vector;

	constructor(position: Vector = new Vector(0, 0)) {
		this.position = position;
	}

	translation(canvasIO: CanvasIO) {
		return new Vector(canvasIO.canvas.width / 2 - this.position.x, canvasIO.canvas.height / 2 - this.position.y);
	}
	applyTranslation(canvasIO: CanvasIO) {
		const translation = this.translation(canvasIO);
		canvasIO.ctx.translate(translation.x, translation.y);
	}

	visibleRegion(canvasIO: CanvasIO, offscreenAmount: number) {
		return Rectangle.fromBounds(
			this.position.x - canvasIO.canvas.width / 2 - offscreenAmount,
			this.position.x + canvasIO.canvas.width / 2 + offscreenAmount,
			this.position.y - canvasIO.canvas.height / 2 - offscreenAmount,
			this.position.y + canvasIO.canvas.height / 2 + offscreenAmount,
		);
	}
	visibleTileRegion(canvasIO: CanvasIO, offscreenTiles: number = 0) {
		const center = this.position.divide(WorldData.TILE_SIZE);
		return Rectangle.fromBounds(
			Math.floor(center.x - (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)) - offscreenTiles,
			Math.ceil(center.x + (canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)) + offscreenTiles,
			Math.floor(center.y - (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)) - offscreenTiles,
			Math.ceil(center.y + (canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)) + offscreenTiles,
		);
	}

	update(target: Vector) {
		if(!Debug.freeCameraMode) {
			this.position = GameUtils.moveVectorTowards(this.position, target, WorldData.CAMERA_SPEED);
		}
		Debug.updateFreeCameraMode(this);
	}
}
