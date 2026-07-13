export class Utils {
    static binarySearch(min, max, increasingFunction, multiZeroMode = "first", noZeroMode = (multiZeroMode === "first") ? "before" : "after") {
        while (max - min > 1) {
            const mid = ((typeof min === "bigint" || typeof max === "bigint")
                ? (BigInt(min) + BigInt(max)) / 2n
                : Math.floor((min + max) / 2));
            const result = increasingFunction(mid);
            if (result < 0) {
                min = mid;
            }
            else if (result > 0) {
                max = mid;
            }
            else {
                if (multiZeroMode === "first") {
                    max = mid;
                }
                else {
                    min = mid;
                }
            }
        }
        if (max === min) {
            return min;
        }
        const minValue = increasingFunction(min);
        const maxValue = increasingFunction(max);
        if (minValue > 0 && maxValue > 0) {
            return min;
        }
        if (minValue < 0 && maxValue < 0) {
            return max;
        }
        if (minValue == 0 && maxValue != 0) {
            return min;
        }
        if (minValue != 0 && maxValue == 0) {
            return max;
        }
        if (minValue == 0 && maxValue == 0) {
            return multiZeroMode === "first" ? min : max;
        }
        return noZeroMode === "before" ? min : max;
    }
    static remainingValidItems(items, index, allowRepetition, orderMode) {
        if (orderMode === "tuples") {
            if (allowRepetition === "all-distinct") {
                return items.filter(item => item !== items[index]);
            }
            else if (allowRepetition === "allow-duplicates") {
                return items.filter((item, i) => i !== index);
            }
            else {
                return items;
            }
        }
        else {
            if (allowRepetition === "all-distinct") {
                return items.slice(index + 1).filter(item => item !== items[index]);
            }
            else if (allowRepetition === "allow-duplicates") {
                return items.slice(index + 1);
            }
            else {
                return items.slice(index);
            }
        }
    }
    static *combinations(arg0, arg1, arg2, arg3, arg4) {
        if (typeof arg2 === "number") {
            const [items, minSize, maxSize, allowRepetition, orderMode] = [[...arg0], arg1, arg2, arg3, arg4];
            for (let size = minSize; size <= maxSize; size++) {
                yield* Utils.combinations(items, size, allowRepetition, orderMode);
            }
        }
        else {
            const [items, size, allowRepetition, orderMode] = [[...arg0], arg1, arg2, arg3];
            if (size === 1) {
                const uniqueItems = [...new Set(items)];
                for (const item of uniqueItems) {
                    yield [item];
                }
                return;
            }
            for (const [index, firstItem] of items.entries()) {
                if (items.slice(0, index).includes(firstItem)) {
                    continue;
                }
                const remainingItems = Utils.remainingValidItems(items, index, allowRepetition, orderMode);
                for (const tupleOrSet of Utils.combinations(remainingItems, size - 1, allowRepetition, orderMode)) {
                    yield [firstItem, ...tupleOrSet];
                }
            }
        }
    }
    static memoize(func, standardizeArgs = (...args) => args) {
        const cachedResults = new Map();
        return function (...args) {
            args = standardizeArgs(...args);
            const argsString = args.join(", ");
            if (cachedResults.has(argsString)) {
                return cachedResults.get(argsString);
            }
            const result = func.apply(this, args);
            cachedResults.set(argsString, result);
            return result;
        };
    }
    static injections(domain, range) {
        if ([...domain].length === 0) {
            return [new Map()];
        }
        const [first, ...others] = domain;
        const result = [];
        for (const image of range) {
            for (const injection of Utils.injections(others, [...range].filter(v => v !== image))) {
                const newInjection = new Map(injection);
                newInjection.set(first, image);
                result.push(newInjection);
            }
        }
        return result;
    }
}
//# sourceMappingURL=Utils.mjs.map