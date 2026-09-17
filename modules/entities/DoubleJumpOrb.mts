import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DoubleJumpOrbData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

export class DoubleJumpOrb extends Entity {
	position: Vector;
	constructor(position: Vector, world: World) {
		super(world);
		this.position = position;
	}

	render(): Renderable[] {
		return [
			new Renderable(this.displayGlow.bind(this), "glow"),
			new Renderable(this.display.bind(this), "background-entity"),
		];
	}

	update() { }

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = "rgb(0, 128, 255)";
		canvasIO.fillCircle(this.position.x, this.position.y, DoubleJumpOrbData.RADIUS);
	}
	displayGlow(canvasIO: CanvasIO) {
		GraphicsUtils.glowCircle(
			this.position.x, this.position.y,
			DoubleJumpOrbData.RADIUS + 50,
			1, canvasIO,
			0, 128, 255,
		);
	}

	boundingBox(): Rectangle {
		return Rectangle.fromCenter(
			this.position.x, this.position.y,
			2 * DoubleJumpOrbData.RADIUS, 2 * DoubleJumpOrbData.RADIUS,
		);
	}
}
