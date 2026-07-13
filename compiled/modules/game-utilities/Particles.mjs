import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { PlayerData, WorldData } from "../constants/GameData.mjs";
export class Particles {
    particlesList = [];
    render(renderer) {
        for (const particle of this.particlesList) {
            for (const renderable of particle.render()) {
                renderer.renderables.push(renderable);
            }
        }
    }
    shouldAdd(particle, world, canvasIO) {
        if (!world.worldScreen) {
            return true;
        }
        const distanceX = MathUtils.dist(particle.position.x, world.worldScreen.camera.position.x);
        const distanceY = MathUtils.dist(particle.position.y, world.worldScreen.camera.position.y);
        return (distanceX < canvasIO.canvas.width / 2 + PlayerData.MAX_X_VELOCITY * particle.lifetime()
            && distanceY < canvasIO.canvas.height / 2 + WorldData.PARTICLE_RENDER_DISTANCE_Y * particle.lifetime());
    }
    add(particle, world, canvasIO) {
        if (this.shouldAdd(particle, world, canvasIO)) {
            this.particlesList.push(particle);
        }
    }
    update() {
        for (const particle of this.particlesList) {
            particle.update();
        }
        this.particlesList = this.particlesList.filter(p => !p.isDead());
    }
}
//# sourceMappingURL=Particles.mjs.map