import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Main } from "../Main.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { StoneSlope } from "../tiles/StoneSlope.mjs";
import { StoneTile } from "../tiles/StoneTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(Rectangle.fromDimensions(-2, 0, 10, 1), StoneTile.STONE_TILE);
world.tiles.fillRect(Rectangle.fromDimensions(2, -2, 2, 1), Platform.PLATFORM);
world.tiles.set(0, -1, new StoneSlope("up-right"));
world.tiles.set(-1, -2, new StoneSlope("up-right"));
world.tiles.set(-2, -3, new StoneSlope("up-right"));
world.tiles.set(-3, -3, StoneTile.STONE_TILE);
world.tiles.fillRect(Rectangle.fromDimensions(-6, -2, 5, 1), StoneTile.STONE_TILE);

world.tiles.set(6, -1, new StoneSlope("up-left"));
world.tiles.set(7, -2, new StoneSlope("up-left"));
world.tiles.set(8, -3, new StoneSlope("up-left"));
world.tiles.set(8, -2, StoneTile.STONE_TILE);
world.tiles.set(9, -3, StoneTile.STONE_TILE);


world.tiles.set(2, -6, new StoneSlope("up-left"));
world.tiles.set(3, -6, new StoneSlope("up-right"));


world.player.hitbox.y -= 100;



Main.screen = new WorldScreen(world);
