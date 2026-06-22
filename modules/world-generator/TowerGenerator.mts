import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { LevelGeneratorData, RoomData, WorldData } from "../constants/GameData.mjs";
import { SpawnPoint } from "../entities/SpawnPoint.mjs";
import { OverlayText } from "../game-utilities/visual-effects/OverlayText.mjs";
import { World } from "../world/World.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { LevelGenerator } from "../level-generator/LevelGenerator.mjs";
import { WorldGenerationSegment } from "./WorldGenerationSegment.mjs";

export class TowerGenerator extends WorldGenerationSegment {
	levelsGenerated: number = 0;
	levelsVisited: number = 0;
	nextPlayerSpawnRoom: Vector = new Vector(0, 0);

	static LEVEL_HEIGHT = WorldData.TILE_SIZE * (RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y);

	initialize(world: World) {
		const levelGenerator = new LevelGenerator(new Vector(0, 0));
		levelGenerator.generateLevel(world);
		this.spawnPlayer(levelGenerator, world);
		const rectangle = levelGenerator.levelRectangle().scale(RoomData.SIZE);
		const startRoom = levelGenerator.path[levelGenerator.path.length - 1];
		EntitySpawner.spawnAllEntities(
			Rectangle.fromBounds(rectangle.left() + 1, rectangle.right() - 1, rectangle.top() + 1, rectangle.bottom() - 1),
			new Rectangle(startRoom.x, startRoom.y, 1, 1).scale(RoomData.SIZE),
			world,
		);
		return this;
	}
	spawnPlayer(levelGenerator: LevelGenerator, world: World) {
		const startRoom = levelGenerator.path[levelGenerator.path.length - 1];
		const startRoomRect = Rectangle.square(startRoom.x, startRoom.y, 1).scale(RoomData.SIZE * WorldData.TILE_SIZE);
		const spawnPoint = [...world.entities.possiblyIntersecting(startRoomRect)].find(e => e instanceof SpawnPoint)!;
		world.player.hitbox.x = spawnPoint.position.x;
		world.player.hitbox.y = spawnPoint.position.y;
		world.entities.updatePosition(world.player);
		world.addEntityIfEmpty(world.player);
		if(world.worldScreen) {
			world.worldScreen.camera.position = world.player.hitbox.center();
		}
	}
	static nextLevelTileRectangle(levels: number, includeBorder: boolean = false) {
		const levelHeight = RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y;
		const rect = new Rectangle(0, -levels * levelHeight, LevelGeneratorData.WIDTH * RoomData.SIZE, LevelGeneratorData.HEIGHT * RoomData.SIZE);
		if(includeBorder) {
			return (rect
				.extend("left", LevelGeneratorData.BORDER_X).extend("right", LevelGeneratorData.BORDER_X)
				.extend("up", LevelGeneratorData.BORDER_Y).extend("down", LevelGeneratorData.BORDER_Y)
			);
		}
		return rect;
	}
	nextLevelTileRectangle(includeBorder: boolean = false) {
		return TowerGenerator.nextLevelTileRectangle(this.levelsVisited, includeBorder);
	}
	generate(world: World) {
		this.levelsGenerated ++;
		const levelHeight = RoomData.SIZE * LevelGeneratorData.HEIGHT + LevelGeneratorData.BORDER_Y;
		const generator = new LevelGenerator(new Vector(0, -levelHeight * this.levelsGenerated));
		generator.generateLevel(world);
		const rectangle = generator.levelRectangle().scale(RoomData.SIZE).translate(new Vector(0, -levelHeight * this.levelsGenerated));
		const startRoom = generator.path[generator.path.length - 1];
		EntitySpawner.spawnAllEntities(
			Rectangle.fromBounds(rectangle.left() + 1, rectangle.right() - 1, rectangle.top() + 1, rectangle.bottom() - 1),
			new Rectangle(startRoom.x, startRoom.y, 1, 1).scale(RoomData.SIZE).translate(new Vector(0, -levelHeight * this.levelsGenerated)),
			world,
		);
		this.nextPlayerSpawnRoom = generator.path[generator.path.length - 1];
	}

	update(world: World): void {
		super.update(world);

		if(world.player.hitbox.top() < -(this.levelsVisited - 1) * TowerGenerator.LEVEL_HEIGHT) {
			this.levelsVisited ++;
			const floorText = `${this.levelsVisited.toString().padStart(2, "0")}`;
			world.worldScreen?.visualEffects.effectsList.add(new OverlayText(`Floor ${floorText}`));
		}
	}

	shouldGenerate(world: World) {
		return world.player.hitbox.top() < RoomData.SIZE * WorldData.TILE_SIZE - this.levelsGenerated * TowerGenerator.LEVEL_HEIGHT;
	}
}
