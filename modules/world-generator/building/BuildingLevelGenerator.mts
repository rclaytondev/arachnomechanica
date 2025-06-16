import { Diagonal, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../../utils-ts/modules/Grid.mjs";
import { BuildingGeneratorData } from "../../constants/GameData.mjs";

export class BuildingLevelGenerator {
	rooms: Grid<Diagonal[]> = new Grid([...Directions.DIAGONALS]);

	
}
