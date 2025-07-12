import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GateData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { frameCount } from "../Main.js";
import { Player } from "../Player.mjs";
import { World } from "../world/World.js";

export class Gate {
	static cooldown = 0;
	static open = false;
	static openness = 0;

	static update(world: World) {
		const closedBefore = Gate.openness === 0;
		Gate.openness = GameUtils.moveTowards(Gate.openness, Gate.open ? 1 : 0, GateData.SPEED);
		if(Gate.openness === 0 && !closedBefore) {
			world.screenShakeTimer = GateData.SCREEN_SHAKE_TIME;
			world.screenShakeIntensity = GateData.SCREEN_SHAKE_INTENSITY;
		}
		Gate.cooldown --;
	}

	direction: Direction; // which way the gate moves when closing
	playerSide: "positive" | "negative" = "positive";
	toggled: boolean = false;
	lastFrameUpdated: number = -Infinity;

	constructor(direction: Direction, toggled: boolean) {
		this.direction = direction;
		this.toggled = toggled;
	}

	get open() {
		return this.toggled ? !Gate.open : Gate.open;
	}
	get openness() {
		return this.toggled ? 1 - Gate.openness : Gate.openness;
	}
	get closedness() {
		return 1 - this.openness;
	}

	getPhysicsBox(x: number, y: number, closedness: number = 1 - this.openness) {
		if(this.direction === "down") {
			return new Rectangle(
				x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE,
				WorldData.TILE_SIZE, closedness * WorldData.TILE_SIZE,
			);
		}
		else if(this.direction === "up") {
			return new Rectangle(
				x * WorldData.TILE_SIZE, (y + 1 - closedness) * WorldData.TILE_SIZE,
				WorldData.TILE_SIZE, closedness * WorldData.TILE_SIZE,
			);
		}
		else if(this.direction === "left") {
			return new Rectangle(
				(x + 1 - closedness) * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE,
				closedness * WorldData.TILE_SIZE, WorldData.TILE_SIZE,
			);
		}
		else {
			return new Rectangle(
				x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE,
				closedness * WorldData.TILE_SIZE, WorldData.TILE_SIZE,
			);
		}
	}

	display(canvasIO: CanvasIO, x: number, y: number) {
		const box = this.getPhysicsBox(x, y, Math.max(1 - this.openness, GateData.MIN_DISPLAY_SIZE));
		canvasIO.ctx.fillStyle = GateData.COLOR;
		canvasIO.fillRect(box);
	}
	update(world: World, x: number, y: number, canvasIO: CanvasIO) {
		if(this.lastFrameUpdated !== frameCount - 1) {
			this.initialize(world.player, x, y);
		}
		this.lastFrameUpdated = frameCount;
		this.checkPlayer(world, x, y);
		const closed = this.openness === 0;
		if(!closed && this.openness === 0) {
			world.damage(this.getPhysicsBox(x, y), canvasIO);
		}
	}
	adjacentGates(world: World, x: number, y: number, direction: Direction) {
		let position = Vector.unit(direction).add(x, y);
		let count = 0;
		while(world.tiles.get(position) instanceof Gate) {
			count ++;
			position = position.add(Vector.unit(direction));
		}
		return count;
	}
	getPlayerSide(world: World, x: number, y: number) {
		const hitbox = world.player.physicsObject.hitbox();
		if(Directions.isVertical(this.direction)) {
			const gatesLeft = this.adjacentGates(world, x, y, "left");
			const gatesRight = this.adjacentGates(world, x, y, "right");
			const onLeft = (hitbox.right() <= (x - gatesLeft) * WorldData.TILE_SIZE - GateData.TOGGLE_DISTANCE);
			const onRight = (hitbox.x >= (x + gatesRight + 1) * WorldData.TILE_SIZE + GateData.TOGGLE_DISTANCE);
			return onLeft ? "negative" : (onRight ? "positive" : this.playerSide);
		}
		else {
			const gatesAbove = this.adjacentGates(world, x, y, "up");
			const gatesBelow = this.adjacentGates(world, x, y, "down");
			const above = hitbox.bottom() <= (y - gatesAbove) * WorldData.TILE_SIZE - GateData.TOGGLE_DISTANCE;
			const below = hitbox.y >= (y + gatesBelow + 1) * WorldData.TILE_SIZE + GateData.TOGGLE_DISTANCE;
			return above ? "negative" : (below ? "positive" : this.playerSide);
		}
	}
	checkPlayer(world: World, x: number, y: number) {
		const hitbox = world.player.physicsObject.hitbox();
		const sameRowOrColumn = (Directions.isVertical(this.direction)
			? (hitbox.bottom() >= (y + 1 - GateData.HITBOX_SIZE) * WorldData.TILE_SIZE && hitbox.top() <= (y + GateData.HITBOX_SIZE) * WorldData.TILE_SIZE)
			: (hitbox.right() >= (x + 1 - GateData.HITBOX_SIZE) * WorldData.TILE_SIZE && hitbox.left() <= (x + GateData.HITBOX_SIZE) * WorldData.TILE_SIZE)
		);


		const newSide = this.getPlayerSide(world, x, y);
		const adjacentGate = world.tiles.get(Vector.unit(
			(Directions.isVertical(this.direction))
				? (newSide === "negative" ? "left" : "right")
				: (newSide === "negative" ? "up" : "down"),
		).add(x, y)) instanceof Gate;
		if(newSide !== this.playerSide && sameRowOrColumn && Gate.cooldown <= 0 && !adjacentGate) {
			Gate.toggleAll();
			Gate.cooldown = 1 / GateData.SPEED;
		}
		this.playerSide = newSide;
	}
	static toggleAll() {
		Gate.open = !Gate.open;
	}

	initialize(player: Player, x: number, y: number) {
		const hitbox = player.physicsObject.hitbox();
		const center = hitbox.center();
		if(Directions.isVertical(this.direction)) {
			this.playerSide = center.x < (x + 1/2) * WorldData.TILE_SIZE ? "negative" : "positive";
		}
		else {
			this.playerSide = center.y < (y + 1/2) * WorldData.TILE_SIZE ? "negative" : "positive";
		}
	}
	copy() {
		const result = new Gate(this.direction, this.toggled);
		result.playerSide = this.playerSide;
		result.lastFrameUpdated = this.lastFrameUpdated;
		return result;
	}
}
