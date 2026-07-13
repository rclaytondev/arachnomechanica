export class HashSet {
    values;
    hashFunction;
    constructor(values = [], hashFunction = (x => `${x}`)) {
        this.values = new Map();
        this.hashFunction = hashFunction;
        for (const value of values) {
            this.add(value);
        }
    }
    has(value) {
        return this.values.has(this.hashFunction(value));
    }
    add(value) {
        const hash = this.hashFunction(value);
        if (!this.values.has(hash)) {
            this.values.set(hash, value);
        }
    }
    delete(value) {
        return this.values.delete(this.hashFunction(value));
    }
    get size() {
        return this.values.size;
    }
    *[Symbol.iterator]() {
        yield* this.values.values();
    }
    filter(callback) {
        return new HashSet([...this].filter(callback));
    }
    toString() {
        return `{${[...this.values.values()].map(v => `${v}`).sort().join(", ")}}`;
    }
    map(callback, newHashFunction) {
        return new HashSet([...this.values.values()].map(callback), newHashFunction);
    }
    static union(...sets) {
        const result = new HashSet([], sets[0]?.hashFunction ?? (x => `${x}`));
        for (const set of sets) {
            for (const value of set.values.values()) {
                result.add(value);
            }
        }
        return result;
    }
    difference(set) {
        const result = new HashSet();
        for (const [hash, value] of this.values.entries()) {
            if (!set.values.has(hash)) {
                result.add(value);
            }
        }
        return result;
    }
    equals(set) {
        return this.toString() === set.toString();
    }
    copy() {
        return this.map(s => s, this.hashFunction);
    }
}
//# sourceMappingURL=HashSet.mjs.map