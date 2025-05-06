import { ParticleSettings } from "../Particle.mjs";
import { GateState } from "../tiles/Gate.mjs";
import { World } from "../World";

export class WorldData {
	static TILE_SIZE = 50;
	static TILE_COLOR = "rgb(100, 100, 100)";
	static PLATFORM_THICKNESS = WorldData.TILE_SIZE * 0.1;

	static STRING_TILE_TYPES = ["solid", "empty", "platform"] as const;
}

export class LevelGeneratorData {
	static WIDTH = 3;
	static HEIGHT = 5;
	static MARGIN_X = 2;
	static MARGIN_Y = 0;
	static BORDER_X = 2;
	static BORDER_Y = 4;

	static MAIN_PATH_BRANCH_PROBABILITY = 0.6;
	static OFF_PATH_BRANCH_PROBABILITY = 0.;
	static MAX_CONNECTIVITY = 14; // 0 = all rooms isolated; 28 = all rooms connected with no gates; 56 = all rooms connected with maximally controllable gates
};

export class PlayerData {
	static COLOR = "rgb(0, 128, 0)"; // temporary

	static GRAVITY = 0.5;
	static HORIZONTAL_ACCELERATION = 0.7;
	static JUMP_VELOCITY = 12;
	static MAX_X_VELOCITY = 8;
	static FRICTION_X = 0.7;
}

export class RoomData {
	static SIZE = 12;

	static NO_GATE_TRAVERSABILITY: GateState[][] = [
		[
			{ direction: "left", toggled: false },
			{ direction: "right", toggled: false },
			{ direction: "up", toggled: false },
			{ direction: "down", toggled: false },
		],
		[
			{ direction: "left", toggled: true },
			{ direction: "right", toggled: true },
			{ direction: "up", toggled: true },
			{ direction: "down", toggled: true },
		]
	];
	static ALL_TRAVERSABILITY: GateState[][] = [
		[
			{ direction: "left", toggled: false },
			{ direction: "right", toggled: false },
			{ direction: "up", toggled: false },
			{ direction: "down", toggled: false },
			{ direction: "left", toggled: true },
			{ direction: "right", toggled: true },
			{ direction: "up", toggled: true },
			{ direction: "down", toggled: true },
		]
	];
}

export class GateData {
	static COLOR = "rgb(59, 67, 70)";

	static TOGGLE_DISTANCE = 0;
	static SPEED = 0.2;
}

export class LizardData {
	static SPEED = 3;
	static LOOKAHEAD_WIDTH = WorldData.TILE_SIZE * 0.8;
	static LOOKAHEAD_DISTANCE = WorldData.TILE_SIZE * 1/2 + LizardData.SPEED;
	static HITBOX_WIDTH = WorldData.TILE_SIZE * 1/2;
	static FIRE_DURATION = 30;
	static HURTBOX_WIDTH = 1/2 * WorldData.TILE_SIZE;
	static HURTBOX_SPEED = 6;
	static MAX_HURTBOX_SIZE = 100;

	static FIRE_PARTICLES: ParticleSettings = {
		color: { red: 0, green: 128, blue: 255 },
		size: WorldData.TILE_SIZE * 0.2,
		shape: 3,
		minRotationalVelocity: 0,
		maxRotationalVelocity: 1
	};
	static PARTICLES_PER_FRAME = 2;
	static PARTICLE_SPEED = LizardData.SPEED + 6;
	static PARTICLE_SPEED_VARIANCE = 2;
	static PARTICLE_CROSS_SPEED_VARIANCE = 1;

	static BODY_WIDTH = WorldData.TILE_SIZE * 0.1;
	static LEG_SCALE = WorldData.TILE_SIZE * 0.5;
	static LEG_SPACING = LizardData.LEG_SCALE; // distance between consecutive legs on the lizard's body.
	static LEG_DISTANCE = LizardData.LEG_SCALE * 0.4; // how far away perpendicularly the foot should be from the body.
	static STEP_SIZE = LizardData.LEG_SCALE * 1.5; // how far past the connection it should move the leg each step.
	static MAX_LEG_DISTANCE = LizardData.LEG_SCALE; // maximum distance between leg and connection before taking a step.
	static FOOT_SIZE = WorldData.TILE_SIZE * 0;
	static LEG_SPEED_MULTIPLIER = 2.5;

	static HEAD_WIDTH = WorldData.TILE_SIZE * 0.2;
	static HEAD_HEIGHT = WorldData.TILE_SIZE * 0.3;
	static HEAD_OFFSET = -WorldData.TILE_SIZE * 0.5;
	static MOUTH_LENGTH = WorldData.TILE_SIZE;
	static EYE_SIZE = WorldData.TILE_SIZE * 0.1;
	static EYE_Y = WorldData.TILE_SIZE * 0.3;
	static EYE_COLOR = "rgb(0, 150, 255)";
	static HEAD_ROTATION_SPEED = 0.2;

	static LIZARDS_PER_ROOM = 0.5;
	static MIN_LENGTH = 2;
	static MAX_LENGTH = 7;
	static SPAWN_EVENNESS = 7; // higher number = more evenly distributed
}
