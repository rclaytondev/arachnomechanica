import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { PlayerData } from "./constants/GameData.mjs";
import { Spikeball } from "./entities/Spikeball.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { PhysicsObject } from "./game-utilities/PhysicsObject.mjs";
import { Item } from "./items/Item.mjs";
import { Entity, Tile, World } from "./world/World.js";

export class Player {
	physicsObject: PhysicsObject = new PhysicsObject(
		new Vector(0, -50),
		new Rectangle(0, 0, PlayerData.HITBOX_WIDTH, PlayerData.HITBOX_HEIGHT),
	);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	timeSinceDeath: number = 0;
	facing: "left" | "right" = "left";

	equippedItems: [Item | null, Item | null] = [null, null];

	constructor() {
		this.physicsObject.collides = (object: Entity | { x: number, y: number, tile: Tile }) => !(object instanceof Spikeball);
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
		this.physicsObject.applyGravity(canvasIO.keys.KeyZ && this.physicsObject.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY);
		this.physicsObject.velocity.x = MathUtils.constrain(this.physicsObject.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.MAX_X_VELOCITY);
		this.physicsObject.moveX(this.physicsObject.velocity.x, () => { this.physicsObject.velocity.x = 0; }, world, "slide");
		this.physicsObject.moveY(this.physicsObject.velocity.y, () => { this.physicsObject.velocity.y = 0; }, world);
	}
	checkInputs(world: World, canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowRight && !canvasIO.keys.ArrowLeft) {
			this.physicsObject.velocity.x += PlayerData.HORIZONTAL_ACCELERATION;
			this.facing = "right";
		}
		if(canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) {
			this.physicsObject.velocity.x -= PlayerData.HORIZONTAL_ACCELERATION;
			this.facing = "left";
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

		if(canvasIO.keys.KeyX && !GameUtils.pastKeys.KeyX) {
			this.equippedItems[0]?.use(world, canvasIO);
		}
		if(canvasIO.keys.KeyC && !GameUtils.pastKeys.KeyC) {
			this.equippedItems[1]?.use(world, canvasIO);
		}
	}
	onGround(world: World) {
		return !this.physicsObject.canMove("down", world);
	}
	damage() {
		this.dead = true;
	}
}
