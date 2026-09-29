import { Renderable } from "../../game-engine/world/Renderer.mjs";
import { VisualEffects } from "./VisualEffects.mjs";

export abstract class VisualEffect {
	abstract update(visualEffects: VisualEffects): void;
	abstract render(): Renderable[];
}
