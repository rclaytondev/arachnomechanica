import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 10, 1), BasicTile.BASIC_TILE);
world.tiles.fillRect(new Rectangle(2, -2, 2, 1), Platform.PLATFORM);
world.tiles.set(0, -1, new SlopeTile("slope-floor-left"));
world.tiles.set(-1, -2, new SlopeTile("slope-floor-left"));
world.tiles.set(-2, -3, new SlopeTile("slope-floor-left"));
world.tiles.set(-3, -3, BasicTile.BASIC_TILE);
world.tiles.fillRect(new Rectangle(-6, -2, 5, 1), BasicTile.BASIC_TILE);

world.tiles.set(6, -1, new SlopeTile("slope-floor-right"));
world.tiles.set(7, -2, new SlopeTile("slope-floor-right"));
world.tiles.set(8, -3, new SlopeTile("slope-floor-right"));
world.tiles.set(8, -2, BasicTile.BASIC_TILE);
world.tiles.set(9, -3, BasicTile.BASIC_TILE);


world.tiles.set(2, -6, new SlopeTile("slope-floor-right"));
world.tiles.set(3, -6, new SlopeTile("slope-floor-left"));


world.player.hitbox.y -= 100;



Main.screen = new WorldScreen(world);
