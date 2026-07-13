export class Tree {
    static *leaves(root, getChildren) {
        const childrenGenerator = function* (node) { yield* getChildren(node); };
        const stack = [{ value: root, generator: childrenGenerator(root), hasChildren: false }];
        while (stack.length !== 0) {
            const currentItem = stack[stack.length - 1];
            const nextChild = currentItem.generator.next();
            if (nextChild.done) {
                stack.pop();
                if (!currentItem.hasChildren) {
                    yield currentItem.value;
                }
            }
            else {
                currentItem.hasChildren = true;
                stack.push({ value: nextChild.value, generator: childrenGenerator(nextChild.value), hasChildren: false });
            }
        }
    }
    static *nodesAndAncestors(root, getChildren) {
        const childrenGenerator = function* (node) { yield* getChildren(node); };
        const stack = [{ value: root, generator: childrenGenerator(root), ancestors: [root], yielded: false }];
        while (stack.length !== 0) {
            const currentItem = stack[stack.length - 1];
            if (!currentItem.yielded) {
                currentItem.yielded = true;
                yield { node: currentItem.value, ancestors: currentItem.ancestors };
            }
            const nextChild = currentItem.generator.next();
            if (nextChild.done) {
                stack.pop();
            }
            else {
                stack.push({
                    value: nextChild.value,
                    generator: childrenGenerator(nextChild.value),
                    ancestors: [...currentItem.ancestors, nextChild.value],
                    yielded: false,
                });
            }
        }
    }
    static *nodes(root, getChildren) {
        for (const { node } of Tree.nodesAndAncestors(root, getChildren)) {
            yield node;
        }
    }
}
//# sourceMappingURL=Tree.mjs.map