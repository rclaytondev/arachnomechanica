import { Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { ItemData } from "../../constants/GameData.mjs";
import { GameUtils } from "../../game-utilities/GameUtils.mjs";
import { TileModifier } from "../TileModifier.mjs";
export class MovingModifier extends TileModifier {
    displayIcon() {
        // TODO
    }
    update(tile) {
        this.movingCooldown--;
        if (this.direction !== "none") {
            tile.velocity.x = GameUtils.moveTowards(tile.velocity.x, (this.direction === "left" ? -1 : 1) * ItemData.TILE_MODIFIERS.MOVING.SPEED, ItemData.TILE_MODIFIERS.MOVING.ACCELERATION);
        }
    }
    direction = "none";
    movingCooldown = 0;
    onCollision(tile, collision) {
        const direction = collision.directionOf(tile);
        if (this.direction === direction) {
            this.direction = "none";
            this.movingCooldown = ItemData.TILE_MODIFIERS.MOVING.COOLDOWN;
        }
        else if (Directions.isHorizontal(direction) && this.movingCooldown < 0) {
            this.direction = Directions.opposite[direction];
        }
    }
    reset() {
        this.direction = "none";
        this.movingCooldown = -1;
    }
}
//# sourceMappingURL=MovingModifier.mjs.map