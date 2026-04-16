import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { ThrowableTile } from "../items/ThrowableTile.mjs";
import { ThrowableTileEntity } from "../items/ThrowableTileEntity.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(1, 0, 10, 10), new BasicTile());
world.tiles.fillRect(new Rectangle(5, 0, 10, 1), EmptyTile.EMPTY);

// world.entities.add(new ThrowableTileEntity(new Vector(3, -2).multiply(WorldData.TILE_SIZE), []));
world.entities.add(new ThrowableTileEntity(new Vector(0, 0).multiply(WorldData.TILE_SIZE), []));
world.player.equippedItems[0] = new ThrowableTile([]);

Main.screen = new WorldScreen(world);
