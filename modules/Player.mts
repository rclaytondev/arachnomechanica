import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { PlayerData, WorldData } from "./constants/GameData.mjs";
import { GameUtils } from "./GameUtils.mjs";
import { PhysicsObject } from "./PhysicsObject.mjs";
import { World } from "./World.js";

export class Player {
	physicsObject: PhysicsObject = new PhysicsObject(
		new Vector(0, 0), 
		new Rectangle(0, 0, PlayerData.HITBOX_WIDTH, PlayerData.HITBOX_HEIGHT)
	);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	timeSinceDeath: number = 0;

	constructor() {
		
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PlayerData.COLOR;
		canvasIO.fillRect(this.physicsObject.hitbox());
		const center = this.physicsObject.hitbox().center();
		GameUtils.glowCircle(center.x, center.y, PlayerData.GLOW_SIZE, PlayerData.GLOW_INTENSITY, canvasIO);
	}

	update(world: World, canvasIO: CanvasIO) {
		if(this.dead) {
			this.timeSinceDeath ++;
			return;
		}
		this.checkInputs(world, canvasIO);
		if(this.onGround(world)) {
			this.hasDoubleJump = true;
		}
		this.physicsObject.velocity = this.physicsObject.velocity.add(new Vector(0, PlayerData.GRAVITY));
		this.physicsObject.velocity.x = MathUtils.constrain(this.physicsObject.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.MAX_X_VELOCITY);
		this.physicsObject.update(world);
	}
	checkInputs(world: World, canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowRight && !canvasIO.keys.ArrowLeft) {
			this.physicsObject.velocity.x += PlayerData.HORIZONTAL_ACCELERATION;
		}
		if(canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) {
			this.physicsObject.velocity.x -= PlayerData.HORIZONTAL_ACCELERATION;
		}
		if(
			(!canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) ||
			(canvasIO.keys.ArrowLeft && this.physicsObject.velocity.x > 0) ||
			(canvasIO.keys.ArrowRight && this.physicsObject.velocity.x < 0)
		) {
			this.physicsObject.velocity.x *= PlayerData.FRICTION_X;
		}
		const onGround = this.onGround(world);
		if(canvasIO.keys.KeyZ && !GameUtils.pastKeys.KeyZ && (onGround || this.hasDoubleJump)) {
			this.physicsObject.velocity.y = -PlayerData.JUMP_VELOCITY;
			this.hasDoubleJump = onGround;
		}
	}
	onGround(world: World) {
		return !this.physicsObject.canMove("down", world);
	}
	damage() {
		this.dead = true;
	}
}
