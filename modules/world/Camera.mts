import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { WorldBorder } from "../entities/WorldBorder.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Entities } from "./Entities.mjs";

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

	static visibleRegion(canvasIO: CanvasIO, position: Vector, offscreenAmount: number) {
		return Rectangle.fromBounds(
			position.x - canvasIO.canvas.width / 2 - offscreenAmount,
			position.x + canvasIO.canvas.width / 2 + offscreenAmount,
			position.y - canvasIO.canvas.height / 2 - offscreenAmount,
			position.y + canvasIO.canvas.height / 2 + offscreenAmount,
		);
	}
	visibleRegion(canvasIO: CanvasIO, offscreenAmount: number) {
		return Camera.visibleRegion(canvasIO, this.position, offscreenAmount);
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

	static isCameraPositionValid(position: Vector, entities: Entities, canvasIO: CanvasIO) {
		const rect = Camera.visibleRegion(canvasIO, position, 0);
		const collideables = [...entities.collideablesIntersecting(rect)];
		const worldBorders = collideables.filter(e => e instanceof WorldBorder);
		return worldBorders.length === 0;
	}
	moveCameraIfValid(offset: Vector, entities: Entities, canvasIO: CanvasIO) {
		const validBefore = Camera.isCameraPositionValid(this.position, entities, canvasIO);
		const validAfter = Camera.isCameraPositionValid(this.position.add(offset), entities, canvasIO);
		if(!validBefore || validAfter) {
			this.position = this.position.add(offset);
			return true;
		}
		return false;
	}
	update(target: Vector, entities: Entities, canvasIO: CanvasIO) {
		if(!Debug.freeCameraMode) {
			const newPosition = GameUtils.moveVectorTowards(this.position, target, WorldData.CAMERA_SPEED);
			this.moveCameraIfValid(new Vector(newPosition.x - this.position.x, 0), entities, canvasIO);
			this.moveCameraIfValid(new Vector(0, newPosition.y - this.position.y), entities, canvasIO);
		}
		Debug.updateFreeCameraMode(this);
	}
}
