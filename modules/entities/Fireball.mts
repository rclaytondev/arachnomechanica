import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData } from "../constants/GameData.mjs";
import { Explosion } from "../game-utilities/Explosion.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { World } from "../world/World.mjs";

export class Fireball extends RectangularCollideable {
	velocity: Vector;
	acceleration: Vector;
	ignoredEntities: Collideable[];
	slideUpSlopes: boolean = false;
	slideDownSlopes: boolean = false;

	constructor(position: Vector, velocity: Vector, acceleration: Vector, ignoredEntities: Collideable[]) {
		super(Rectangle.square(position.x, position.y, 1));
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.ignoredEntities = ignoredEntities;
	}

	update(world: World, canvasIO: CanvasIO) {
		this.velocity = this.velocity.add(this.acceleration);
		this.move(this.velocity, world, canvasIO, {
			collides: (obj) => !(this.ignoredEntities as unknown[]).includes(obj),
		});

		world.particles.add(new Particle(
			this.hitbox.center(),
			new Vector(0, 0),
			SpiderData.PROJECTILE_PARTICLE_SETTINGS,
		), world, canvasIO);
	}

	display() { }
	render() {
		return [];
	}


	onCollision(collision: CollisionEvent, world: World, canvasIO: CanvasIO): void {
		this.explode(world, canvasIO);
	}
	explode(world: World, canvasIO: CanvasIO) {
		world.entities.delete(this);

		const center = this.hitbox.center();
		new Explosion(center).explode(world, canvasIO);
	}
}
