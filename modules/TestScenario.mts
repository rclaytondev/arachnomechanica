import { World } from "./world/World.mjs";

export class TestScenario<T extends unknown[] = []> {
	setupWorld: () => [World, ...T];
	constructor(setupWorld: () => [World, ...T]) {
		this.setupWorld = setupWorld;
	}
}
