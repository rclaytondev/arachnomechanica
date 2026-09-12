import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { EnemyData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";

export class EnemyUtils {
	static isEnemy(entity: unknown): entity is Enemy {
		return entity instanceof Entity && entity.isEnemy;
	}

	static isStunned(enemy: Enemy) {
		return enemy.world.frameCount - enemy.stunTimeStart < EnemyData.STUN_TIME;
	}
	static isFlashing(enemy: Enemy) {
		return enemy.world.frameCount - enemy.stunTimeStart < EnemyData.FLASH_TIME;
	}
	static applyFlashTransform(canvasIO: CanvasIO, enemy: Enemy) {
		if(!EnemyUtils.isFlashing(enemy)) { return; }
		let progress = enemy.world.frameCount - enemy.stunTimeStart;
		progress = (progress > EnemyData.FLASH_TIME / 2) ? EnemyData.FLASH_TIME - progress : progress;
		const center = enemy.deathParticleCenter();
		const scale = GeomUtils.lerp(progress, 0, EnemyData.FLASH_TIME / 2, 1, EnemyData.FLASH_SCALE);
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(GeomUtils.lerp(progress, 0, EnemyData.FLASH_TIME / 2, 0, EnemyData.FLASH_ROTATION_RAD));
		canvasIO.ctx.scale(scale, scale);
		canvasIO.ctx.translate(-center.x, -center.y);
	}
	static stun(enemy: Enemy) {
		enemy.stunTimeStart = enemy.world.frameCount;
	}
}

export type Enemy = Entity & {
	readonly isEnemy: true,

	stunTimeStart: number,
}
