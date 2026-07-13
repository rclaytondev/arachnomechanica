import { Utils } from "../Utils.mjs";
export class ArrayUtils {
    static randomItem(items) {
        if (items.length === 0) {
            throw new Error("Cannot choose a random index from an empty array.");
        }
        const index = Math.floor(Math.random() * items.length);
        return items[index];
    }
    static randomIndex(items) {
        if (items.length === 0) {
            throw new Error("Cannot choose a random item from an empty array.");
        }
        const index = Math.floor(Math.random() * items.length);
        return index;
    }
    static last(items) {
        return items[items.length - 1];
    }
    static range(min, max, startMode = "inclusive", endMode = "inclusive", step = 1) {
        [min, max] = [Math.min(min, max), Math.max(min, max)];
        step = Math.abs(step);
        if (step === 0) {
            throw new Error("Cannot create a range with a step of 0.");
        }
        const result = [];
        const startValue = (startMode === "inclusive") ? min : min + step;
        for (let value = startValue; (value < max && endMode === "exclusive") || (value <= max && endMode === "inclusive"); value += step) {
            result.push(value);
        }
        return result;
    }
    static binaryIndexOf(value, sortedArray, mode) {
        return Utils.binarySearch(0, sortedArray.length - 1, i => sortedArray[i] - value, mode);
    }
    static equals(array1, array2, equals) {
        if (array1.length !== array2.length) {
            return false;
        }
        if (equals) {
            return array1.every((v, i) => equals(v, array2[i]));
        }
        return array1.every((v, i) => v === array2[i]);
    }
    static minEntry(items, callback) {
        let minEntry = [0, items[0], callback ? callback(items[0], 0) : items[0]];
        for (let i = 1; i < items.length; i++) {
            const output = callback ? callback(items[i], i) : items[i];
            if (output < minEntry[2]) {
                minEntry = [i, items[i], output];
            }
        }
        return minEntry;
    }
    static maxEntry(items, callback) {
        let minEntry = [0, items[0], callback ? callback(items[0], 0) : items[0]];
        for (let i = 1; i < items.length; i++) {
            const output = callback ? callback(items[i], i) : items[i];
            if (output > minEntry[2]) {
                minEntry = [i, items[i], output];
            }
        }
        return minEntry;
    }
    static minIndex(items, callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ArrayUtils.minEntry(items, callback)[0];
    }
    static minValue(items, callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ArrayUtils.minEntry(items, callback)[1];
    }
    static minOutput(items, callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ArrayUtils.minEntry(items, callback)[2];
    }
    static maxIndex(items, callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ArrayUtils.maxEntry(items, callback)[0];
    }
    static maxValue(items, callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ArrayUtils.maxEntry(items, callback)[1];
    }
    static maxOutput(items, callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ArrayUtils.maxEntry(items, callback)[2];
    }
}
//# sourceMappingURL=ArrayUtils.mjs.map