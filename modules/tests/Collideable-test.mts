import { assert } from "chai";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { WorldData } from "../constants/GameData.mjs";

class CollideableSpy extends RectangularCollideable {
	pushable: boolean;
	collisions: number = 0;
	destroyed: boolean = false;
	amountTranslated: Vector = new Vector(0, 0);

	constructor(hitbox: Rectangle, pushable: boolean) {
		super(hitbox);
		this.pushable = pushable;
	}

	display() { }
	update() { }

	onCollision() {
		this.collisions ++;
	}

	canPush(obj: Collideable | TileWithPosition): obj is Collideable {
		if(obj instanceof CollideableSpy) {
			return obj.pushable;
		}
		return false;
	}

	damage(hurtbox: Rectangle, world: World): void {
		world.entities.removeEntity(this);
		this.destroyed = true;
	}

	translate(amount: Vector): void {
		super.translate(amount);
		this.amountTranslated = this.amountTranslated.add(amount);
	}
}

describe("Collideable.moveUnit", () => {
	const createWorld = (collideables: Collideable[], tiles: TileWithPosition[] = []) => {
		const world = new World(false);
		world.entities.clear();
		for(const { tile, x, y } of tiles) {
			world.tiles.set(x, y, tile);
		}
		for(const collideable of collideables) {
			const added = world.addEntityIfEmpty(collideable);
			if(!added) {
				throw new Error("Error in test setup: entities overlapped.");
			}
		}
		return world;
	};

	it("moves the Collideable if there is no obstruction", () => {
		let collideable;
		const world = createWorld([
			collideable = new CollideableSpy(new Rectangle(0, 0, 10, 10), true),
		]);
		collideable.moveUnit("right", world, canvasIO!, {});

		assert.deepEqual(collideable.hitbox, new Rectangle(1, 0, 10, 10));
		assert.equal(collideable.collisions, 0);
	});
	it("pushes the next Collideable if there is a collision and it is pushable", () => {
		let pusher, pushed;
		const world = createWorld([
			pusher = new CollideableSpy(new Rectangle(0, 0, 10, 10), true),
			pushed = new CollideableSpy(new Rectangle(10, 0, 10, 10), true),
		]);
		pusher.moveUnit("right", world, canvasIO!, {});

		assert.deepEqual(pusher.hitbox, new Rectangle(1, 0, 10, 10));
		assert.deepEqual(pushed.hitbox, new Rectangle(11, 0, 10, 10));
		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 1);
	});
	it("does not move if the next object is not pushable", () => {
		let pusher, pushed;
		const world = createWorld([
			pusher = new CollideableSpy(new Rectangle(0, 0, 10, 10), true),
			pushed = new CollideableSpy(new Rectangle(10, 0, 10, 10), false),
		]);
		pusher.moveUnit("right", world, canvasIO!, {});

		assert.deepEqual(pusher.hitbox, new Rectangle(0, 0, 10, 10));
		assert.deepEqual(pushed.hitbox, new Rectangle(10, 0, 10, 10));
		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 1);
	});
	it("destroys the next object if the object after that one is unpushable", () => {
		let pusher, pushed, unpushable;
		const world = createWorld([
			pusher = new CollideableSpy(new Rectangle(0, 0, 10, 10), true),
			pushed = new CollideableSpy(new Rectangle(10, 0, 10, 10), true),
			unpushable = new CollideableSpy(new Rectangle(20, 0, 10, 10), false),
		]);
		pusher.moveUnit("right", world, canvasIO!, {});

		assert.deepEqual(pusher.hitbox, new Rectangle(1, 0, 10, 10));
		assert.deepEqual(unpushable.hitbox, new Rectangle(20, 0, 10, 10));

		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 2);
		assert.equal(unpushable.collisions, 1);

		assert.isFalse(pusher.destroyed);
		assert.isTrue(pushed.destroyed);
		assert.isFalse(unpushable.destroyed);
	});
	it("does not destroy the object or call any collision handler if the move is blocked simultaneously", () => {
		let pusher, pushable, unpushable1, unpushable2;
		const world = createWorld([
			pusher = new CollideableSpy(new Rectangle(0, 0, 10, 20), true),
			pushable = new CollideableSpy(new Rectangle(10, 0, 10, 10), true),
			unpushable1 = new CollideableSpy(new Rectangle(10, 10, 10, 10), false),
			unpushable2 = new CollideableSpy(new Rectangle(20, 0, 10, 10), false),
		]);
		pusher.moveUnit("right", world, canvasIO!, {});

		assert.deepEqual(pusher.amountTranslated, new Vector(0, 0));
		assert.deepEqual(pushable.amountTranslated, new Vector(0, 0));
		assert.deepEqual(unpushable1.amountTranslated, new Vector(0, 0));
		assert.deepEqual(unpushable2.amountTranslated, new Vector(0, 0));

		assert.isFalse(pusher.destroyed);

		assert.equal(pusher.collisions, 1);
		assert.equal(pushable.collisions, 0);
		assert.equal(unpushable1.collisions, 1);
		assert.equal(unpushable2.collisions, 0);
	});
	it("moves everything the correct amount even when the collision graph is not a tree", () => {
		let first, middle1, middle2, last, uninvolved;
		const world = createWorld([
			first = new CollideableSpy(new Rectangle(0, 0, 10, 20), true),
			middle1 = new CollideableSpy(new Rectangle(10, 0, 10, 10), true),
			middle2 = new CollideableSpy(new Rectangle(10, 10, 10, 10), true),
			last = new CollideableSpy(new Rectangle(20, 0, 10, 10), true),
			uninvolved = new CollideableSpy(new Rectangle(40, 0, 10, 10), true),
		]);
		first.moveUnit("right", world, canvasIO!, {});

		assert.deepEqual(first.amountTranslated, new Vector(1, 0));
		assert.deepEqual(middle1.amountTranslated, new Vector(1, 0));
		assert.deepEqual(middle2.amountTranslated, new Vector(1, 0));
		assert.deepEqual(last.amountTranslated, new Vector(1, 0));
		assert.deepEqual(uninvolved.amountTranslated, new Vector(0, 0));
	});

	it("correctly moves Collideables down slopes of type slope-floor-left", () => {
		let collideable;
		const world = createWorld([
			collideable = new CollideableSpy(new Rectangle(0, -10, 10, 10), true),
		], [
			{ x: 0, y: 0, tile: new BasicTile("slope-floor-left", "tower") },
		]);
		collideable.moveUnit("right", world, canvasIO!, { slideDownSlopes: true });

		assert.deepEqual(collideable.amountTranslated, new Vector(1, 1));
	});
	it("correctly moves Collideables down slopes of type slope-floor-right", () => {
		let collideable;
		const world = createWorld([
			collideable = new CollideableSpy(new Rectangle(WorldData.TILE_SIZE - 10, -10, 10, 10), true),
		], [
			{ x: 0, y: 0, tile: new BasicTile("slope-floor-right", "tower") },
		]);
		collideable.moveUnit("left", world, canvasIO!, { slideDownSlopes: true });

		assert.deepEqual(collideable.amountTranslated, new Vector(-1, 1));
	});
	it("correctly moves Collideables up slopes of type slope-floor-left", () => {
		let collideable;
		const world = createWorld([
			collideable = new CollideableSpy(new Rectangle(WorldData.TILE_SIZE, WorldData.TILE_SIZE - 10, 10, 10), true),
		], [
			{ x: 0, y: 0, tile: new BasicTile("slope-floor-left", "tower") },
		]);
		collideable.moveUnit("left", world, canvasIO!, { slideUpSlopes: true });

		assert.deepEqual(collideable.amountTranslated, new Vector(-1, -1));
	});
	it("correctly moves Collideables up slopes of type slope-floor-right", () => {
		let collideable;
		const world = createWorld([
			collideable = new CollideableSpy(new Rectangle(-10, WorldData.TILE_SIZE - 10, 10, 10), true),
		], [
			{ x: 0, y: 0, tile: new BasicTile("slope-floor-right", "tower") },
		]);
		collideable.moveUnit("right", world, canvasIO!, { slideUpSlopes: true });

		assert.deepEqual(collideable.amountTranslated, new Vector(1, -1));
	});
});
