export const RENDERING_ORDER = [
	"shake",

	"glow",
	"player",
	"particle",

	"entity",
	"tile",
	"tile-accent",
	"tile-entity",

	"telegraph",
	"hitbox",

	"reset-shake",
	"reset-camera-translation",
	"overlay-text",
	"screen-fade",
] as const;

export type RenderingID = typeof RENDERING_ORDER[number];
