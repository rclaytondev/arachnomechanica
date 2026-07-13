export class RoomPlaceholder {
    exits;
    room;
    generated = false;
    constructor(exits, room) {
        this.exits = new Set(exits);
        this.room = room;
    }
}
//# sourceMappingURL=RoomPlaceholder.mjs.map