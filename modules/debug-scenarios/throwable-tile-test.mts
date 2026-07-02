import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { ThrowableTile } from "../items/ThrowableTile.mjs";
import { ThrowableTileEntity } from "../items/ThrowableTileEntity.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { Main } from "../Main.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(Rectangle.fromDimensions(1, 0, 10, 10), TowerTile.TOWER_TILE);
world.tiles.fillRect(Rectangle.fromDimensions(5, 0, 10, 1), EmptyTile.EMPTY);

// world.entities.add(new ThrowableTileEntity(new Vector(3, -2).multiply(WorldData.TILE_SIZE), []));
world.entities.add(new ThrowableTileEntity(new Vector(0, 0).multiply(WorldData.TILE_SIZE), []));
world.player.equippedItems[0] = new ThrowableTile([]);

Main.screen = new WorldScreen(world);
