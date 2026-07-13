export class VisualEffects {
    effectsList = new Set();
    update() {
        for (const effect of this.effectsList) {
            effect.update(this);
        }
    }
    render(renderer) {
        for (const effect of this.effectsList) {
            renderer.renderables.push(...effect.render());
        }
    }
}
//# sourceMappingURL=VisualEffects.mjs.map