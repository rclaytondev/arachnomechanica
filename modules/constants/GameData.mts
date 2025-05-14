import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ParticleSettings } from "../game-utilities/Particle.mjs";
import { Room, Traversability } from "../level-generator/Room.mjs";
import { GateState } from "../level-generator/GateState.mjs";
import { World } from "../World";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";

export class WorldData {
	static TILE_SIZE = 50;
	static TILE_COLOR = "rgb(30, 30, 30)";
	static TILE_ACCENT_COLOR = "rgb(100, 180, 255)";
	static TILE_ACCENT_DISTANCE = WorldData.TILE_SIZE * 0.7;
	static TILE_ACCENT_THICKNESS = 2;

	static TILE_GLOW_SIZE = 40;
	static TILE_GLOW_INTENSITY = 0.13;
	static TILE_GLOW_COLOR = {
		red: 100,
		green: 180,
		blue: 255
	};
	static TILE_DIAGONAL_GLOW_SCALE = 1.2;

	static PLATFORM_THICKNESS = WorldData.TILE_SIZE * 0.1;

	static STRING_TILE_TYPES = ["solid", "empty", "platform"] as const;

	static CAMERA_SPEED = 100;
}

export class LevelGeneratorData {
	static WIDTH = 4;
	static HEIGHT = 6;
	static MARGIN_X = 2;
	static MARGIN_Y = 0;
	static BORDER_X = 2;
	static BORDER_Y = 10;

	static MAIN_PATH_BRANCH_PROBABILITY_X = 0.8;
	static MAIN_PATH_BRANCH_PROBABILITY_Y = 0.25;
	static OFF_PATH_BRANCH_PROBABILITY_X = 0.5;
	static OFF_PATH_BRANCH_PROBABILITY_Y = 0.5;
	static MAX_CONNECTIVITY = 0; // 0 = all rooms isolated; 1/2 = all rooms connected with no gates; 1 = all rooms connected with maximally controllable gates
};

export class PlayerData {
	static COLOR = "rgb(0, 128, 0)"; // temporary

	static HITBOX_WIDTH = WorldData.TILE_SIZE * 0.8;
	static HITBOX_HEIGHT = WorldData.TILE_SIZE * 0.8;
	static GRAVITY = 1;
	static GRAVITY_WHILE_JUMPING = 0.7;
	static HORIZONTAL_ACCELERATION = 0.7;
	static JUMP_VELOCITY = 14;
	static MAX_X_VELOCITY = 8;
	static FRICTION_X = 0.7;

	static GLOW_SIZE = 300;
	static GLOW_INTENSITY = 1/8;

	static DEATH_RESET_DELAY = 90;
	static FADE_SPEED = 0.03;
	static FADE_DELAY = 30;

	static MAX_ENERGY = 100;
	static ENERGY_BAR = new Rectangle(10, 10, 200, 20);
	static ENERGY_BAR_COLOR = "rgb(160, 160, 160)";
	static ENERGY_COLOR = "rgb(0, 128, 255)";

	static TELEPORT_COST = 20;
}

export class RoomData {
	static SIZE = 12;

	static ALL_TRAVERSABILITY: Traversability = (() => {
		const connections = [];
		const states: GateState[] = [
			new GateState(null, "left", true),
			new GateState(null, "left", false),
			new GateState(null, "right", true),
			new GateState(null, "right", false),
			new GateState(null, "up", true),
			new GateState(null, "up", false),
			new GateState(null, "down", true),
			new GateState(null, "down", false)
		];
		for(const state1 of states) {
			for(const state2 of states.filter(s => s !== state1)) {
				connections.push({ start: state1, end: state2 });
			}
		}
		return connections;
	}) ();
	static NO_GATE_TRAVERSABILITY = RoomData.ALL_TRAVERSABILITY.filter(({ start, end }) => start.toggled === end.toggled);
	static ALL_GATE_STATES = [
		new GateState(null, "left", true),
		new GateState(null, "left", false),
		new GateState(null, "right", true),
		new GateState(null, "right", false),
		new GateState(null, "up", true),
		new GateState(null, "up", false),
		new GateState(null, "down", true),
		new GateState(null, "down", false),
	];
}

export class GateData {
	static COLOR = "rgb(15, 15, 15)";

	static TOGGLE_DISTANCE = 0;
	static SPEED = 0.2;
	static MIN_DISPLAY_SIZE = 0.15;
	static HITBOX_SIZE = 0.8;

	static SCREEN_SHAKE_TIME = 5;
	static SCREEN_SHAKE_INTENSITY = 5;
}

export class LaserBlockData {
	static COLOR = "rgb(15, 15, 15)";
	static LASER_COLOR = {
		red: 0,
		green: 200,
		blue: 0
	}
	static LASER_THICKNESS = 5;
	static LASER_GLOW_SIZE = 100;
	static LASER_GLOW_INTENSITY = 0.5;
	static LASER_OFFSCREEN_DISTANCE = 100;
	static LASER_LINEAR_SPEED = 50;

	static FRAMES_PER_PARTICLE = 4;
	static PARTICLE_INFO: ParticleSettings = {
		color: {
			red: 70,
			green: 70,
			blue: 70,
		},
		grayscaleColorVariance: 5,
		size: 7,
		opacityDecay: 1/240,
		glowIntensity: 1/8,
		glowSize: 30
	};
	static PARTICLE_SPEED = 0.1;

	static BARREL_COLOR = "rgb(50, 50, 50)";
	static BARREL_THICKNESS = WorldData.TILE_SIZE * 0.2;
	static BARREL_LENGTH = WorldData.TILE_SIZE * 0.4;

	static LASERS_PER_ROOM = 0.4;
	static SPAWN_EVENNESS = 9;
	static MIN_SPEED = 0.01;
	static MAX_SPEED = 0.01;
}

export class LizardData {
	static SPEED = 3;
	static LOOKAHEAD_WIDTH = WorldData.TILE_SIZE * 0.8;
	static LOOKAHEAD_DISTANCE = WorldData.TILE_SIZE * 1/2 + LizardData.SPEED;
	static HITBOX_WIDTH = WorldData.TILE_SIZE * 1/2;
	static FIRE_DURATION = 30;
	static HURTBOX_WIDTH = 1/2 * WorldData.TILE_SIZE;
	static HURTBOX_SPEED = 6;
	static HURTBOX_OFFSET = WorldData.TILE_SIZE * 0.4;
	static MAX_HURTBOX_SIZE = 100;
	static PLAYER_DETECTION_WIDTH = WorldData.TILE_SIZE * 0.5;

	static FIRE_PARTICLES: ParticleSettings = {
		color: { red: 255, green: 128, blue: 0 },
		size: WorldData.TILE_SIZE * 0.2,
		shape: 3,
		minRotationalVelocity: 0,
		maxRotationalVelocity: 1,
		glowSize: 30,
		glowIntensity: 1/8
	};
	static PARTICLES_PER_FRAME = 2;
	static PARTICLE_SPEED = LizardData.SPEED + 6;
	static PARTICLE_SPEED_VARIANCE = 2;
	static PARTICLE_CROSS_SPEED_VARIANCE = 1;

	static BODY_WIDTH = WorldData.TILE_SIZE * 0.1;
	static BODY_POINTEDNESS = 2;
	static LEG_POINTEDNESS = 2;
	static LEG_SCALE = WorldData.TILE_SIZE * 0.5;
	static LEG_SPACING = LizardData.LEG_SCALE * 2; // distance between consecutive legs on the lizard's body.
	static LEG_DISTANCE = LizardData.LEG_SCALE * 0.4; // how far away perpendicularly the foot should be from the body.
	static LEG_SPEED_MULTIPLIER = 1;
	static LEG_MAX = 0.75 * LizardData.LEG_SCALE;
	static LEG_MIN = 0.75 * -LizardData.LEG_SCALE;
	static LEG_WIDTH = WorldData.TILE_SIZE * 0.1;
	static LOWER_LEG_LENGTH = LizardData.LEG_SCALE * 0.6;
	static LEG_ROTATION_START = WorldData.TILE_SIZE * 0.2;
	static LEG_ROTATION_END = WorldData.TILE_SIZE * 0.2;

	static HEAD_WIDTH = WorldData.TILE_SIZE * 0.2;
	static HEAD_HEIGHT = WorldData.TILE_SIZE * 0.3;
	static HEAD_OFFSET = -WorldData.TILE_SIZE * 0.5;
	static MOUTH_LENGTH = WorldData.TILE_SIZE;
	static MOUTH_SPEED_OPENING = 2;
	static MOUTH_SPEED_CLOSING = 3;
	static MAX_MOUTH_ANGLE = 15;
	static FIRE_MOUTH_OPENNESS = 25;
	static EYE_SIZE = WorldData.TILE_SIZE * 0.1;
	static EYE_Y = WorldData.TILE_SIZE * 0.3;
	static EYE_COLOR = "rgb(0, 150, 255)";
	static HEAD_ROTATION_SPEED = 0.2;

	static LIGHT_SIZE = 100;
	static LIGHT_INTENSITY = 0.3;

	static LIZARDS_PER_ROOM = 0.3;
	static MIN_LENGTH = 2;
	static MAX_LENGTH = 7;
	static SPAWN_EVENNESS = 7; // higher number = more evenly distributed
	static MIN_PLAYER_SPAWN_DISTANCE = 600;
}

export type BackgroundGearLayerData = {
	minSize: number;
	maxSize: number;
	color: string;
	parallax: number;
	minSpeed: number;
	maxSpeed: number;
	density: number;
	evenness: number;
	minTeeth: number;
	maxTeeth: number;
	minInnerRadius: number;
	maxInnerRadius: number;
	blur: number;
}
export class BackgroundData {
	static BACKGROUND_COLOR = "rgb(30, 30, 30)";
	static MAX_GEAR_SPAWN_ATTEMPTS = 30;

	static SKY_BACKGROUND_COLORS = [
		{ color: "rgb(30, 20, 50)", y: 0 },
		{ color: "rgb(75, 40, 100)", y: 0.5 },
		{ color: "rgb(50, 64, 128)", y: 1 }
	];
	static STAR_DENSITY = 0.0001;
	static STAR_EVENNESS = 6;
	static STAR_SIZE = 1;

	static LAYERS: BackgroundGearLayerData[] = [
		{
			minSize: 100,
			maxSize: 200,
			color: "rgb(20, 20, 20)",
			parallax: 0.75,
			minSpeed: 0.25,
			maxSpeed: 0.75,
			density: 2,
			evenness: 5,
			minTeeth: 6,
			maxTeeth: 8,
			minInnerRadius: 0.8,
			maxInnerRadius: 0.8,
			blur: 6
		}
	];
}
export class SpikeballData {
	static RADIUS = WorldData.TILE_SIZE * 0.35;
	static COLOR = "rgb(0, 0, 0)";
	static ACCENT_COLOR = {
		red: 255,
		green: 255,
		blue: 0
	};
	static ACCENT_THICKNESS = 2;
	static ACCENT_RADIUS_MULTIPLIER = 0.7;
	static GLOW_SIZE = 75;
	static GLOW_INTENSITY = 0.6;
	static NUM_SPIKES = 9;
	static SPIKE_WIDTH = 0.3 * SpikeballData.RADIUS;
	static SPIKE_BASE = 0.9 * SpikeballData.RADIUS;
	static SPIKE_HEIGHT = 1.6 * SpikeballData.RADIUS;
	static ROTATION_SPEED = 0.07;
	static GLOW_FADE_TIME = 20;

	static SPEED = 3.5;
}

export type SpikeballPattern = [Direction, Direction][][];

export class SpikeballBlockData {
	static SPAWN_FREQUENCY = 40;
	static SPIKEBALLS_PER_ROOM = 0.4;
	static PATTERNS: SpikeballPattern[] = [
		[
			// pattern 1:
			[
				["left", "up"],
				["right", "down"],
			],
			[
				["left", "down"],
				["right", "up"]
			]
		]
	]

	static DOOR_COLOR = "rgb(15, 15, 15)";
	static DOOR_OPENING_SPEED = 2;
	static DOOR_OPENING_TIME = 30;
	static DOOR_OPENNESS = 0.35 * WorldData.TILE_SIZE;
	static DOOR_HEIGHT = 0.2 * WorldData.TILE_SIZE;

	static BARREL_COLOR = "rgb(30, 30, 30)";
	static BARREL_LENGTH = 0.3 * WorldData.TILE_SIZE;
	static BARREL_DOOR_LENGTH = 0.4 * WorldData.TILE_SIZE;
}
