import { EmptyTile } from "./EmptyTile.mjs";
import { Platform } from "./Platform.mjs";
import { TowerSlope } from "./TowerSlope.mjs";
import { TowerTile } from "./TowerTile.mjs";

export const TILE_TYPES = [
	EmptyTile.EMPTY,
	TowerTile.TOWER_TILE,
	TowerSlope.SLOPE_UP_LEFT,
	TowerSlope.SLOPE_UP_RIGHT,
	TowerSlope.SLOPE_DOWN_LEFT,
	TowerSlope.SLOPE_DOWN_RIGHT,
	Platform.PLATFORM,
];
