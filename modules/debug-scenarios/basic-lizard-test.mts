import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { Main } from "../Main.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 10, 10), BasicTile.BASIC_TILE);
world.entities.add(new Lizard(new Vector(3.5 * WorldData.TILE_SIZE, -5 * WorldData.TILE_SIZE), "down", 300, 3));
world.tiles.set(3, -1, new SlopeTile("slope-floor-left"));

Main.screen = new WorldScreen(world);
