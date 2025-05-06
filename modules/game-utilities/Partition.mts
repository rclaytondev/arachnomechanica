type Node<T> = { value: T, parent: Node<T> | null, children: Set<Node<T>> };

export class Partition<T> {
	/* Implements partition operations efficiently using a disjoint-sets forest. */
	private nodes: Map<T, Node<T>>;
	numSets: number;
	private constructor(nodes: Map<T, Node<T>>, numSets: number) {
		this.nodes = nodes;
		this.numSets = numSets;
	}
	static empty<T>() {
		return new Partition<T>(new Map(), 0);
	}
	static fromSets<T>(sets: Iterable<Iterable<T>>) {
		const result = Partition.empty<T>();
		for(const iterable of sets) {
			const set = new Set(iterable);
			if(set.size !== 0) {
				const [first, ...others] = set;
				result.add(first);
				for(const value of others) {
					result.add(value);
					result.merge(first, value);
				}
			}
		}
		return result;
	}

	add(value: T) {
		/* Time complexity: O(1) */
		if(!this.nodes.has(value)) {
			this.numSets ++;
			this.nodes.set(value, { value: value, parent: null, children: new Set() });
		}
	}
	merge(value1: T, value2: T) {
		/* Time complexity: O(h), where h is the depth of the nodes. */
		const node1 = this.nodes.get(value1);
		const node2 = this.nodes.get(value2);
		if(!node1 || !node2) {
			return;
		}
		const root1 = this.getRoot(value1);
		const root2 = this.getRoot(value2);
		if(root1 !== root2) {
			this.numSets --;
			this.moveNode(root1, root2);
		}
	}
	has(value: T) {
		return this.nodes.has(value);
	}
	private getRoot(value: T) {
		/* Time complexity: O(h), where h is the depth of the node. */
		let node = this.nodes.get(value);
		if(!node) {
			throw new Error(`Cannot get representative of value ${value}: it was not in the partition.`);
		}
		const visitedNodes = [];
		while(node.parent !== null) {
			visitedNodes.push(node);
			node = node.parent;
		}
		for(const visitedNode of visitedNodes) {
			this.moveNode(visitedNode, node);
		}
		return node;
	}
	representative(value: T) {
		return this.getRoot(value).value;
	}
	delete(value: T) {
		/* Time complexity: O(w), where w is the number of children of the node. */
		const node = this.nodes.get(value);
		if(!node) { return; }

		if(node.parent) {
			for(const child of node.children) {
				this.moveNode(child, node.parent);
			}
			node.parent.children.delete(node);
		}
		else if(node.children.size !== 0) {
			const [first, ...others] = node.children;
			for(const child of others) {
				this.moveNode(child, first);
			}
			first.parent = null;
		}
		this.nodes.delete(value);
	}
	copy() {
		const result = Partition.empty<T>();
		for(const value of this.nodes.keys()) {
			result.add(value);
			const representative = this.representative(value);
			result.add(representative);
			result.merge(value, representative);
		}
		return result;
	}
	values() {
		return this.nodes.keys();
	}
	sets() {
		const nodesChecked = new Set<Node<T>>();
		const sets: Set<T>[] = [];
		const searchTree = (node: Node<T>) => {
			nodesChecked.add(node);
			sets[sets.length - 1].add(node.value);
			for(const child of node.children) {
				searchTree(child);
			}
		};
		for(const node of this.nodes.values()) {
			if(!nodesChecked.has(node)) {
				sets.push(new Set());
				searchTree(this.getRoot(node.value));
			}
		}
		return sets;
	}

	private moveNode(node: Node<T>, newParent: Node<T>) {
		node.parent?.children.delete(node);
		node.parent = newParent;
		newParent.children.add(node);
	}
}
