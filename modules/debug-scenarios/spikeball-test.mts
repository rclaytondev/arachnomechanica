import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { SpikeballBlock } from "../entities/SpikeballBlock.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, -3, 10, 6), new BasicTile());
world.tiles.fillRect(new Rectangle(-1, -2, 8, 4), EmptyTile.EMPTY);
world.tiles.set(5, -2, new BasicTile());
world.entities.add(SpikeballBlock.atTile(new Vector(5, -1)));

Main.screen = new WorldScreen(world);
