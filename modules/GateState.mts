import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../utils-ts/modules/Utils.mjs";
import { Traversability } from "./Room.mjs";

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
			return new GateState(
				this.position.add(Vector.unit(this.exit)),
				Directions.opposite(this.exit),
				this.toggled
			);
		}
		return this;
	}
	equals(state: GateState) {
		const state1 = this.normalize();
		const state2 = state.normalize();
		return (
			`${state1.position}` === `${state2.position}`
			&& state1.exit === state2.exit
			&& state1.toggled === state2.toggled
		);
	}
	translate(amount: Vector) {
		return new GateState(
			(this.position ?? new Vector(0, 0)).add(amount),
			this.exit,
			this.toggled
		);
	}
	toString() {
		return `${this.position}, ${this.exit}, ${this.toggled}`;
	}
	static traversabilityEquals(traversability1: Traversability, traversability2: Traversability) {
		return Utils.setEquals(
			traversability1.map(({ start, end }) => `(${start.toString()}), (${end.toString()})`),
			traversability2.map(({ start, end }) => `(${start.toString()}), (${end.toString()})`)
		);
	}
}
