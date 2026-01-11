import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData } from "../../constants/GameData.mjs";
import { World } from "../../world/World";
import { Drill } from "../Drill.mjs";
import { ThrowableItemEntity } from "./ThrowableItemEntity.mjs";

export class DrillEntity extends ThrowableItemEntity {
	direction: Direction;
	usesRemaining: number = ItemData.DRILL.DESTRUCTIONS;

	constructor(direction: Direction) {
		if(Directions.isVertical(direction)) {
			super(new Rectangle(0, 0, ItemData.DRILL.WIDTH, ItemData.DRILL.LENGTH));
		}
		else {
			super(new Rectangle(0, 0, ItemData.DRILL.LENGTH, ItemData.DRILL.WIDTH));
		}
		this.direction = direction;

		this.gravity = 0;
		this.frictionX = 1;
	}

	getItem() { return new Drill(); }

	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = "black";
		canvasIO.fillRect(this.hitbox);
	}

	update(world: World, canvasIO: CanvasIO) {
		this.velocity = Vector.unit(this.direction).multiply(ItemData.DRILL.SPEED);
		super.update(world, canvasIO);
		this.updateDestruction(world);
	}
	updateDestruction(world: World) {
		if(this.usesRemaining <= 0) { return; }
		const offset = Vector.unit(this.direction).multiply(ItemData.DRILL.DESTRUCTION_DISTANCE);
		const center = this.hitbox.edgeCenter(this.direction).add(offset);
		const region = Rectangle.fromCenter(
			center.x, center.y,
			Directions.isHorizontal(this.direction) ? 1 : ItemData.DRILL.DESTRUCTION_WIDTH,
			Directions.isHorizontal(this.direction) ? ItemData.DRILL.DESTRUCTION_WIDTH : 1,
		);
		let destroyed = false;
		for(const { position } of world.getTilesAt(region)) {
			if(world.tiles.get(position) !== "empty") { destroyed = true; }
			world.destroyTile(position);
		}
		if(destroyed) {
			this.usesRemaining --;
		}
	}
}
