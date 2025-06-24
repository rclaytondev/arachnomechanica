import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { World } from "../World";

export class Surface {
	start: Vector;
	outwardNormal: Direction | Diagonal;
	constructor(start: Vector, outwardNormal: Direction | Diagonal) {
		this.start = start;
		this.outwardNormal = outwardNormal;
	}

	tangentDirectionCW() {
		return Directions.rotateClockwise[this.outwardNormal];
	}
	tangentVectorCW() {
		return Vector.unit(this.tangentDirectionCW());
	}

	tilePosition() {
		const positions = {
			"right": this.start,
			"up-right": this.start.add(0, -1),
			"up": this.start.add(0, -1),
			"up-left": this.start.add(-1, -1),
			"left": this.start.add(-1, -1),
			"down-left": this.start.add(-1, 0),
			"down": this.start.add(-1, 0),
			"down-right": this.start
		};
		return positions[this.tangentDirectionCW()];
	}
}

export class PointOnSurface {
	surface: Surface;
	distance: number;
	constructor(surface: Surface, distance: number) {
		this.surface = surface;
		this.distance = distance;
	}

	position() {
		return this.surface.start.multiply(WorldData.TILE_SIZE).add(this.surface.tangentVectorCW().multiply(this.distance));
	}
}

export class Spider {
	physicsObject: PhysicsObject;
	movement: "clockwise" | "counterclockwise" = "clockwise";
	basepoint: PointOnSurface | null = null;

	constructor(position: Vector) {
		this.physicsObject = new PhysicsObject(
			position.subtract(SpiderData.SIZE / 2, SpiderData.SIZE / 2).floor(),
			Rectangle.square(0, 0, SpiderData.SIZE)
		);
	}

	display(canvasIO: CanvasIO) {
		const position = this.physicsObject.hitbox().center();
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		canvasIO.fillRegularPoly(position, SpiderData.SIZE / 2, 6);
	}

	update(world: World) {
		this.move(SpiderData.SPEED, world);
	}
	move(amount: number, world: World) {
		this.moveBasepoint(amount, world);
	}
	moveBasepoint(amount: number, world: World) {

	}
	nextSurfaceCW() {

	}
}
