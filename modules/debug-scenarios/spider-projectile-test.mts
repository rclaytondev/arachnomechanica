import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Spider } from "../entities/Spider.mjs";
import { Main } from "../Main.mjs";
import { World } from "../world/World.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 2, 6), TowerTile.TOWER_TILE);
world.tiles.fillRect(new Rectangle(-2, 4, 5, 2), TowerTile.TOWER_TILE);
Spider.spawn(new Vector(-3, 3), world);

Main.screen = new WorldScreen(world);
