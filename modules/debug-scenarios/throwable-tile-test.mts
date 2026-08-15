import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { ThrowableTile } from "../items/ThrowableTile.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { Main } from "../Main.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { Platform } from "../tiles/Platform.mjs";

const world = new World(false);

world.tiles.fillRect(Rectangle.fromDimensions(1, 0, 10, 10), TowerTile.TOWER_TILE);
world.tiles.fillRect(Rectangle.fromDimensions(5, 0, 10, 1), EmptyTile.EMPTY);
world.tiles.set(0, 0, Platform.PLATFORM);
world.tiles.set(-1, 0, Platform.PLATFORM);

// world.entities.add(new ThrowableTileEntity(new Vector(3, -2).multiply(WorldData.TILE_SIZE), []));
world.player.equippedItems[0] = new ThrowableTile([]);

Main.screen = new WorldScreen(world);
