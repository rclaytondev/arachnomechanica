import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { RoomData, WorldData } from "../constants/GameData.mjs";
import { Portal } from "../entities/Portal.mjs";
import { SolidTile } from "../tiles/SolidTile.mjs";
import { Slope, Tile, World } from "../World";

export abstract class Room {
	name: string;
	tiles: Grid<Tile>;
	canSpawnWithExits: ((exits: Direction[]) => boolean) | ((exits: Diagonal[]) => boolean);
	exitTiles: Grid<Direction | Diagonal | "none">;
	weight: number;
	entities: Portal[];
	readonly width: number;
	readonly height: number;

	constructor(name: string, tiles: { x: number, y: number, type: Tile | "solid" | Slope }[] | Grid<Tile>, exitTiles: { x: number, y: number, direction: Direction }[] | Grid<Direction | "none">, entities: Portal[] = [], canSpawnWithExits: (exits: Direction[]) => boolean, width: number, height: number, weight: number = 1) {
		this.name = name;
		if(tiles instanceof Grid) {
			this.tiles = tiles;
		}
		else {
			this.tiles = new Grid("empty");
			for(const { x, y, type } of tiles) {
				const tile = (type === "solid" || World.isSlope(type as string)) ? new SolidTile(type as "solid" | Slope, "tower") : type;
				this.tiles.set(x, y, tile as Tile);
			}
		}
		if(exitTiles instanceof Grid) {
			this.exitTiles = exitTiles;
		}
		else {
			this.exitTiles = new Grid("none");
			for(const { x, y, direction } of exitTiles) {
				this.exitTiles.set(x, y, direction);
			}
		}
		this.canSpawnWithExits = canSpawnWithExits;
		this.weight = weight;
		this.width = width;
		this.height = height;
		this.entities = entities;
	}

	add(position: Vector, world: World, exits: Direction[]) {
		for(let x = 0; x < this.width; x ++) {
			for(let y = 0; y < this.height; y ++) {
				const tile = this.tiles.get(x, y);
				const tileCopy = (typeof tile === "string") ? tile : tile.copy();
				const worldPosition = position.add(x, y);
				world.addTile(worldPosition, tileCopy);

				const direction = this.exitTiles.get(x, y);
				if(direction !== "none" && !(exits as unknown[]).includes(direction)) {
					world.addTile(worldPosition, new SolidTile("solid", "tower"));
				}
			}
		}
		for(const entity of this.entities) {
			world.entities.push(entity.translate(position.multiply(WorldData.TILE_SIZE)));
		}
	}

	getExitCoordinates(direction: Direction, coordinate: "x" | "y") {
		return [...this.exitTiles.positions()].filter(p => this.exitTiles.get(p) === direction).map(p => p[coordinate]);
	}
	
	reflectTiles(): [Grid<Tile>, Grid<Direction | Diagonal | "none">] {
		const tiles = new Grid<Tile>("empty");
		const exitTiles = new Grid<Direction | Diagonal | "none">("none");
		for(let x = 0; x < RoomData.SIZE; x ++) {
			for(let y = 0; y < RoomData.SIZE; y ++) {
				const reflectedX = RoomData.SIZE - x - 1;
				const tile = this.tiles.get(x, y);
				tiles.set(reflectedX, y, World.reflectTile(tile));

				const exitTile = this.exitTiles.get(x, y);
				if(exitTile !== "none") {
					exitTiles.set(reflectedX, y, Directions.reflectX[exitTile]);
				}
			}
		}
		return [tiles, exitTiles];
	}
}
