import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Gate } from "../entities/Gate.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { Particle } from "./Particle.mjs";
import { ShakeEffect } from "./visual-effects/ShakeEffect.mjs";
export class Explosion {
    position;
    visualRadius;
    damageRadius;
    destructionRadius;
    particleDensity;
    particleVelociy;
    screenShakeIntensity;
    screenShakeTime;
    particleSettings;
    constructor(position, options = {}) {
        this.position = position;
        this.visualRadius = options.visualRadius ?? 150;
        this.damageRadius = options.damageRadius ?? this.visualRadius * Math.SQRT1_2;
        this.destructionRadius = options.destructionRadius ?? 60;
        this.particleDensity = options.particleDensity ?? 20;
        this.particleVelociy = options.particleVelociy ?? 5;
        this.screenShakeIntensity = options.screenShakeIntensity ?? 30;
        this.screenShakeTime = options.screenShakeTime ?? 7;
        this.particleSettings = options.particleSettings ?? {
            color: { red: 255, green: 128, blue: 0 },
            size: { min: 10, max: 15 },
            shape: 3,
            sizeDecay: 0.3,
            opacityDecay: { min: 0.015, max: 0.085 },
            colorVariance: 40,
        };
    }
    explode(world, canvasIO) {
        this.applyScreenShake(world);
        this.destroyTiles(world);
        this.addParticles(world, canvasIO);
        this.damage(world, canvasIO);
    }
    applyScreenShake(world) {
        world.worldScreen?.visualEffects.effectsList.add(new ShakeEffect(this.screenShakeTime, this.screenShakeIntensity));
    }
    destroyTiles(world) {
        const tileExplosion = Rectangle.fromCenter(this.position.x, this.position.y, this.destructionRadius * 2, this.destructionRadius * 2);
        for (const { position } of world.tiles.getTilesAt(tileExplosion)) {
            Gate.destroyNonGateTile(position, world);
        }
    }
    addParticles(world, canvasIO) {
        const area = Math.PI * this.visualRadius ** 2;
        const numParticles = Math.floor(area / (WorldData.TILE_SIZE ** 2) * this.particleDensity);
        for (let i = 0; i < numParticles; i++) {
            const position = GameUtils.randomInCircle(this.position.x, this.position.y, this.visualRadius);
            const particle = new Particle(position, new Vector(0, 0), this.particleSettings);
            world.particles.add(particle, world, canvasIO);
        }
    }
    damage(world, canvasIO) {
        world.damage(Rectangle.fromCenter(this.position.x, this.position.y, 2 * this.damageRadius, 2 * this.damageRadius), canvasIO);
    }
}
//# sourceMappingURL=Explosion.mjs.map