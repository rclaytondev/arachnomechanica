import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Spider } from "../entities/Spider.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 2, 6), new BasicTile());
world.tiles.fillRect(new Rectangle(-2, 4, 5, 2), new BasicTile());
Spider.spawn(new Vector(-3, 3), world);

Main.screen = new WorldScreen(world);
