export class Backgrounds {
    backgroundsList;
    constructor(backgroundsList) {
        this.backgroundsList = backgroundsList;
    }
    display(canvasIO, camera) {
        for (const background of this.backgroundsList.sort((a, b) => a.zIndex - b.zIndex)) {
            background.display(canvasIO, camera);
        }
    }
}
//# sourceMappingURL=Backgrounds.mjs.map