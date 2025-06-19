import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Utils } from "../../utils-ts/modules/Utils.mjs";
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
				Directions.opposite[this.exit],
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
	copy() {
		return new GateState(this.position?.clone() ?? null, this.exit, this.toggled);
	}
	translate(amount: Vector) {
		return new GateState(
			(this.position ?? new Vector(0, 0)).add(amount),
			this.exit,
			this.toggled
		);
	}
	toString() {
		return `${this.exit}, ${this.toggled}`;
	}
	static traversabilityEquals(traversability1: Traversability, traversability2: Traversability) {
		return Utils.setEquals(
			traversability1.map(({ start, end }) => `(${start.toString()}), (${end.toString()})`),
			traversability2.map(({ start, end }) => `(${start.toString()}), (${end.toString()})`)
		);
	}
	static deduplicateTraversability(traversability: Traversability) {
		const distinctConnections = new Set<string>();
		const result = [];
		for(const connection of traversability) {
			const stringified = `(${connection.start}, ${connection.end})`;
			if(!distinctConnections.has(stringified)) {
				result.push(connection);
				distinctConnections.add(stringified);
			}
		}
		return result;
	}
	isAdjacentTo(position: Vector) {
		if(this.position === null) { return false; }
		return position.equals(this.position) || position.equals(this.position.add(Vector.unit(this.exit)));
	}
}
