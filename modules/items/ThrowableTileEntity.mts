import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, PlayerData, WorldData } from "../constants/GameData.mjs";
import { Collideable, RectangularCollideable } from "../game-utilities/Collideable.mjs";
import { TileWithPosition, World } from "../world/World";
import { ThrowableTile } from "./ThrowableTile.mjs";
import { TileModifier } from "./TileModifier.mjs";

export class ThrowableTileEntity extends RectangularCollideable {
	modifiers: TileModifier[] = [];

	velocity: Vector = new Vector(0, 0);
	gravity: number = PlayerData.GRAVITY;
	frictionX: number = ItemData.FRICTION_X;
	frictionY: number = 1;

	constructor(position: Vector = new Vector(0, 0), modifiers: TileModifier[]) {
		super(Rectangle.square(position.x, position.y, WorldData.TILE_SIZE));
		this.gravity = ThrowableTileEntity.getGravity(modifiers);
		this.modifiers = modifiers;
		this.frictionY = Math.min(1, ...modifiers.map(m => m.frictionY ?? Infinity));
	}
	static getGravity(modifiers: TileModifier[]) {
		const values = new Set(modifiers.map(m => m.gravity));
		if(values.has("reverse")) {return -PlayerData.GRAVITY; }
		else if(values.has("none")) { return 0; }
		else { return PlayerData.GRAVITY; }
	}

	getItem() {
		return new ThrowableTile(this.modifiers);
	}

	update(world: World, canvasIO: CanvasIO) {
		this.velocity.x *= this.frictionX;
		this.velocity.y *= this.frictionY;
		this.velocity.y += this.gravity;
		this.move(this.velocity, world, canvasIO, {
			onCollision: (direction) => {
				if(Directions.isVertical(direction)) {
					this.velocity.y = 0;
				}
				else {
					this.velocity.x = 0;
				}
			},
			collides: (obj) => obj !== this,
		});
		world.entities.moveEntity(this);

		for(const modifier of this.modifiers) {
			modifier.update(this, world, canvasIO);
		}
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
		canvasIO.fillRect(this.hitbox);

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.strokeSquare(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
			2 * WorldData.TILE_ACCENT_RADIUS,
		);
		canvasIO.strokeLine(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
			this.hitbox.right() - WorldData.TILE_ACCENT_INSET,
			this.hitbox.bottom() - WorldData.TILE_ACCENT_INSET,
		);
		canvasIO.strokeLine(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.bottom() - WorldData.TILE_ACCENT_INSET,
			this.hitbox.right() - WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
		);
	}

	onCollision(collider: Collideable | TileWithPosition, direction: Direction, world: World, canvasIO: CanvasIO): void {
		for(const modifier of this.modifiers) {
			modifier.onCollision(this, collider, direction, world, canvasIO);
		}
	}

	reset() {
		for(const modifier of this.modifiers) {
			modifier.reset();
		}
	}
}
