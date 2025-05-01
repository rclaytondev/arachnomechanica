import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";

export class Lizard {
	direction: Direction;
	position: Vector;
	joints: { position: Vector, direction: Direction }[] = [];
	length: number;
	color: string = "rgb(0, 0, 0)";
	speed: number;

	constructor(position: Vector, direction: Direction, length: number, speed: number) {
		this.position = position;
		this.direction = direction;
		this.length = length;
		this.speed = speed;
	}

	display(canvasIO: CanvasIO) {
		this.displayBody(canvasIO);
	}
	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = this.color;
		const segment1End = (
			this.joints[0]?.position ?? 
			this.position.subtract(Vector.unit(this.direction).multiply(this.length))
		);
		canvasIO.strokeLine(this.position.x, this.position.y, segment1End.x, segment1End.y);
		let length = (this.joints.length === 0) ? 0 : this.position.subtract(this.joints[0].position).magnitude();
		for(const [i, joint] of this.joints.entries()) {
			const next = this.joints[i + 1];
			if(next) {
				length += joint.position.subtract(next.position).magnitude();
				canvasIO.strokeLine(joint.position.x, joint.position.y, next.position.x, next.position.y);
			}
			else {
				const lengthRemaining = this.length - length;
				const bodyEnd = joint.position.subtract(Vector.unit(this.direction).multiply(lengthRemaining));
				canvasIO.strokeLine(joint.position.x, joint.position.y, bodyEnd.x, bodyEnd.y);
			}
		}
	}

	update() {
		this.position = this.position.add(Vector.unit(this.direction).multiply(this.speed));
	}
}
