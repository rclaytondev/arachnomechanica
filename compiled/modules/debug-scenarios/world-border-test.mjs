import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldBorder } from "../entities/WorldBorder.mjs";
import { Main } from "../Main.mjs";
import { World } from "../world/World.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
const world = new World(false);
world.entities.add(new WorldBorder(Rectangle.fromBounds(-Infinity, Infinity, 0, 100)));
Main.screen = new WorldScreen(world);
//# sourceMappingURL=world-border-test.mjs.map