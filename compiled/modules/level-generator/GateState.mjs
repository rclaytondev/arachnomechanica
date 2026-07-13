import { SetUtils } from "../../utils-ts/modules/core-extensions/SetUtils.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
export class GateState {
    position;
    exit;
    toggled;
    constructor(position, exit, toggled) {
        this.position = position;
        this.exit = exit;
        this.toggled = toggled;
    }
    normalize() {
        if (this.position !== null && (this.exit === "left" || this.exit === "up")) {
            return new GateState(this.position.add(Vector.unit(this.exit)), Directions.opposite[this.exit], this.toggled);
        }
        return this;
    }
    equals(state) {
        const state1 = this.normalize();
        const state2 = state.normalize();
        return (`${state1.position}` === `${state2.position}`
            && state1.exit === state2.exit
            && state1.toggled === state2.toggled);
    }
    copy() {
        return new GateState(this.position?.clone() ?? null, this.exit, this.toggled);
    }
    translate(amount) {
        return new GateState((this.position ?? new Vector(0, 0)).add(amount), this.exit, this.toggled);
    }
    toString(includePosition = false) {
        if (includePosition) {
            return `${this.position}, ${this.exit}, ${this.toggled}`;
        }
        return `${this.exit}, ${this.toggled}`;
    }
    static traversabilityEquals(traversability1, traversability2) {
        return SetUtils.equals(traversability1.map(({ start, end }) => `(${start.toString()}), (${end.toString()})`), traversability2.map(({ start, end }) => `(${start.toString()}), (${end.toString()})`));
    }
    static deduplicateTraversability(traversability) {
        const distinctConnections = new Set();
        const result = [];
        for (const connection of traversability) {
            const stringified = `(${connection.start}, ${connection.end})`;
            if (!distinctConnections.has(stringified)) {
                result.push(connection);
                distinctConnections.add(stringified);
            }
        }
        return result;
    }
    isAdjacentTo(position) {
        if (this.position === null) {
            return false;
        }
        return position.equals(this.position) || position.equals(this.position.add(Vector.unit(this.exit)));
    }
}
//# sourceMappingURL=GateState.mjs.map