import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { ItemData, PlayerData, WorldData } from "./constants/GameData.mjs";
import { Spikeball } from "./entities/Spikeball.mjs";
import { RectangularCollideable } from "./game-utilities/Collideable.mjs";
import { Entity } from "./game-utilities/Entity.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { Item } from "./items/Item.mjs";
import { Main } from "./Main.js";
import { RoomEditor } from "./RoomEditor.mjs";
import { ItemEntity, TileWithPosition, World } from "./world/World.js";

export class Player extends RectangularCollideable {
	velocity: Vector = new Vector(0, 0);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	facing: "left" | "right" = "left";
	coyoteTime: number = 0;
	health: number = PlayerData.INITIAL_HEALTH;
	invulnerabilityTime: number = 0;

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
		if(Main.screen instanceof RoomEditor) { return; }
		this.checkInputs(world, canvasIO);
		this.coyoteTime --;
		this.invulnerabilityTime --;
		if(this.onGround(world)) {
			this.hasDoubleJump = true;
			if(this.isCrouched()) {
				this.velocity.x *= PlayerData.CROUCHED_FRICTION;
			}
		}
		this.velocity.y += canvasIO.keys.KeyZ && this.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY;
		this.velocity.x = MathUtils.constrain(this.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.MAX_X_VELOCITY);
		this.move(new Vector(this.velocity.x, 0), world, {
			onCollision: (direction, collisions) => {
				this.velocity.x = 0;
				this.checkDamagingCollisions(collisions, world);
			},
			slideUpSlopes: true,
			slideDownSlopes: true,
		});
		this.move(new Vector(0, this.velocity.y), world, {
			onCollision: (direction, collisions) => {
				this.velocity.y = 0;
				this.checkDamagingCollisions(collisions, world);
			},
		});
		world.entities.moveEntity(this);
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
		if(onGround) {
			this.coyoteTime = PlayerData.COYOTE_FRAMES;
		}
		if(canvasIO.keys.KeyZ && !GameUtils.pastKeys.KeyZ && (this.coyoteTime > 0 || this.hasDoubleJump)) {
			this.velocity.y = -PlayerData.JUMP_VELOCITY;
			this.hasDoubleJump = (this.coyoteTime > 0);
			this.coyoteTime = -1;
		}

		if(canvasIO.keys.KeyX && !GameUtils.pastKeys.KeyX) {
			this.equippedItems[0]?.use(world, canvasIO);
		}
		if(canvasIO.keys.KeyC && !GameUtils.pastKeys.KeyC) {
			this.equippedItems[1]?.use(world, canvasIO);
		}
		if(canvasIO.keys.ArrowDown && this.onGround(world)) {
			this.crouch();
		}
		if(
			(!canvasIO.keys.ArrowDown && this.onGround(world)) ||
			(this.velocity.y > 0)
		) { this.uncrouch(world); }
	}
	checkDamagingCollisions(collisions: (Entity | TileWithPosition)[], world: World) {
		for(const obj of collisions.filter(c => c instanceof Spikeball)) {
			this.damage(obj.hitbox, world);
		}
	}
	onGround(world: World) {
		return !this.canMove("down", world);
	}
	damage(hurtbox: Rectangle, world: World) {
		if(this.invulnerabilityTime < 0) {
			this.health --;
			this.invulnerabilityTime = PlayerData.INVULNERABIlITY_TIME;
			if(this.health <= 0 && !this.dead) {
				Main.beginDeathTransition();
				this.dead = true;
				world.entities.removeEntity(this);
			}
		}
	}

	crouch() {
		this.hitbox = this.hitbox.extend("up", PlayerData.CROUCHED_HITBOX_HEIGHT - this.hitbox.height);
	}
	uncrouch(world: World) {
		const newHitbox = this.hitbox.extend("up", PlayerData.HITBOX_HEIGHT - this.hitbox.height);
		if(!world.isInSolid(newHitbox, o => o !== this)) {
			this.hitbox = newHitbox;
		}
	}
	isCrouched() {
		return this.hitbox.height === PlayerData.CROUCHED_HITBOX_HEIGHT;
	}

	itemThrowVelocity(canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowDown) {
			return ItemData.DOWN_THROW_VELOCITY.clone();
		}
		return (this.facing === "left") ? ItemData.THROW_VELOCITY.reflectX() : ItemData.THROW_VELOCITY.clone();
	}
	throw(item: ItemEntity, world: World, canvasIO: CanvasIO) {
		const direction = (canvasIO.keys.ArrowDown ? "down" : this.facing);
		const size = (direction === "down" ? item.hitbox.height : item.hitbox.width);
		const throwStartCenter = this.hitbox.edgeCenter(direction).add(Vector.unit(direction).multiply(ItemData.THROW_OFFSET + size / 2));
		const throwStart = new Vector(throwStartCenter.x - item.hitbox.width / 2, throwStartCenter.y - item.hitbox.height / 2);
		if(!world.isInSolid(item.hitbox.translate(throwStart))) {
			item.translate(throwStart);
			item.velocity = this.itemThrowVelocity(canvasIO);
			world.entities.addEntity(item);
		}
	}
}
