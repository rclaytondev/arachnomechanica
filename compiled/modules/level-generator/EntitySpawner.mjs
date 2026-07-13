import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { Gate } from "../entities/Gate.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Portal } from "../entities/Portal.mjs";
export class EntitySpawner {
    static entityTypes = [];
    static mandatoryEntityTypes = [];
    static registerEntityType(spawnAll) {
        EntitySpawner.entityTypes.push(spawnAll);
    }
    static registerMandatoryEntityType(spawnAll) {
        EntitySpawner.mandatoryEntityTypes.push(spawnAll);
    }
    static spawnAllEntities(tileRegion, safeRegion, world) {
        const optionalEntities = GameUtils.randomPermutation([...EntitySpawner.entityTypes]).slice(0, 2);
        for (const spawnAll of [...optionalEntities, ...EntitySpawner.mandatoryEntityTypes]) {
            spawnAll(tileRegion, safeRegion, world);
        }
    }
    static spawnEntities(amount, evenness, tileRegion, requirements, spawn, safeRegion, world) {
        const safePositions = new Set(safeRegion.squares().map(s => s.toString()));
        const positions = tileRegion.squares().filter(s => !safePositions.has(s.toString()));
        let possiblePositions = positions.filter(position => requirements.every(r => r(position, world)));
        const spawnedPositions = [];
        while (spawnedPositions.length < amount && possiblePositions.length > 0) {
            const [position] = GameUtils.randomEvenlySpaced({
                generate: () => ArrayUtils.randomItem(possiblePositions),
                metric: Vector.dist,
                amount: 1,
                trials: evenness,
                previousPoints: spawnedPositions,
            });
            const spawned = spawn(position, world);
            if (spawned) {
                spawnedPositions.push(position);
            }
            const adjacent = [position, ...position.adjacentVectors()];
            possiblePositions = possiblePositions.filter(p => p !== position && !adjacent.some(a => a.equals(p)));
        }
    }
    static spawnRequirements = {
        replaceSolid: (position, world) => {
            const tile = world.tiles.get(position);
            return tile instanceof BasicTile;
        },
        replaceEmpty: (position, world) => world.tiles.get(position) === EmptyTile.EMPTY,
        solidAdjacent: (position, world) => Directions.DIRECTIONS.some(direction => {
            const tile = world.tiles.get(position.add(Vector.unit(direction)));
            return tile instanceof BasicTile;
        }),
        atLeast2Empty: (position, world) => (Directions.DIRECTIONS.filter(d => world.tiles.get(position.add(Vector.unit(d))) === EmptyTile.EMPTY).length >= 2),
        noAdjacentGates: (position, world) => (!position.adjacentVectors().some(v => Gate.isGateAt(v, world))),
        atLeastLine3Empty: (position, world) => {
            for (const direction of Directions.DIRECTIONS) {
                const firstTile = world.tiles.get(position.add(Vector.unit(direction)));
                if (firstTile instanceof BasicTile) {
                    continue;
                }
                for (let i = 2; i <= 3; i++) {
                    if (world.tiles.get(position.add(Vector.unit(direction).multiply(i))) !== EmptyTile.EMPTY) {
                        return false;
                    }
                }
            }
            return true;
        },
        atLeast3RectEmpty: (position, world) => {
            for (const direction of Directions.DIRECTIONS) {
                const directionVector = Vector.unit(direction);
                const perpendicular1 = Vector.unit(Directions.rotateClockwise[direction]);
                const perpendicular2 = Vector.unit(Directions.rotateCounterclockwise[direction]);
                const firstTile = world.tiles.get(position.add(directionVector));
                if (firstTile instanceof BasicTile) {
                    continue;
                }
                for (let i = 2; i <= 3; i++) {
                    if (world.tiles.get(position.add(directionVector.multiply(i))) !== EmptyTile.EMPTY ||
                        world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular1)) !== EmptyTile.EMPTY ||
                        world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular2)) !== EmptyTile.EMPTY) {
                        return false;
                    }
                }
            }
            return true;
        },
        notOnFloor: (position, world) => {
            return world.tiles.get(position.add(0, -1)) !== EmptyTile.EMPTY;
        },
        leftOrRightEmpty: (position, world) => (world.tiles.get(position.add(-1, 0)) === EmptyTile.EMPTY ||
            world.tiles.get(position.add(1, 0)) === EmptyTile.EMPTY),
        solidBelow: (position, world) => world.tiles.get(position.add(0, 1)) instanceof BasicTile,
        notOnPortal: (position, world) => {
            const tileSquare = Tiles.getTileSquare(position);
            const entities = [...world.entities.possiblyIntersecting(tileSquare)];
            return !entities.some(e => e instanceof Portal && e.boundingBox().intersects(tileSquare));
        },
    };
}
//# sourceMappingURL=EntitySpawner.mjs.map