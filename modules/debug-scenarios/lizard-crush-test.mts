import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { Main } from "../Main.mjs";
import { Gate } from "../entities/Gate.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";

const world = new World(false);

world.tiles.fillRect(Rectangle.fromDimensions(-2, 0, 2, 6), TowerTile.TOWER_TILE);
world.tiles.fillRect(Rectangle.fromDimensions(-2, 4, 5, 2), TowerTile.TOWER_TILE);
world.entities.add(Gate.atTile(new Vector(0, 2), "right", true));
world.entities.add(Gate.atTile(new Vector(-3, 2), "right", true));
world.entities.add(new Lizard(new Vector(-2.5 * WorldData.TILE_SIZE, 1 * WorldData.TILE_SIZE), "down", 300, 3));

Main.screen = new WorldScreen(world);
