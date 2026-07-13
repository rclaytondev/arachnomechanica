export class MapUtils {
    static equals(map1, map2, equals) {
        if (map1.size !== map2.size) {
            return false;
        }
        for (const [key, value] of map1) {
            if (!map2.has(key) ||
                (!equals && map1.get(key) !== map2.get(key)) ||
                (equals && !equals(value, map2.get(key)))) {
                return false;
            }
        }
        return true;
    }
    static filter(map, callback) {
        const result = new Map();
        for (const [key, value] of map.entries()) {
            if (callback(key, value)) {
                result.set(key, value);
            }
        }
        return result;
    }
    static groupBy(items, callback) {
        const groups = new Map();
        for (const value of items) {
            const output = callback(value);
            const group = groups.get(output);
            if (group) {
                group.push(value);
            }
            else {
                groups.set(output, [value]);
            }
        }
        return groups;
    }
}
//# sourceMappingURL=MapUtils.mjs.map