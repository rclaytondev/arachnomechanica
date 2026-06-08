import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Gate } from "../entities/Gate.mjs";
import { TeleportingCreature } from "../entities/TeleportingCreature.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);
world.tiles.set(5, -3, new BasicTile());
world.tiles.fillRect(new Rectangle(0, 0, 10, 1), new BasicTile());
const gate = Gate.atTile(new Vector(6, -3), "right", false);
world.addEntityIfEmpty(gate);

const creature = TeleportingCreature.atTile(new Vector(5, -2));
world.addEntityIfEmpty(creature);

Main.screen = new WorldScreen(world);
