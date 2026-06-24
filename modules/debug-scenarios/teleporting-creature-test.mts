import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { TeleportingCreature } from "../entities/TeleportingCreature.mjs";
import { Main } from "../Main.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

const creature = TeleportingCreature.atTile(new Vector(5, -1));
world.addEntityIfEmpty(creature);



world.tiles.fillRect(new Rectangle(0, 0, 10, 10), TowerTile.TOWER_TILE);
// world.tiles.fillRect(new Rectangle(5, 0, 10, 1), EmptyTile.EMPTY);
world.tiles.fillRect(new Rectangle(-1, -5, 1, 10), TowerTile.TOWER_TILE);

Main.screen = new WorldScreen(world);
