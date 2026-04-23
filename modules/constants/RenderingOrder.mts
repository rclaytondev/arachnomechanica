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
	"overlay-text",
	"screen-fade",
] as const;

export type RenderingID = typeof RENDERING_ORDER[number];
