import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Main } from "../Main.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { StoneTile } from "../tiles/StoneTile.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 10, 1), StoneTile.STONE_TILE);
world.tiles.fillRect(new Rectangle(2, -2, 2, 1), Platform.PLATFORM);
world.tiles.set(0, -1, new TowerSlope("slope-floor-left"));
world.tiles.set(-1, -2, new TowerSlope("slope-floor-left"));
world.tiles.set(-2, -3, new TowerSlope("slope-floor-left"));
world.tiles.set(-3, -3, StoneTile.STONE_TILE);
world.tiles.fillRect(new Rectangle(-6, -2, 5, 1), StoneTile.STONE_TILE);

world.tiles.set(6, -1, new TowerSlope("slope-floor-right"));
world.tiles.set(7, -2, new TowerSlope("slope-floor-right"));
world.tiles.set(8, -3, new TowerSlope("slope-floor-right"));
world.tiles.set(8, -2, StoneTile.STONE_TILE);
world.tiles.set(9, -3, StoneTile.STONE_TILE);


world.tiles.set(2, -6, new TowerSlope("slope-floor-right"));
world.tiles.set(3, -6, new TowerSlope("slope-floor-left"));


world.player.hitbox.y -= 100;



Main.screen = new WorldScreen(world);
