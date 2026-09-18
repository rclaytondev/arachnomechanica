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
	active: boolean = false;
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

	update() {
		const intersects = this.world.player.hitbox.intersects(this.boundingBox());
		if(intersects && this.active) {
			this.world.player.velocity.y = -DoubleJumpOrbData.VELOCITY;
		}
		if(!intersects) {
			this.active = false;
		}
	}

	static IMAGE = GraphicsUtils.loadImage("graphics/double-jump-orb.png", 2 * DoubleJumpOrbData.RADIUS, 2 * DoubleJumpOrbData.RADIUS);
	display(canvasIO: CanvasIO) {
		const corner = this.position.subtract(DoubleJumpOrbData.RADIUS, DoubleJumpOrbData.RADIUS);
		canvasIO.ctx.drawImage(DoubleJumpOrb.IMAGE, corner.x, corner.y);
	}
	displayGlow(canvasIO: CanvasIO) {
		GraphicsUtils.glowCircle(
			this.position.x, this.position.y,
			DoubleJumpOrbData.RADIUS + 80,
			1, canvasIO,
			30, 150, 255,
		);
	}

	boundingBox(): Rectangle {
		return Rectangle.fromCenter(
			this.position.x, this.position.y,
			2 * DoubleJumpOrbData.RADIUS, 2 * DoubleJumpOrbData.RADIUS,
		);
	}
}
