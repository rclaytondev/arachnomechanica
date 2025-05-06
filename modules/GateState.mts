import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";

export class GateState {
	position: Vector | null;
	exit: Direction;
	toggled: boolean;

	constructor(position: Vector | null, exit: Direction, toggled: boolean) {
		this.position = position;
		this.exit = exit;
		this.toggled = toggled;
	}

	normalize() {
		if(this.position !== null && (this.exit === "left" || this.exit === "up")) {
			this.position = this.position.add(Vector.unit(this.exit));
			this.exit = Directions.opposite(this.exit);
		}
	}
	equals(state: GateState) {
		this.normalize();
		state.normalize();
		return (
			`${this.position}` === `${state.position}`
			&& this.exit === state.exit
			&& this.toggled === state.toggled
		);
	}
}
