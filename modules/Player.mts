import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { ItemData, PlayerData, WorldData } from "./constants/GameData.mjs";
import { Spikeball } from "./entities/Spikeball.mjs";
import { RectangularEntity } from "./game-utilities/Entity.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Item } from "./items/Item.mjs";
import { ItemEntity, World } from "./world/World.js";

export class Player extends RectangularEntity {
	velocity: Vector = new Vector(0, 0);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	timeSinceDeath: number = 0;
	facing: "left" | "right" = "left";

	equippedItems: [Item | null, Item | null] = [null, null];

	constructor() {
		super(new Rectangle(0, -WorldData.TILE_SIZE, PlayerData.HITBOX_WIDTH, PlayerData.HITBOX_HEIGHT));
	}

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PlayerData.COLOR;
		canvasIO.fillRect(this.hitbox);
		const center = this.hitbox.center();
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
		this.velocity.y += canvasIO.keys.KeyZ && this.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY;
		this.velocity.x = MathUtils.constrain(this.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.MAX_X_VELOCITY);
		this.move(new Vector(this.velocity.x, 0), world, {
			onCollision: () => { this.velocity.x = 0; },
			collides: (obj) => !(obj instanceof Spikeball),
			slideUpSlopes: true,
			slideDownSlopes: true,
		});
		this.move(new Vector(0, this.velocity.y), world, {
			onCollision: () => { this.velocity.y = 0; },
			collides: (obj) => !(obj instanceof Spikeball),
		});
	}
	checkInputs(world: World, canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowRight && !canvasIO.keys.ArrowLeft) {
			this.velocity.x += PlayerData.HORIZONTAL_ACCELERATION;
			this.facing = "right";
		}
		if(canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) {
			this.velocity.x -= PlayerData.HORIZONTAL_ACCELERATION;
			this.facing = "left";
		}
		if(
			(!canvasIO.keys.ArrowLeft && !canvasIO.keys.ArrowRight) ||
			(canvasIO.keys.ArrowLeft && this.velocity.x > 0) ||
			(canvasIO.keys.ArrowRight && this.velocity.x < 0)
		) {
			this.velocity.x *= PlayerData.FRICTION_X;
		}
		const onGround = this.onGround(world);
		if(canvasIO.keys.KeyZ && !GameUtils.pastKeys.KeyZ && (onGround || this.hasDoubleJump)) {
			this.velocity.y = -PlayerData.JUMP_VELOCITY;
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
		return !this.canMove("down", world);
	}
	damage() {
		this.dead = true;
	}

	itemThrowVelocity(canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowDown) {
			return ItemData.DOWN_THROW_VELOCITY.clone();
		}
		return (this.facing === "left") ? ItemData.THROW_VELOCITY.reflectX() : ItemData.THROW_VELOCITY.clone();
	}
	throw(item: ItemEntity, world: World, canvasIO: CanvasIO) {
		const direction = (canvasIO.keys.ArrowDown ? "down" : this.facing);
		const size = (direction === "down" ? item.physicsObject.dimensions.height : item.physicsObject.dimensions.width);
		item.physicsObject.setCenter(
			this.hitbox.edgeCenter(direction).add(Vector.unit(direction).multiply(ItemData.THROW_OFFSET + size / 2)),
		);
		item.physicsObject.velocity = this.itemThrowVelocity(canvasIO);
		world.entities.addEntity(item);
	}
}
