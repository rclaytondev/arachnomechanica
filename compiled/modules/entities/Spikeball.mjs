import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { SpikeballBlock } from "./SpikeballBlock.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Player } from "../Player.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
class SpikeballState {
}
class MovingState extends SpikeballState {
    update(self, world, canvasIO) {
        self.move(self.velocity, world, canvasIO, {
            collides: (obj) => self.collides(obj),
        });
    }
    render() {
        return [];
    }
}
class AttackState extends SpikeballState {
    timeInState = 0;
    update(self, world) {
        this.timeInState++;
        if (this.timeInState > SpikeballData.TELEGRAPH_DELAY) {
            this.attack(self, world);
            if (this.timeInState > SpikeballData.TELEGRAPH_DELAY + SpikeballData.ATTACK_DURATION) {
                self.state = new MovingState();
            }
        }
    }
    attack(self, world) {
        const center = self.hitbox.center();
        const hurtbox = Rectangle.fromCenter(center.x, center.y, SpikeballData.HURTBOX_SIZE, SpikeballData.HURTBOX_SIZE);
        if (world.player.hitbox.intersects(hurtbox)) {
            world.player.damage(hurtbox, world);
        }
    }
    render(self) {
        return [new Renderable(c => this.display(self, c), "glow")];
    }
    display(self, canvasIO) {
        if (this.timeInState > SpikeballData.TELEGRAPH_DELAY) {
            this.displayLightning(self, canvasIO);
        }
        else {
            this.displayTelegraph(self, canvasIO);
        }
    }
    displayLightning(self, canvasIO) {
        const center = self.hitbox.center();
        canvasIO.ctx.strokeStyle = SpikeballData.ELECTRICITY_COLOR;
        canvasIO.ctx.lineWidth = SpikeballData.ELECTRICITY_WIDTH;
        for (let i = 0; i < SpikeballData.NUM_ELECTRIC_ARCS; i++) {
            const endpoints = GameUtils.randomEvenlySpaced({
                generate: () => GameUtils.randomInCircle(center.x, center.y, SpikeballData.TELEGRAPH_RADIUS),
                metric: Vector.dist,
                amount: SpikeballData.ELECTRICITY_SEGMENTS,
                trials: SpikeballData.ELECTRICITY_EVENNESS,
            });
            for (let i = 0; i < endpoints.length - 1; i++) {
                const [point, next] = [endpoints[i], endpoints[i + 1]];
                canvasIO.strokeLine(point.x, point.y, next.x, next.y);
            }
        }
    }
    displayTelegraph(self, canvasIO) {
        const center = self.hitbox.center();
        const thickness = GameUtils.lerp(this.timeInState, 0, SpikeballData.TELEGRAPH_DELAY, SpikeballData.TELEGRAPH_THICKNESS, 1);
        GameUtils.glowCircleOutline(center.x, center.y, SpikeballData.TELEGRAPH_RADIUS, thickness, 1, canvasIO, 255, 255, 0);
    }
}
export class Spikeball extends RectangularCollideable {
    state = new MovingState();
    velocity;
    age = 0;
    bounces = SpikeballData.BOUNCES;
    overlappingObjects = [];
    lastCollisionFrame = -1;
    constructor(position, velocity) {
        super(Rectangle.fromDimensions(position.x, position.y, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS));
        this.velocity = velocity;
    }
    collides(object) {
        if (object instanceof Spikeball || object instanceof SpikeballBlock) {
            return !this.overlappingObjects.includes(object);
        }
        else if (!(object instanceof Collideable)) {
            return !this.overlappingObjects.some(o => o instanceof Vector && o.equals(object.position));
        }
        return true;
    }
    render() {
        return [
            new Renderable(this.display.bind(this), "entity"),
            new Renderable(this.displayGlowEffect.bind(this), "glow"),
            ...this.state.render(this),
        ];
    }
    display(canvasIO) {
        const center = this.hitbox.center();
        canvasIO.ctx.save();
        canvasIO.ctx.translate(center.x, center.y);
        canvasIO.ctx.rotate(this.velocity.angle());
        canvasIO.ctx.fillStyle = SpikeballData.COLOR;
        canvasIO.fillPoly(-SpikeballData.WING_WIDTH, SpikeballData.WING_WIDTH, -SpikeballData.INNER_LENGTH, 0, -SpikeballData.WING_WIDTH, -SpikeballData.WING_WIDTH, SpikeballData.SPIKE_LENGTH, 0);
        canvasIO.ctx.fillStyle = "yellow";
        canvasIO.ctx.scale(0.25, 0.25);
        canvasIO.fillPoly(-SpikeballData.WING_WIDTH, SpikeballData.WING_WIDTH, -SpikeballData.INNER_LENGTH, 0, -SpikeballData.WING_WIDTH, -SpikeballData.WING_WIDTH, SpikeballData.SPIKE_LENGTH, 0);
        canvasIO.ctx.restore();
    }
    displayGlowEffect(canvasIO) {
        const center = this.hitbox.center();
        canvasIO.ctx.save();
        canvasIO.ctx.globalAlpha = this.age / SpikeballData.GLOW_FADE_TIME;
        GameUtils.glowCircle(center.x, center.y, SpikeballData.GLOW_SIZE, SpikeballData.GLOW_INTENSITY, canvasIO, SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue);
        canvasIO.ctx.restore();
    }
    onCollision(collision) {
        if (this.lastCollisionFrame === GameUtils.frameCount) {
            return;
        }
        this.lastCollisionFrame = GameUtils.frameCount;
        const collidingObject = collision.collidingObject(this);
        if (collision.movingObject === this && !(collidingObject instanceof Player)) {
            this.bounces--;
            if (Directions.isHorizontal(collision.direction)) {
                this.velocity.x *= -1;
            }
            else {
                this.velocity.y *= -1;
            }
        }
        if (collidingObject instanceof Player && this.state instanceof MovingState) {
            this.state = new AttackState();
        }
    }
    update(world, canvasIO) {
        this.state.update(this, world, canvasIO);
        if (this.bounces < 0) {
            world.entities.delete(this);
            this.die(world, canvasIO);
        }
        this.age++;
        if (this.age > (WorldData.TILE_SIZE - 2 * SpikeballData.RADIUS) / SpikeballData.SPEED) {
            this.overlappingObjects = this.overlappingObjects.filter(s => (((s instanceof Spikeball || s instanceof SpikeballBlock) && s.intersects(this))
                || (s instanceof Vector && this.hitbox.intersects(Rectangle.square(s.x, s.y, 1).scale(WorldData.TILE_SIZE)))));
        }
    }
    die(world, canvasIO) {
        GameUtils.shatterParticles((canvasIO) => this.display(canvasIO), world, this.hitbox.center(), SpikeballData.SHATTER_PIECES, SpikeballData.SHATTER_PARTICLE_SPEED, canvasIO, SpikeballData.SHATTER_ANGLE_EVENNESS, SpikeballData.SHATTER_PARTICLE_SETTINGS);
    }
}
//# sourceMappingURL=Spikeball.mjs.map