import { Explosion } from "../../game-utilities/Explosion.mjs";
import { TileModifier } from "../TileModifier.mjs";
export class ExplosiveModifier extends TileModifier {
    onCollision(tile, collision, world, canvasIO) {
        const explosion = new Explosion(tile.hitbox.center());
        explosion.explode(world, canvasIO);
    }
    displayIcon() {
        // TODO
    }
    reset() { }
}
//# sourceMappingURL=ExplosiveModifier.mjs.map