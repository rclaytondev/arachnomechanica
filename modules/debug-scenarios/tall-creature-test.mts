import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { TallCreature } from "../entities/TallCreature.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

const creature = new TallCreature(new Vector(225, -150), 140, world);
creature.direction = "right";
world.entities.add(creature);

world.tiles.fillRect(new Rectangle(0, 0, 10, 10), new BasicTile());
world.tiles.fillRect(new Rectangle(5, 0, 10, 1), EmptyTile.EMPTY);
world.tiles.fillRect(new Rectangle(-1, -5, 1, 10), new BasicTile());

Main.screen = new WorldScreen(world);
