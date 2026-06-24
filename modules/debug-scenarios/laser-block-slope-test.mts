import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Main } from "../Main.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { LaserBlock } from "../entities/LaserBlock.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";

const world = new World(false);

world.tiles.fillRect(new Rectangle(-2, 0, 10, 6), TowerTile.TOWER_TILE);
world.tiles.fillRect(new Rectangle(-1, 1, 8, 4), EmptyTile.EMPTY);
const laserBlock = LaserBlock.generate(new Vector(3, -1));
world.entities.add(laserBlock);
laserBlock.lasers = 1;
laserBlock.startAngle = Math.PI;
world.tiles.set(new Vector(2, -1), new TowerSlope("slope-ceiling-right"));
world.tiles.set(new Vector(3, -2), new TowerSlope("slope-ceiling-left"));

Main.screen = new WorldScreen(world);
