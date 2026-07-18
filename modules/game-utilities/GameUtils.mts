import { HashSet } from "../../utils-ts/modules/HashSet.mjs";

export class GameUtils {
	static frameCount = 0;

	static reachableNodes<T>(startNode: T, neighbors: (node: T) => T[], hashFunction: (value: T) => string) {
		const visited = new HashSet<T>([startNode], hashFunction);
		const boundary = [startNode];
		while(boundary.length !== 0) {
			const node = boundary.pop()!;
			for(const neighbor of neighbors(node)) {
				if(!visited.has(neighbor)) {
					boundary.push(neighbor);
				}
				visited.add(neighbor);
			}
			visited.add(node);
		}
		return [...visited];
	}
}
