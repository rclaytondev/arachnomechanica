import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { PlayerData, WorldData } from "../constants/GameData.mjs";
import { Renderer } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";
import { Particle } from "./Particle.mjs";

export class Particles {
	private particlesList: Particle[] = [];

	render(renderer: Renderer) {
		for(const particle of this.particlesList) {
			for(const renderable of particle.render()){
				renderer.renderables.push(renderable);
			}
		}
	}

	shouldAdd(particle: Particle, world: World, canvasIO: CanvasIO) {
		if(!world.worldScreen) { return true; }
		const distanceX = MathUtils.dist(particle.position.x, world.worldScreen.camera.position.x);
		const distanceY = MathUtils.dist(particle.position.y, world.worldScreen.camera.position.y);
		return (
			distanceX < canvasIO.canvas.width / 2 + PlayerData.MAX_X_VELOCITY * particle.lifetime()
			&& distanceY < canvasIO.canvas.height / 2 + WorldData.PARTICLE_RENDER_DISTANCE_Y * particle.lifetime()
		);
	}
	add(particle: Particle, world: World, canvasIO: CanvasIO) {
		if(this.shouldAdd(particle, world, canvasIO)) {
			this.particlesList.push(particle);
		}
	}

	update() {
		for(const particle of this.particlesList) {
			particle.update();
		}
		this.particlesList = this.particlesList.filter(p => !p.isDead());
	}
}
