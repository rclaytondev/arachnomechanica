import { Slope } from "../World";

export class SolidTile {
	readonly shape: "solid" | Slope;
	readonly texture: "tower";

	constructor(shape: "solid" | Slope, texture: "tower") {
		this.shape = shape;
		this.texture = texture;
	}

	copy() {
		return new SolidTile(this.shape, this.texture);
	}
}
