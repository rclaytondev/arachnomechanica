import { TileModifier } from "../TileModifier.mjs";

export class NoGravityModifier extends TileModifier {
	gravity = "none" as const;
	frictionY = 0.96 as const;

	displayIcon() {
		// TODO
	}
}
