import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, LizardData, PlayerData } from "../../constants/GameData.mjs";
import { RectangularEntity } from "../../game-utilities/Entity.mjs";
import { FireSpawner } from "../../game-utilities/FireSpawner.mjs";
import { World } from "../../world/World";

export class FlameturretEntity extends RectangularEntity {
	velocity: Vector = new Vector(0, 0);
	fireSpawnerLeft: FireSpawner;
	fireSpawnerRight: FireSpawner;

	constructor() {
		super(Rectangle.square(0, 0, ItemData.FLAMETURRET.SIZE));
		const center = this.hitbox.center();
		this.fireSpawnerLeft = new FireSpawner(center.add(-ItemData.FLAMETURRET.FIRE_OFFSET, 0), "left", LizardData.FIRE);
		this.fireSpawnerRight = new FireSpawner(center.add(ItemData.FLAMETURRET.FIRE_OFFSET, 0), "right", LizardData.FIRE);
	}

	display(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.fillStyle = "black";
		canvasIO.fillDiamond(center.x, center.y, ItemData.FLAMETURRET.SIZE / 2);
	}

	update(world: World, canvasIO: CanvasIO) {
		this.velocity.x *= ItemData.FRICTION_X;
		this.velocity.y += PlayerData.GRAVITY;
		this.move(this.velocity, world, {
			onCollision: (direction) => {
				if(Directions.isVertical(direction)) {
					this.velocity.y = 0;
				}
			},
			collides: (obj) => obj !== this,
		});
		world.entities.moveEntity(this);

		this.updateFire(world, canvasIO);
	}
	updateFire(world: World, canvasIO: CanvasIO) {
		for(const fireSpawner of [this.fireSpawnerLeft, this.fireSpawnerRight]) {
			fireSpawner.update(world, canvasIO);
			fireSpawner.updateHurtbox(world, canvasIO);
			const hurtbox = fireSpawner.hurtbox(fireSpawner.maxHurtboxSize);
			if(world.isInSolid(hurtbox) && !hurtbox.intersects(world.player.hitbox)) {
				world.isInSolid(hurtbox);
				fireSpawner.startFire(LizardData.FIRE_DURATION);
			}
		}
	}

	translate(amount: Vector) {
		this.hitbox.x += amount.x;
		this.hitbox.y += amount.y;
		this.fireSpawnerLeft.position = this.fireSpawnerLeft.position.add(amount);
		this.fireSpawnerRight.position = this.fireSpawnerRight.position.add(amount);
	}
}
