import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { ArrayUtils } from "../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { ItemData, PlayerData, WorldData } from "./constants/GameData.mjs";
import { Spikeball } from "./entities/Spikeball.mjs";
import { RectangularCollideable } from "./game-utilities/Collideable.mjs";
import { Entity } from "./game-utilities/Entity.mjs";
import { GameUtils } from "./game-utilities/GameUtils.mjs";
import { ScreenFade } from "./game-utilities/ScreenFade.mjs";
import { ThrowableTile } from "./items/ThrowableTile.mjs";
import { ThrowableTileEntity } from "./items/ThrowableTileEntity.mjs";
import { Main } from "./Main.js";
import { RoomEditor } from "./RoomEditor.mjs";
import { TileWithPosition, World } from "./world/World.js";

export class Player extends RectangularCollideable {
	velocity: Vector = new Vector(0, 0);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	facing: "left" | "right" = "left";
	coyoteTime: number = 0;
	health: number = PlayerData.INITIAL_HEALTH;
	invulnerabilityTime: number = 0;

	equippedItems: [ThrowableTile | null, ThrowableTile | null] = [null, null];

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
		if(this.onGround(world, canvasIO)) {
			this.hasDoubleJump = true;
			if(this.isCrouched()) {
				this.velocity.x *= PlayerData.CROUCHED_FRICTION;
			}
		}
		this.velocity.y += canvasIO.keys.KeyZ && this.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY;
		this.velocity.x = MathUtils.constrain(this.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.MAX_X_VELOCITY);
		this.move(new Vector(this.velocity.x, 0), world, canvasIO, {
			onCollision: (direction, collisions) => {
				this.velocity.x = 0;
				this.checkDamagingCollisions(collisions, world);
			},
			slideUpSlopes: true,
			slideDownSlopes: true,
		});
		this.move(new Vector(0, this.velocity.y), world, canvasIO, {
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
		const onGround = this.onGround(world, canvasIO);
		if(onGround) {
			this.coyoteTime = PlayerData.COYOTE_FRAMES;
		}
		if(canvasIO.keys.KeyZ && !GameUtils.pastKeys.KeyZ && (this.coyoteTime > 0 || this.hasDoubleJump)) {
			this.velocity.y = -PlayerData.JUMP_VELOCITY;
			this.hasDoubleJump = (this.coyoteTime > 0);
			this.coyoteTime = -1;
		}

		if(canvasIO.keys.KeyX && !GameUtils.pastKeys.KeyX) {
			const used = this.equippedItems[0]?.use(world, canvasIO);
			if(used) { this.equippedItems[0] = null; }
		}
		if(canvasIO.keys.KeyC && !GameUtils.pastKeys.KeyC) {
			const used = this.equippedItems[1]?.use(world, canvasIO);
			if(used) { this.equippedItems[1] = null; }
		}
		if(canvasIO.keys.ArrowDown && this.onGround(world, canvasIO)) {
			this.crouch();
		}
		if(
			(!canvasIO.keys.ArrowDown && this.onGround(world, canvasIO)) ||
			(this.velocity.y > 0)
		) { this.uncrouch(world); }
		if(canvasIO.keys.Space && !GameUtils.pastKeys.Space) {
			this.collectNearestItem(world);
		}
	}
	checkDamagingCollisions(collisions: (Entity | TileWithPosition)[], world: World) {
		for(const obj of collisions.filter(c => c instanceof Spikeball)) {
			this.damage(obj.hitbox, world);
		}
	}
	onGround(world: World, canvasIO: CanvasIO) {
		return !this.canMove("down", world, canvasIO);
	}
	damage(hurtbox: Rectangle, world: World) {
		if(this.invulnerabilityTime < 0) {
			this.health --;
			Main.screenFades.push(new ScreenFade(
				PlayerData.DAMAGE_FLASH_TIME,
				PlayerData.DAMAGE_FLASH_OPACITY, 0,
				PlayerData.DAMAGE_FLASH_COLOR,
				"damage-flash",
			));
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
	throwDirection(canvasIO: CanvasIO) {
		if(canvasIO.keys.ArrowDown) {
			return "down";
		}
		return this.facing;
	}
	throw(item: ThrowableTileEntity, world: World, canvasIO: CanvasIO) {
		const direction = this.throwDirection(canvasIO);
		const size = (direction === "down" ? item.hitbox.height : item.hitbox.width);
		const throwStartCenter = this.hitbox.edgeCenter(direction).add(Vector.unit(direction).multiply(ItemData.THROW_OFFSET + size / 2));
		const throwStart = new Vector(throwStartCenter.x - item.hitbox.width / 2, throwStartCenter.y - item.hitbox.height / 2);
		if(!world.isInSolid(item.hitbox.translate(throwStart))) {
			item.translate(throwStart);
			item.velocity = this.itemThrowVelocity(canvasIO);
			world.entities.addEntity(item);
			return true;
		}
		return false;
	}
	collectNearestItem(world: World) {
		const rect = this.hitbox.extend("all", ItemData.PICKUP_DISTANCE);
		const allItems = [...world.entities.collideablesIntersecting(rect)].filter(i => i instanceof ThrowableTileEntity);
		if(allItems.length !== 0) {
			const closest = ArrayUtils.minValue(allItems, item => item.hitbox.distanceToRect(this.hitbox));
			this.collect(closest, world);
		}
	}
	collect(itemEntity: ThrowableTileEntity, world: World) {
		const firstEmptySlot = this.equippedItems.indexOf(null);
		if(firstEmptySlot !== -1) {
			this.equippedItems[firstEmptySlot] = itemEntity.getItem();
			for(const modifier of this.equippedItems[firstEmptySlot].modifiers) {
				modifier.reset();
			}
			world.entities.removeEntity(itemEntity);
		}
	}
}
