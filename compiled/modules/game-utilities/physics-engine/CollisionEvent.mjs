import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
export class CollisionEvent {
    movingObject;
    stationaryObject;
    direction;
    moveSuccessful;
    constructor(movingObject, stationaryObject, direction, moveSuccessful) {
        this.movingObject = movingObject;
        this.stationaryObject = stationaryObject;
        this.direction = direction;
        this.moveSuccessful = moveSuccessful;
    }
    collidingObject(obj) {
        if (this.movingObject === obj) {
            return this.stationaryObject;
        }
        if (this.stationaryObject === obj) {
            return this.movingObject;
        }
        throw new Error("Cannot get colliding object: the provided object was not involved in the collison.");
    }
    directionOf(obj) {
        if (this.movingObject === obj) {
            return this.direction;
        }
        if (this.stationaryObject === obj) {
            return Directions.opposite[this.direction];
        }
        throw new Error("Cannot get direction of colliding object: the provided object was not involved in the collison.");
    }
}
//# sourceMappingURL=CollisionEvent.mjs.map