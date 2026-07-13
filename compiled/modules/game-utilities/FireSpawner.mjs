import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { Particle } from "./Particle.mjs";
export class FireSpawner {
    position;
    direction;
    timeLeft = 0;
    hurtboxSize = 0;
    maxHurtboxSize;
    hurtboxWidth;
    hurtboxOffset;
    particlesPerFrame;
    hurtboxSpeed;
    particleSpeed;
    particleSpeedVariance;
    particleCrossSpeedVariance;
    particleSettings;
    constructor(position, direction, settings) {
        this.position = position;
        this.direction = direction;
        this.maxHurtboxSize = settings.maxHurtboxSize;
        this.hurtboxWidth = settings.hurtboxWidth;
        this.hurtboxOffset = settings.hurtboxOffset;
        this.particlesPerFrame = settings.particlesPerFrame;
        this.hurtboxSize = settings.hurtboxSpeed;
        this.hurtboxSpeed = settings.hurtboxSpeed;
        this.particleSpeed = settings.particleSpeed;
        this.particleSpeedVariance = settings.particleSpeedVariance;
        this.particleCrossSpeedVariance = settings.particleCrossSpeedVariance;
        this.particleSettings = settings.particleSettings;
    }
    update(world, canvasIO) {
        this.timeLeft--;
        if (this.timeLeft > 0) {
            for (let i = 0; i < this.particlesPerFrame; i++) {
                world.particles.add(this.generateFireParticle(), world, canvasIO);
            }
            this.hurtboxSize = Math.min(this.hurtboxSize + this.hurtboxSpeed, this.maxHurtboxSize);
        }
        else {
            this.hurtboxSize = 0;
        }
    }
    startFire(duration) {
        if (this.timeLeft < 0) {
            this.hurtboxSize = 0;
        }
        this.timeLeft = duration;
    }
    stopFire() {
        this.timeLeft = 0;
        this.hurtboxSize = 0;
    }
    generateFireParticleVelocity() {
        const speed = this.particleSpeed + GameUtils.random(-this.particleSpeedVariance, this.particleSpeedVariance);
        const crossSpeed = GameUtils.random(-this.particleCrossSpeedVariance, this.particleCrossSpeedVariance);
        if (Directions.isHorizontal(this.direction)) {
            return new Vector(speed * (this.direction === "left" ? -1 : 1), crossSpeed);
        }
        else {
            return new Vector(crossSpeed, speed * (this.direction === "up" ? -1 : 1));
        }
    }
    generateFireParticle() {
        return new Particle(this.position, this.generateFireParticleVelocity(), this.particleSettings);
    }
    hurtbox(size = this.hurtboxSize) {
        const length = Math.max(0, size - this.hurtboxOffset);
        if (this.direction === "left") {
            return Rectangle.fromDimensions(this.position.x - this.hurtboxOffset - length, this.position.y - this.hurtboxWidth / 2, length, this.hurtboxWidth);
        }
        else if (this.direction === "right") {
            return Rectangle.fromDimensions(this.position.x + this.hurtboxOffset, this.position.y - this.hurtboxWidth / 2, length, this.hurtboxWidth);
        }
        else if (this.direction === "up") {
            return Rectangle.fromDimensions(this.position.x - this.hurtboxWidth / 2, this.position.y - this.hurtboxOffset - length, this.hurtboxWidth, length);
        }
        else {
            return Rectangle.fromDimensions(this.position.x - this.hurtboxWidth / 2, this.position.y + this.hurtboxOffset, this.hurtboxWidth, Math.max(0, size - this.hurtboxOffset));
        }
    }
    shouldDestroy(tile) {
        return !((tile === Platform.PLATFORM && this.direction !== "down"));
    }
    updateHurtbox(world, canvasIO) {
        if (this.hurtboxSize === 0) {
            return;
        }
        const hurtbox = this.hurtbox();
        for (const { position, tile } of world.tiles.getTilesAt(hurtbox)) {
            if (this.shouldDestroy(tile)) {
                world.destroyTile(position);
            }
        }
        world.damage(hurtbox, canvasIO);
    }
    displayHurtbox(canvasIO) {
        canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.LIZARDS.HURTBOX_COLOR;
        canvasIO.strokeRect(this.hurtbox());
    }
}
//# sourceMappingURL=FireSpawner.mjs.map