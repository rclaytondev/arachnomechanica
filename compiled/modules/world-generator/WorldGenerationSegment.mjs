export class WorldGenerationSegment {
    update(world) {
        if (this.shouldGenerate(world)) {
            this.generate(world);
        }
    }
}
//# sourceMappingURL=WorldGenerationSegment.mjs.map