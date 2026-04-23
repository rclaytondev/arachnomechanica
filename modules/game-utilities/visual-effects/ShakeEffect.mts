import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Renderable } from "../../world/Renderer.mjs";
import { World } from "../../world/World.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { StaticEntity } from "../StaticEntity.mjs";

export class ShakeEffect extends StaticEntity {
	timeLeft: number = 0;
	intensity: number = 0;

	constructor(time: number, intensity: number) {
		super();
		this.timeLeft = time;
		this.intensity = intensity;
	}

	update(world: World) {
		this.timeLeft --;
		if(this.timeLeft <= 0) {
			world.staticEntities.delete(this);
		}
	}

	render() {
		return [
			new Renderable(c => this.display(c), "shake"),
			new Renderable(c => c.ctx.restore(), "reset-shake"),
		];
	}
	display(canvasIO: CanvasIO): void {
		const amountX = GameUtils.random(-this.intensity, this.intensity);
		const amountY = GameUtils.random(-this.intensity, this.intensity);
		canvasIO.ctx.translate(amountX, amountY);
	}
}
