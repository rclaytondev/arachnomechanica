export class LoadingManager {
    static onloadHandlers = [];
    static onload(callback) {
        LoadingManager.onloadHandlers.push(callback);
    }
    static loaded() {
        for (const handler of LoadingManager.onloadHandlers) {
            handler();
        }
    }
}
//# sourceMappingURL=LoadingManager.mjs.map