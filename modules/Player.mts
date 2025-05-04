import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { PhysicsObject } from "./PhysicsObject.mjs";
import { World } from "./World.js";

export class Player {
	static COLOR = "rgb(0, 128, 0)"; // temporary

	static GRAVITY = 0.5;
	static HORIZONTAL_ACCELERATION = 0.7;
	static JUMP_VELOCITY = 12;
	static MAX_X_VELOCITY = 8;
	static FRICTION_X = 0.7;

	physicsObject: PhysicsObject = new PhysicsObject(
		new Vector(0, 0), 
		new Rectangle(0, 0, World.TILE_SIZE * 0.9, World.TILE_SIZE * 0.9)
	);
	hasDoubleJump: boolean = false;

	constructor() {
		
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = Player.COLOR;
		canvasIO.fillRect(this.physicsObject.boundingBox());
	}

	update(world: World, canvasIO: CanvasIO) {
		this.checkInputs(world, canvasIO);
		if(this.onGround(world)) {
			this.hasDoubleJump = true;
		}
		this.physicsObject.velocity = this.physicsObject.velocity.add(new Vector(0, Player.GRAVITY));
		this.physicsObject.velocity.x = MathUtils.constrain(this.physicsObject.velocity.x, -Player.MAX_X_VELOCITY, Player.MAX_X_VELOCITY);
		this.physicsObject.update(world);
	}
	checkInputs(world: World, canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowRight && !canvasIO.keys.ArrowLeft) {
			this.physicsObject.velocity.x += Player.HORIZONTAL_ACCELERATION;
		}
		if(canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) {
			this.physicsObject.velocity.x -= Player.HORIZONTAL_ACCELERATION;
		}
		if(
			(!canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) ||
			(canvasIO.keys.ArrowLeft && this.physicsObject.velocity.x > 0) ||
			(canvasIO.keys.ArrowRight && this.physicsObject.velocity.x < 0)
		) {
			this.physicsObject.velocity.x *= Player.FRICTION_X;
		}
		const onGround = this.onGround(world);
		if(canvasIO.keys.KeyZ && !GameUtils.pastKeys.KeyZ && (onGround || this.hasDoubleJump)) {
			this.physicsObject.velocity.y = -Player.JUMP_VELOCITY;
			this.hasDoubleJump = onGround;
		}
	}
	onGround(world: World) {
		return !this.physicsObject.canMove("down", world);
	}
}
