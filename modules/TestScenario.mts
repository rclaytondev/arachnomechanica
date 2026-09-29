import { World } from "./game-engine/world/World.mjs";

export class TestScenario<T extends unknown[] = []> {
	static all: TestScenario<unknown[]>[] = [];

	name: string;
	setupWorld: () => [World, ...T];
	constructor(name: string, setupWorld: () => [World, ...T]) {
		this.name = name;
		this.setupWorld = setupWorld;
		TestScenario.all.push(this);
	}
}
