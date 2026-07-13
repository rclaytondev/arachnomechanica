export class SetUtils {
    static toggleElement(set, element) {
        if (set.has(element)) {
            set.delete(element);
        }
        else {
            set.add(element);
        }
    }
    static union(...sets) {
        const result = new Set();
        for (const set of sets) {
            for (const item of set) {
                result.add(item);
            }
        }
        return result;
    }
    static intersection(iterable1, iterable2) {
        const set2 = iterable2 instanceof Set ? iterable2 : new Set(iterable2);
        const result = new Set();
        for (const value of iterable1) {
            if (set2.has(value)) {
                result.add(value);
            }
        }
        return result;
    }
    static difference(iterable1, iterable2) {
        const set2 = iterable2 instanceof Set ? iterable2 : new Set(iterable2);
        const result = new Set();
        for (const value of iterable1) {
            if (!set2.has(value)) {
                result.add(value);
            }
        }
        return result;
    }
    static equals(iterable1, iterable2) {
        const set1 = iterable1 instanceof Set ? iterable1 : new Set(iterable1);
        const set2 = iterable2 instanceof Set ? iterable2 : new Set(iterable2);
        if (set1.size !== set2.size) {
            return false;
        }
        for (const value of set1) {
            if (!set2.has(value)) {
                return false;
            }
        }
        return true;
    }
    static partitions(values, numSets) {
        const size = [...values].length;
        if (typeof numSets !== "number") {
            let result = [];
            for (let sets = 0; sets <= size; sets++) {
                result = result.concat(SetUtils.partitions(values, sets));
            }
            return result;
        }
        if (numSets === 0) {
            const EMPTY_PARTITION = new Set([]);
            return size === 0 ? [EMPTY_PARTITION] : [];
        }
        else if (size === 0) {
            return [];
        }
        const [first, ...others] = values;
        const result = [];
        for (const partition of SetUtils.partitions(others, numSets - 1)) {
            result.push(new Set([new Set([first]), ...partition]));
        }
        for (const partition of SetUtils.partitions(others, numSets)) {
            const partitionArray = [...partition];
            for (let i = 0; i < partitionArray.length; i++) {
                const setsBefore = partitionArray.slice(0, i).map(s => new Set(s));
                const set = new Set(partitionArray[i]);
                const setsAfter = partitionArray.slice(i + 1).map(s => new Set(s));
                set.add(first);
                result.push(new Set([...setsBefore, set, ...setsAfter]));
            }
        }
        return result;
    }
    static areDisjoint(iterable1, iterable2) {
        const set1 = new Set(iterable1);
        for (const value of iterable2) {
            if (set1.has(value)) {
                return false;
            }
        }
        return true;
    }
    static isSubset(iterable1, iterable2) {
        const set2 = iterable2 instanceof Set ? iterable2 : new Set(iterable2);
        for (const value of iterable1) {
            if (!set2.has(value)) {
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=SetUtils.mjs.map