import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData } from "../constants/GameData.mjs";
import { Explosion } from "../game-utilities/Explosion.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
export class Fireball extends RectangularCollideable {
    velocity;
    acceleration;
    ignoredEntities;
    constructor(position, velocity, acceleration, ignoredEntities) {
        super(Rectangle.square(position.x, position.y, 1));
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.ignoredEntities = ignoredEntities;
    }
    update(world, canvasIO) {
        this.velocity = this.velocity.add(this.acceleration);
        this.move(this.velocity, world, canvasIO, {
            collides: (obj) => !this.ignoredEntities.includes(obj),
        });
        world.particles.add(new Particle(this.hitbox.center(), new Vector(0, 0), SpiderData.PROJECTILE_PARTICLE_SETTINGS), world, canvasIO);
    }
    display() { }
    render() {
        return [];
    }
    onCollision(collision, world, canvasIO) {
        this.explode(world, canvasIO);
    }
    explode(world, canvasIO) {
        world.entities.delete(this);
        const center = this.hitbox.center();
        new Explosion(center).explode(world, canvasIO);
    }
}
//# sourceMappingURL=Fireball.mjs.map