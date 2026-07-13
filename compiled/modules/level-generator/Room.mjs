import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { RoomData } from "../constants/GameData.mjs";
import { GateState } from "./GateState.mjs";
import { Gate } from "../entities/Gate.mjs";
import { Portal } from "../entities/Portal.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { Rooms, ROOMS } from "../constants/Rooms.mjs";
import { SpawnPoint } from "../entities/SpawnPoint.mjs";
import { HealthPickup } from "../entities/HealthPickup.mjs";
import { GenUtils } from "../../utils-ts/modules/core-extensions/GenUtils.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { WorldPart } from "../world-generator/WorldPart.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Entities } from "../world/Entities.mjs";
export class Room {
    originalName;
    name;
    canSpawnWithExits;
    exitTiles;
    traversability;
    worldPart;
    static parseExitTiles(exitTilesData) {
        const exitTiles = new Grid("none");
        for (const { x, y, direction } of exitTilesData) {
            exitTiles.set(x, y, direction);
        }
        return exitTiles;
    }
    static parse(name, tilesData, exitTilesData, entitiesData = [], canSpawnWithExits, traversabilityData) {
        const worldPart = WorldPart.parse(tilesData, entitiesData);
        const exitTiles = Room.parseExitTiles(exitTilesData);
        const traversability = GateState.deduplicateTraversability(traversabilityData ?? RoomData.NO_GATE_TRAVERSABILITY);
        return new Room(name, name, worldPart, exitTiles, canSpawnWithExits, traversability);
    }
    constructor(name, originalName, worldPart, exitTiles, canSpawnWithExits, traversability) {
        this.name = name;
        this.originalName = originalName;
        this.worldPart = worldPart;
        this.exitTiles = exitTiles;
        this.canSpawnWithExits = canSpawnWithExits;
        this.traversability = traversability;
    }
    hasPortal() {
        return [...this.worldPart.entities].some(e => e instanceof Portal);
    }
    add(tileOffset, world, exits) {
        this.worldPart.add(world, tileOffset);
        for (const [direction, position] of this.exitTiles.entries()) {
            if (direction !== "none" && !exits.has(direction)) {
                world.addOriginalTile(position.add(tileOffset), TowerTile.TOWER_TILE);
                Gate.deleteGateAt(position.add(tileOffset), world);
            }
        }
    }
    getExitCoordinates(direction, coordinate) {
        return [...this.exitTiles.positions()].filter(p => this.exitTiles.get(p) === direction).map(p => p[coordinate]);
    }
    reflect() {
        const entities = new Entities([...this.worldPart.entities].map(e => e.reflect()));
        const tiles = new Tiles();
        for (const [tile, position] of this.worldPart.tiles.entries()) {
            const reflectedX = RoomData.SIZE - position.x - 1; // REFACTOR: extract method Grid.reflectX
            tiles.set(reflectedX, position.y, tile.reflect());
        }
        const exitTiles = new Grid("none");
        for (const [exitTile, position] of this.exitTiles.entries()) {
            if (exitTile === "none") {
                continue;
            }
            const reflectedX = RoomData.SIZE - position.x - 1;
            exitTiles.set(reflectedX, position.y, Directions.reflectX[exitTile]);
        }
        const worldPart = new WorldPart(tiles, entities);
        const reflectedName = `${this.name}-reflected`;
        const canSpawnWithExits = (exits) => this.canSpawnWithExits(new Set([...exits].map(e => Directions.reflectX[e])));
        const traversability = this.traversability.map(({ start, end }) => ({
            start: new GateState(null, Directions.reflectX[start.exit], start.toggled),
            end: new GateState(null, Directions.reflectX[end.exit], end.toggled),
        }));
        return new Room(this.name, reflectedName, worldPart, exitTiles, canSpawnWithExits, traversability);
    }
    copy() {
        return new Room(this.name, this.originalName, new WorldPart(this.worldPart.tiles.copy(), new Entities([...this.worldPart.entities].map(e => e.copy()))), this.exitTiles.map(v => v), this.canSpawnWithExits, this.traversability.map(({ start, end }) => ({ start: start.copy(), end: end.copy() })));
    }
    equals(room) {
        return this.worldPart.tiles.equals(room.worldPart.tiles, (t1, t2) => t1.equals(t2));
    }
    toggleGates() {
        const copy = this.copy();
        copy.name += "-toggled";
        for (const entity of copy.worldPart.entities) {
            if (entity instanceof Gate) {
                entity.toggled = !entity.toggled;
            }
        }
        copy.traversability = copy.traversability.map(({ start, end }) => ({
            start: new GateState(start.position, start.exit, !start.toggled),
            end: new GateState(end.position, end.exit, !end.toggled),
        }));
        return copy;
    }
    isOrdinaryRoom() {
        return ![...this.worldPart.entities].some(e => e instanceof Portal || e instanceof HealthPickup || e instanceof SpawnPoint);
    }
    static gatelessPath(exit1, exit2) {
        return [
            { start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
            { start: new GateState(null, exit1, true), end: new GateState(null, exit2, true) },
            { start: new GateState(null, exit2, false), end: new GateState(null, exit1, false) },
            { start: new GateState(null, exit2, true), end: new GateState(null, exit1, true) },
        ];
    }
    static onewayGatelessPath(exit1, exit2) {
        return [
            { start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
            { start: new GateState(null, exit1, true), end: new GateState(null, exit2, true) },
        ];
    }
    static gatePath(exit1, exit2, open) {
        if (exit1 === exit2) {
            return [{ start: new GateState(null, exit1, !open), end: new GateState(null, exit2, open) }];
        }
        return [
            { start: new GateState(null, exit1, !open), end: new GateState(null, exit2, open) },
            { start: new GateState(null, exit2, !open), end: new GateState(null, exit1, open) },
        ];
    }
    static doubleGatePath(exit1, exit2) {
        return [
            { start: new GateState(null, exit1, false), end: new GateState(null, exit2, false) },
            { start: new GateState(null, exit2, true), end: new GateState(null, exit1, true) },
        ];
    }
    static getTraversability(connections) {
        const checkPair = (i, j) => {
            const composite = { start: connections[i].start, end: connections[j].end };
            if (connections[i].end.equals(connections[j].start) &&
                !composite.start.equals(composite.end) &&
                !connections.some(c => c.start.equals(composite.start) && c.end.equals(composite.end))) {
                connections.push(composite);
            }
        };
        for (let max = 0; max < connections.length; max++) {
            for (let i = 0; i < max; i++) {
                checkPair(i, max);
                checkPair(max, i);
            }
        }
        return connections;
    }
    generatability = null;
    getGeneratability() {
        if (this.generatability) {
            return this.generatability;
        }
        return this.generatability = ([...GenUtils.subsets(new Set(Directions.DIRECTIONS))]
            .filter(s => this.canSpawnWithExits(s))
            .length) / (2 ** 4);
    }
    static connectivity(traversability, exits) {
        let total = 0;
        for (const exit of exits) {
            for (const toggled of [true, false]) {
                const reachableStates = traversability.filter(({ start }) => (start.exit === exit && start.toggled === toggled));
                const reachableDirections = new Set(reachableStates.map(s => s.end.exit).filter(s => exits.has(s)));
                reachableDirections.delete(exit);
                total += reachableDirections.size;
                if (reachableStates.some(s => s.end.exit === exit && s.end.toggled === !toggled)) {
                    total++;
                }
            }
        }
        return total / (2 * exits.size * exits.size);
    }
    static filterTraversability(traversability, exits) {
        return traversability.filter(({ start, end }) => exits.has(start.exit) && exits.has(end.exit));
    }
    static addRoomVariants() {
        for (const room of [...ROOMS]) {
            const variants = [room];
            for (const variant of [room.reflect(), room.toggleGates(), room.reflect().toggleGates()]) {
                if (!variants.some(r => r.equals(variant))) {
                    variants.push(variant);
                    ROOMS.push(variant);
                }
            }
        }
    }
}
LoadingManager.onload(() => {
    Rooms.initialize();
    Room.addRoomVariants();
});
//# sourceMappingURL=Room.mjs.map