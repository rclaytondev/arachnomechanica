export class GenUtils {
    static *cartesianProduct(...sets) {
        if (sets.length > 0) {
            for (const firstItem of sets[0]) {
                const otherSets = sets.slice(1);
                for (const tuple of GenUtils.cartesianProduct(...otherSets)) {
                    yield [firstItem, ...tuple];
                }
            }
        }
        else {
            yield [];
        }
    }
    static *cartesianPower(set, power) {
        const combinations = new Array(power).fill(null).map(_ => [...set]);
        yield* GenUtils.cartesianProduct(...combinations);
    }
    static *subsets(items, size) {
        if (!Array.isArray(items)) {
            items = [...items];
        }
        if (typeof size !== "number") {
            for (let subsetSize = 0; subsetSize <= items.length; subsetSize++) {
                yield* GenUtils.subsets(items, subsetSize);
            }
            return;
        }
        if (size < 0) {
            return;
        }
        if (size === 0) {
            yield new Set([]);
            return;
        }
        for (const [firstIndex, firstItem] of items.slice(0, items.length - (size - 1)).entries()) {
            const after = items.slice(firstIndex + 1);
            for (const subset of GenUtils.subsets(after, size - 1)) {
                yield new Set([firstItem, ...subset]);
            }
        }
    }
    static *slice(items, start, end = Infinity) {
        let index = 0;
        for (const item of items) {
            if (index >= start && index < end) {
                yield item;
            }
            index++;
            if (index >= end) {
                return;
            }
        }
    }
}
//# sourceMappingURL=GenUtils.mjs.map