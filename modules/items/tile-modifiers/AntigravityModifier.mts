import { TileModifier } from "../TileModifier.mjs";

export class AntigravityModififer extends TileModifier {
	gravity = "reverse" as const;

	displayIcon() {
		// TODO
	}
}
