import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { TallCreature } from "../entities/TallCreature.mjs";
import { Main } from "../Main.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
const world = new World(false);
const creature = new TallCreature(new Vector(225, -150), 140, world);
creature.direction = "right";
world.entities.add(creature);
world.tiles.fillRect(Rectangle.fromDimensions(0, 0, 10, 10), TowerTile.TOWER_TILE);
world.tiles.fillRect(Rectangle.fromDimensions(5, 0, 10, 1), EmptyTile.EMPTY);
world.tiles.fillRect(Rectangle.fromDimensions(-1, -5, 1, 10), TowerTile.TOWER_TILE);
Main.screen = new WorldScreen(world);
//# sourceMappingURL=tall-creature-test.mjs.map