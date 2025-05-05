import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { GameUtils } from "../GameUtils.mjs";
import { Player } from "../Player.mjs";
import { World } from "../World.js";

export class Gate {
	static COLOR = "rgb(59, 67, 70)";

	static TOGGLE_DISTANCE = 10; // TODO: remove magic number
	static SPEED = 0.2;

	static cooldown = 0;
	
	direction: Direction; // which way the gate moves when closing
	openness: number;
	playerSide: "positive" | "negative" = "positive";
	open: boolean = closed;
	initialized: boolean = false;

	constructor(direction: Direction, open: boolean) {
		this.direction = direction;
		this.open = open;
		this.openness = open ? 1 : 0;
	}

	get closedness() {
		return 1 - this.openness;
	}

	getPhysicsBox(x: number, y: number) {
		if(this.direction === "down") {
			return new Rectangle(
				x * World.TILE_SIZE, y * World.TILE_SIZE,
				World.TILE_SIZE, this.closedness * World.TILE_SIZE
			);
		}
		else if(this.direction === "up") {
			return new Rectangle(
				x * World.TILE_SIZE, (y + 1 - this.closedness) * World.TILE_SIZE,
				World.TILE_SIZE, this.closedness * World.TILE_SIZE
			);
		}
		else if(this.direction === "left") {
			return new Rectangle(
				(x + 1 - this.closedness) * World.TILE_SIZE, y * World.TILE_SIZE,
				this.closedness * World.TILE_SIZE, World.TILE_SIZE
			)
		}
		else {
			return new Rectangle(
				x * World.TILE_SIZE, y * World.TILE_SIZE,
				this.closedness * World.TILE_SIZE, World.TILE_SIZE
			);
		}
	}

	display(canvasIO: CanvasIO, x: number, y: number) {
		const box = this.getPhysicsBox(x, y);
		canvasIO.ctx.fillStyle = Gate.COLOR;
		canvasIO.fillRect(box);
	}
	update(world: World, x: number, y: number) {
		if(!this.initialized) {
			this.initialize(world.player, x, y);
			this.initialized = true;
		}
		this.checkPlayer(world, x, y);
		this.openness = GameUtils.moveTowards(this.openness, this.open ? 1 : 0, Gate.SPEED);
	}
	getPlayerSide(player: Player, x: number, y: number) {
		const boundingBox = player.physicsObject.boundingBox();
		if(Directions.isVertical(this.direction)) {
			const onLeft = (boundingBox.right() <= x * World.TILE_SIZE - Gate.TOGGLE_DISTANCE);
			const onRight = (boundingBox.x >= (x + 1) * World.TILE_SIZE + Gate.TOGGLE_DISTANCE);
			return onLeft ? "negative" : (onRight ? "positive" : this.playerSide);
		}
		else {
			const above = boundingBox.bottom() <= y * World.TILE_SIZE - Gate.TOGGLE_DISTANCE;
			const below = boundingBox.y >= (y + 1) * World.TILE_SIZE + Gate.TOGGLE_DISTANCE;
			return above ? "negative" : (below ? "positive" : this.playerSide);
		}
	}
	checkPlayer(world: World, x: number, y: number) {
		const boundingBox = world.player.physicsObject.boundingBox();
		const sameRowOrColumn = (Directions.isVertical(this.direction)
			? (boundingBox.bottom() >= y * World.TILE_SIZE && boundingBox.top() <= (y + 1) * World.TILE_SIZE)
			: (boundingBox.right() >= x * World.TILE_SIZE && boundingBox.left() <= (x + 1) * World.TILE_SIZE)
		);

		const newSide = this.getPlayerSide(world.player, x, y);
		if(newSide !== this.playerSide && sameRowOrColumn && Gate.cooldown <= 0) {
			Gate.toggleAll(world);
			Gate.cooldown = 1 / Gate.SPEED;
		}
		this.playerSide  = newSide;
	}
	static toggleAll(world: World) {
		for(const tile of world.tiles.values()) {
			if(tile instanceof Gate) {
				tile.open = !tile.open;
			}
		}
	}

	initialize(player: Player, x: number, y: number) {
		const boundingBox = player.physicsObject.boundingBox();
		const center = boundingBox.center();
		if(Directions.isVertical(this.direction)) {
			this.playerSide = center.x < (x + 1/2) * World.TILE_SIZE ? "negative" : "positive";
		}
		else {
			this.playerSide = center.y < (y + 1/2) * World.TILE_SIZE ? "negative" : "positive";
		}
	}
}
