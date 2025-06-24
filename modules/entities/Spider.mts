import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { SpiderData, WorldData } from "../constants/GameData.mjs";
import { PhysicsObject } from "../game-utilities/PhysicsObject.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
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

	end() {
		return this.start.add(Vector.gridUnit(this.tangentDirectionCW()));
	}
	length() {
		return WorldData.TILE_SIZE * (Directions.isDirection(this.outwardNormal) ? 1 : Math.SQRT2);
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

		if(DEBUG_SETTINGS.SPIDER_VISUALIZATION) {
			this.displayDebug(canvasIO);
		}
	}
	displayDebug(canvasIO: CanvasIO) {
		if(this.basepoint) {
			canvasIO.ctx.fillStyle = "red";
			canvasIO.ctx.strokeStyle = "red";
			canvasIO.ctx.lineWidth = 5;
			const basepoint = this.basepoint.position();
			canvasIO.fillCircle(basepoint.x, basepoint.y, 7);
			const start = this.basepoint.surface.start.multiply(WorldData.TILE_SIZE);
			const end = this.basepoint.surface.end().multiply(WorldData.TILE_SIZE);
			canvasIO.strokeLine(start.x, start.y, end.x, end.y);
		}
	}

	update(world: World) {
		this.move(SpiderData.SPEED, world);
	}
	move(amount: number, world: World) {
		this.moveBasepoint(amount, world);
	}
	moveBasepoint(amount: number, world: World) {
		this.basepoint!.distance += amount * (this.movement === "clockwise" ? 1 : -1);
		while(this.basepoint!.distance > this.basepoint!.surface.length()) {
			this.basepoint = new PointOnSurface(
				this.nextSurfaceCW(world),
				this.basepoint!.distance - this.basepoint!.surface.length()
			)
		}
		while(this.basepoint!.distance < 0) {
			const nextSurface = this.nextSurfaceCCW(world);
			this.basepoint = new PointOnSurface(
				nextSurface,
				nextSurface.length() + this.basepoint!.distance
			);
		}
	}
	nextSurfaceCW(world: World) {
		const tangent = this.basepoint!.surface.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateClockwise45[tangent];
		const angle = TowerTile.angle(
			this.basepoint!.surface.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
				tileTangent,
			world
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateClockwise45[newTangent];
		}
		return new Surface(
			this.basepoint!.surface.end(),
			Directions.rotateCounterclockwise[newTangent]
		);
	}
	nextSurfaceCCW(world: World) {
		const tangent = this.basepoint!.surface.tangentDirectionCW();
		const tileTangent = Directions.isDirection(tangent) ? tangent : Directions.rotateCounterclockwise45[tangent];
		const angle = TowerTile.angle(
			this.basepoint!.surface.tilePosition(),
			Directions.rotateCounterclockwise[tileTangent],
			Directions.opposite[tileTangent],
			world
		) + (Directions.isDiagonal(tangent) ? 45 : 0);
		let newTangent = Directions.opposite[tangent];
		for(let i = 0; i < angle; i += 45) {
			newTangent = Directions.rotateCounterclockwise45[newTangent];
		}
		return new Surface(
			this.basepoint!.surface.start.subtract(Vector.gridUnit(newTangent)),
			Directions.rotateCounterclockwise[newTangent]
		);
	}
}
