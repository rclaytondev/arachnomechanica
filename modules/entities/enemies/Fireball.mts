import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { FireballData, SpiderData } from "../../constants/GameData.mjs";
import { Explosion } from "../entity-components/Explosion.mjs";
import { GraphicsUtils } from "../../game-utilities/GraphicsUtils.mjs";
import { Particle } from "../particles/Particle.mjs";
import { Collideable } from "../../game-engine/collisions/Collideable.mjs";
import { RectangularCollideable } from "../../game-engine/collisions/RectangularCollideable.mjs";
import { RandomUtils } from "../../game-utilities/RandomUtils.mjs";
import { Renderable } from "../../game-engine/world/Renderer.mjs";
import { World } from "../../game-engine/world/World.mjs";

export class Fireball extends RectangularCollideable {
	velocity: Vector;
	acceleration: Vector;
	ignoredEntities: Collideable[];
	slideUpSlopes: boolean = false;
	slideDownSlopes: boolean = false;

	constructor(position: Vector, velocity: Vector, acceleration: Vector, ignoredEntities: Collideable[], world: World) {
		super(Rectangle.square(position.x, position.y, 1), world);
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.ignoredEntities = ignoredEntities;
		this.world = world;
	}

	update() {
		this.velocity = this.velocity.add(this.acceleration);
		this.move(this.velocity, {
			collides: (obj) => !(this.ignoredEntities as unknown[]).includes(obj),
		});

		this.addParticle();
	}
	addParticle() {
		const center = this.hitbox.center();
		this.world.particles.add(new Particle(
			RandomUtils.randomInCircle(center.x, center.y, FireballData.PARTICLE_AREA),
			new Vector(0, 0),
			SpiderData.PROJECTILE_PARTICLE_SETTINGS,
		), this.world);

	}

	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		GraphicsUtils.glowCircle(
			center.x, center.y,
			FireballData.GLOW_SIZE, FireballData.GLOW_INTENSITY,
			canvasIO,
			FireballData.GLOW_COLOR,
		);
	}
	display() { }
	render() {
		return [
			new Renderable(c => this.displayGlowEffect(c), "glow"),
		];
	}


	onCollision(): void {
		this.explode();
	}
	explode() {
		this.world.entities.delete(this);

		const center = this.hitbox.center();
		new Explosion(center).explode(this.world);
	}
}
