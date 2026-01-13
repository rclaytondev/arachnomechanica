import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { TileWithPosition } from "../../world/World.mjs";
import { Collideable } from "./Collideable.mjs";

export class CollisionEvent {
	movingObject: Collideable;
	stationaryObject: Collideable | TileWithPosition;
	direction: Direction;
	moveSuccessful: boolean;

	constructor(movingObject: Collideable, stationaryObject: Collideable | TileWithPosition, direction: Direction, moveSuccessful: boolean) {
		this.movingObject = movingObject;
		this.stationaryObject = stationaryObject;
		this.direction = direction;
		this.moveSuccessful = moveSuccessful;
	}

	collidingObject(obj: Collideable | TileWithPosition) {
		if(this.movingObject === obj) {
			return this.stationaryObject;
		}
		if(this.stationaryObject === obj) {
			return this.movingObject;
		}
		throw new Error("Cannot get colliding object: the provided object was not involved in the collison.");
	}
	directionOf(obj: Collideable | TileWithPosition) {
		if(this.movingObject === obj) {
			return this.direction;
		}
		if(this.stationaryObject === obj) {
			return Directions.opposite[this.direction];
		}
		throw new Error("Cannot get direction of colliding object: the provided object was not involved in the collison.");
	}
}
