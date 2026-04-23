import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GateData, RoomData, WorldData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Player } from "../Player.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { ShakeEffect } from "../game-utilities/visual-effects/ShakeEffect.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { StaticEntity } from "../game-utilities/StaticEntity.mjs";

class GateController extends StaticEntity {
	cooldown: number = 0;
	open: boolean = false;
	openness: number = 0;

	static getOrInitialize(world: World) {
		const controller = world.staticEntities.entitiesList.find(e => e instanceof GateController);
		if(controller) {
			return controller;
		}
		const newController = new GateController();
		world.staticEntities.entitiesList.push(newController);
		return newController;
	}

	update(world: World) {
		const closedBefore = (this.openness === 0 || this.openness === 1);
		this.openness = GameUtils.moveTowards(this.openness, this.open ? 1 : 0, GateData.SPEED);
		const closedNow = (this.openness === 0 || this.openness === 1);
		if(closedNow && !closedBefore) {
			world.staticEntities.add(new ShakeEffect(GateData.SCREEN_SHAKE_TIME, GateData.SCREEN_SHAKE_INTENSITY));
		}
		this.cooldown --;
	}
	toggleAll() {
		this.open = !this.open;
	}

	render() { return []; }
}

export class Gate extends RectangularCollideable {
	direction: Direction; // which way the gate moves when closing
	playerSide: "positive" | "negative" = "positive";
	toggled: boolean = false;
	lastFrameUpdated: number = -Infinity;
	openness: number;

	private constructor(hitbox: Rectangle, direction: Direction, toggled: boolean) {
		super(hitbox);
		this.direction = direction;
		this.toggled = toggled;
		this.openness = toggled ? 0 : 1;
	}
	static atTile(tilePosition: Vector, direction: Direction, toggled: boolean) {
		const hitbox = Gate.getPhysicsBox(tilePosition, direction, toggled ? 0 : 1);
		return new Gate(hitbox, direction, toggled);
	}

	open(gateController: GateController) {
		return this.toggled ? !gateController.open : gateController.open;
	}
	opennessTarget(gateController: GateController) {
		return this.toggled ? 1 - gateController.openness : gateController.openness;
	}

	static getPhysicsBox(tilePosition: Vector, direction: Direction, closedness: number) {
		if(direction === "down") {
			return new Rectangle(
				tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE,
				WorldData.TILE_SIZE, closedness * WorldData.TILE_SIZE,
			);
		}
		else if(direction === "up") {
			return new Rectangle(
				tilePosition.x * WorldData.TILE_SIZE, (tilePosition.y + 1 - closedness) * WorldData.TILE_SIZE,
				WorldData.TILE_SIZE, closedness * WorldData.TILE_SIZE,
			);
		}
		else if(direction === "left") {
			return new Rectangle(
				(tilePosition.x + 1 - closedness) * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE,
				closedness * WorldData.TILE_SIZE, WorldData.TILE_SIZE,
			);
		}
		else {
			return new Rectangle(
				tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE,
				closedness * WorldData.TILE_SIZE, WorldData.TILE_SIZE,
			);
		}
	}

	render() {
		return [new Renderable(this.display.bind(this), "tile-entity")];
	}
	display(canvasIO: CanvasIO) {
		const length = Directions.isHorizontal(this.direction) ? this.hitbox.width : this.hitbox.height;
		const displayLength = Math.max(length, GateData.MIN_DISPLAY_SIZE * WorldData.TILE_SIZE);
		const box = this.hitbox.extend(this.direction, displayLength - length);
		canvasIO.ctx.fillStyle = GateData.COLOR;
		canvasIO.fillRect(box);

		canvasIO.ctx.save();
		canvasIO.clipRect(box.x, box.y, box.width, box.height);
		const patternBox = box.extend(Directions.opposite[this.direction], WorldData.TILE_SIZE - Math.min(box.width, box.height));
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		for(const size of [WorldData.TILE_ACCENT_INSET, GateData.INNER_ACCENT_INSET]) {
			canvasIO.strokeSquare(
				patternBox.x + size, patternBox.y + size,
				WorldData.TILE_SIZE - 2 * size,
			);
		}
		const center = patternBox.center();
		const directions: Direction[] = (Directions.isHorizontal(this.direction) ? ["left", "right"] : ["up", "down"]);
		for(const direction of directions) {
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.rotateTo("down", direction);
			canvasIO.strokeLine(
				0, GateData.INNER_ACCENT_INSET - WorldData.TILE_SIZE / 2,
				0, WorldData.TILE_ACCENT_INSET - WorldData.TILE_SIZE / 2,
			);
			canvasIO.ctx.restore();
		}
		canvasIO.ctx.restore();
	}
	update(world: World, canvasIO: CanvasIO) {
		if(this.lastFrameUpdated !== GameUtils.frameCount - 1) {
			this.initialize(world.player);
		}
		this.lastFrameUpdated = GameUtils.frameCount;
		this.checkPlayer(world);
		this.updateOpenness(world, canvasIO);
	}
	updateOpenness(world: World, canvasIO: CanvasIO) {
		const target = this.opennessTarget(GateController.getOrInitialize(world));
		const length = Directions.isHorizontal(this.direction) ? this.hitbox.width : this.hitbox.height;
		const targetLength = (1 - target) * WorldData.TILE_SIZE;
		this.extend(targetLength - length, this.direction, world, canvasIO, {});
	}
	fullHitbox() {
		const length = Directions.isHorizontal(this.direction) ? this.hitbox.width : this.hitbox.height;
		return this.hitbox.extend(this.direction, WorldData.TILE_SIZE - length);
	}
	adjacentGates(world: World, x: number, y: number, direction: Direction) {
		let position = Vector.unit(direction).add(x, y);
		let count = 0;
		while(Gate.isGateAt(position, world)) {
			count ++;
			position = position.add(Vector.unit(direction));
		}
		return count;
	}
	getPlayerSide(world: World, x: number, y: number) {
		const hitbox = world.player.hitbox;
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
	checkPlayer(world: World) {
		const hitbox = world.player.hitbox;
		const tilePosition = this.tilePosition();
		const { x, y } = tilePosition;
		const sameRowOrColumn = (Directions.isVertical(this.direction)
			? (hitbox.bottom() >= (y + 1 - GateData.HITBOX_SIZE) * WorldData.TILE_SIZE && hitbox.top() <= (y + GateData.HITBOX_SIZE) * WorldData.TILE_SIZE)
			: (hitbox.right() >= (x + 1 - GateData.HITBOX_SIZE) * WorldData.TILE_SIZE && hitbox.left() <= (x + GateData.HITBOX_SIZE) * WorldData.TILE_SIZE)
		);


		const newSide = this.getPlayerSide(world, x, y);
		const adjacentTile = tilePosition.add(Vector.unit(
			(Directions.isVertical(this.direction))
			? (newSide === "negative" ? "left" : "right")
			: (newSide === "negative" ? "up" : "down"),
		));
		const adjacentGate = Gate.isGateAt(adjacentTile, world);
		const gateController = GateController.getOrInitialize(world);
		if(newSide !== this.playerSide && sameRowOrColumn && gateController.cooldown <= 0 && !adjacentGate) {
			gateController.toggleAll();
			gateController.cooldown = 1 / GateData.SPEED;
		}
		this.playerSide = newSide;
	}

	initialize(player: Player) {
		const gate = this.hitbox.center();
		if(Directions.isVertical(this.direction)) {
			this.playerSide = player.hitbox.center().x < gate.x ? "negative" : "positive";
		}
		else {
			this.playerSide = player.hitbox.center().y < gate.y ? "negative" : "positive";
		}
	}
	copy() {
		const result = new Gate(this.hitbox, this.direction, this.toggled);
		result.playerSide = this.playerSide;
		result.lastFrameUpdated = this.lastFrameUpdated;
		result.openness = this.openness;
		return result;
	}
	copyAndTranslate(amount: Vector) {
		const copy = this.copy();
		copy.hitbox = copy.hitbox.translate(amount);
		return copy;
	}
	reflect(): Gate {
		const hitbox = Rectangle.fromBounds(
			RoomData.SIZE * WorldData.TILE_SIZE - this.hitbox.right(), RoomData.SIZE * WorldData.TILE_SIZE - this.hitbox.left(),
			this.hitbox.top(), this.hitbox.bottom(),
		);
		return new Gate(hitbox, Directions.reflectX[this.direction], this.toggled);
	}

	tilePosition() {
		const center = this.fullHitbox().center();
		return Tiles.getTileCoordinates(center);
	}
	static getGateAt(tilePosition: Vector, world: World) {
		const tileRect = Rectangle.square(tilePosition.x, tilePosition.y, 1).scale(WorldData.TILE_SIZE);
		return [...world.entities.possiblyIntersecting(tileRect)].find(
			e => e instanceof Gate && e.tilePosition().equals(tilePosition),
		);
	}
	static isGateAt(tilePosition: Vector, world: World) {
		return Gate.getGateAt(tilePosition, world) != undefined;
	}

	canPush(obj: Collideable | TileWithPosition) {
		return obj instanceof Collideable;
	}
	canCrush() {
		return true;
	}
}
