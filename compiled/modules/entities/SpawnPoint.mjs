import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
export class SpawnPoint extends Entity {
    position;
    constructor(position) {
        super();
        this.position = position;
    }
    render() { return []; }
    display() { }
    update() { }
    boundingBox() {
        return Rectangle.square(this.position.x, this.position.y, 1);
    }
    copy() {
        return new SpawnPoint(this.position);
    }
    copyAndTranslate(amount) {
        return new SpawnPoint(this.position.add(amount));
    }
    reflect() {
        return this.copy();
    }
}
//# sourceMappingURL=SpawnPoint.mjs.map