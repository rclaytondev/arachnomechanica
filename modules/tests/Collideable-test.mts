import { assert } from "chai";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { canvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";

class CollideableSpy extends RectangularCollideable {
	pushable: boolean;
	collisions: number = 0;
	destroyed: boolean = false;

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
}

describe("Collideable.moveUnit", () => {
	const createWorld = (collideables: Collideable[]) => {
		const world = new World(false);
		world.entities.clear();
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
});
