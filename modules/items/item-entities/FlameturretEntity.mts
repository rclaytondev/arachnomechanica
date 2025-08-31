import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, LizardData, PlayerData } from "../../constants/GameData.mjs";
import { FireSpawner } from "../../game-utilities/FireSpawner.mjs";
import { PhysicsObject } from "../../game-utilities/PhysicsObject.mjs";
import { World } from "../../world/World";

export class FlameturretEntity {
	physicsObject: PhysicsObject;
	fireSpawnerLeft: FireSpawner;
	fireSpawnerRight: FireSpawner;

	constructor() {
		this.physicsObject = new PhysicsObject(
			new Vector(0, 0),
			Rectangle.square(0, 0, ItemData.FLAMETURRET.SIZE),
		);
		this.physicsObject.collides = (obj) => obj !== this;

		this.fireSpawnerLeft = new FireSpawner(new Vector(0, 0), "left", LizardData.FIRE);
		this.fireSpawnerRight = new FireSpawner(new Vector(0, 0), "right", LizardData.FIRE);
	}

	display(canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		canvasIO.ctx.fillStyle = "black";
		canvasIO.fillDiamond(center.x, center.y, ItemData.FLAMETURRET.SIZE / 2);
	}

	update(world: World, canvasIO: CanvasIO) {
		this.physicsObject.velocity.x *= ItemData.FRICTION_X;
		this.physicsObject.applyGravity(PlayerData.GRAVITY);
		this.physicsObject.move(this.physicsObject.velocity, world, (direction) => {
			if(Directions.isVertical(direction)) {
				this.physicsObject.velocity.y = 0;
			}
		});
		world.entities.moveEntity(this);

		this.updateFire(world, canvasIO);
	}
	updateFire(world: World, canvasIO: CanvasIO) {
		const center = this.physicsObject.hitbox().center();
		for(const fireSpawner of [this.fireSpawnerLeft, this.fireSpawnerRight]) {
			fireSpawner.position = center;
			fireSpawner.update(world, canvasIO);
			fireSpawner.updateHurtbox(world, canvasIO);
			const hurtbox = fireSpawner.hurtbox(fireSpawner.maxHurtboxSize);
			if(world.isInSolid(hurtbox) && !hurtbox.intersects(world.player.physicsObject.hitbox())) {
				fireSpawner.startFire(LizardData.FIRE_DURATION);
			}
		}
	}

	boundingBox() {
		return this.physicsObject.hitbox();
	}

	hitboxes() {
		return [this.boundingBox()];
	}
}
