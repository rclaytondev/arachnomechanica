import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { PlayerData, WorldData } from "./constants/GameData.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { PhysicsObject } from "./game-utilities/PhysicsObject.mjs";
import { World } from "./World.js";

export class Player {
	physicsObject: PhysicsObject = new PhysicsObject(
		new Vector(0, 0), 
		new Rectangle(0, 0, PlayerData.HITBOX_WIDTH, PlayerData.HITBOX_HEIGHT)
	);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	timeSinceDeath: number = 0;
	energy: number = PlayerData.MAX_ENERGY;

	constructor() {
		
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PlayerData.COLOR;
		canvasIO.fillRect(this.physicsObject.hitbox());
		const center = this.physicsObject.hitbox().center();
		GameUtils.glowCircle(center.x, center.y, PlayerData.GLOW_SIZE, PlayerData.GLOW_INTENSITY, canvasIO);
	}
	displayEnergyBar(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PlayerData.ENERGY_BAR_COLOR;
		canvasIO.fillRect(PlayerData.ENERGY_BAR);
		canvasIO.ctx.fillStyle = PlayerData.ENERGY_COLOR;
		canvasIO.ctx.fillRect(
			PlayerData.ENERGY_BAR.x, PlayerData.ENERGY_BAR.y,
			this.energy / PlayerData.MAX_ENERGY * PlayerData.ENERGY_BAR.width,
			PlayerData.ENERGY_BAR.height
		);
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
		this.physicsObject.velocity = this.physicsObject.velocity.add(
			new Vector(0, canvasIO.keys.KeyZ && this.physicsObject.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY)
		);
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

		if(canvasIO.keys.KeyC && !GameUtils.pastKeys.KeyC && this.energy >= PlayerData.TELEPORT_COST) {
			const directionX = canvasIO.keys.ArrowLeft ? -1 : (canvasIO.keys.ArrowRight ? 1 : 0);
			const directionY = canvasIO.keys.ArrowUp ? -1 : (canvasIO.keys.ArrowDown ? 1 : 0);
			if(directionX !== 0 || directionY !== 0) {
				this.teleport(new Vector(directionX, directionY), world, canvasIO);
				this.energy -= PlayerData.TELEPORT_COST;
			}
		}
	}
	onGround(world: World) {
		return !this.physicsObject.canMove("down", world);
	}
	damage() {
		this.dead = true;
	}

	teleport(direction: Vector, world: World, canvasIO: CanvasIO) {
		let box = this.physicsObject.hitbox();
		while(!world.isInSolid(box)) {
			box = box.translate(direction);
		}
		box = box.translate(direction.multiply(-1));
		this.physicsObject.positionInt = box.center().subtract(box.width / 2, box.height / 2);
	}
}
