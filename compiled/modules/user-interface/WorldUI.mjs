import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldUIData } from "../constants/GameData.mjs";
export class WorldUI {
    display(world, canvasIO) {
        this.displayHealth(world.player.health, canvasIO);
        this.displayItems(world.player.equippedItems, canvasIO);
    }
    displayHealth(amount, canvasIO) {
        const center = new Vector(WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE / 2, WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE / 2);
        canvasIO.ctx.fillStyle = WorldUIData.HEALTH_COLOR;
        canvasIO.fillRegularPoly(center, WorldUIData.HEALTH_BOX_SIZE / 2, 6, 0);
        canvasIO.ctx.fillStyle = "black";
        canvasIO.ctx.font = WorldUIData.HEALTH_TEXT_FONT;
        canvasIO.ctx.textAlign = "center";
        canvasIO.ctx.textBaseline = "middle";
        canvasIO.ctx.fillText(amount.toString(), center.x, center.y);
    }
    displayItems(items, canvasIO) {
        for (const [index, item] of items.entries()) {
            const x = WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE + WorldUIData.ITEM_BOX_MARGIN * (index + 1) + WorldUIData.ITEM_BOX_SIZE * index;
            const y = WorldUIData.HEALTH_BOX_MARGIN;
            canvasIO.ctx.fillStyle = WorldUIData.ITEM_BOX_COLOR;
            canvasIO.fillSquare(x, y, WorldUIData.ITEM_BOX_SIZE);
            if (item) {
                const rect = Rectangle.fromDimensions(x, y, WorldUIData.ITEM_BOX_SIZE, WorldUIData.ITEM_BOX_SIZE);
                item.displayIcon(canvasIO, rect);
            }
        }
    }
}
//# sourceMappingURL=WorldUI.mjs.map