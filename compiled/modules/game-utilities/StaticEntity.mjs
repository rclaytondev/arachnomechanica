export class StaticEntity {
}
export class StaticEntities {
    entitiesList = [];
    update(world, canvasIO) {
        for (const entity of this.entitiesList) {
            entity.update(world, canvasIO);
        }
    }
    render(renderer, world, camera) {
        for (const entity of this.entitiesList) {
            for (const renderable of entity.render(world, camera)) {
                renderer.renderables.push(renderable);
            }
        }
    }
    delete(entity) {
        this.entitiesList = this.entitiesList.filter(e => e !== entity);
    }
    add(entity) {
        this.entitiesList.push(entity);
    }
}
//# sourceMappingURL=StaticEntity.mjs.map