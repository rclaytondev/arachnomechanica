export class LoadingManager {
	static onloadHandlers: (() => void)[] = [];

	static onload(callback: () => void) {
		LoadingManager.onloadHandlers.push(callback);
	}

	static loaded() {
		for(const handler of LoadingManager.onloadHandlers) {
			handler();
		}
	}
}
