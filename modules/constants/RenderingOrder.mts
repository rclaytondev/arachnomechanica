export const RENDERING_ORDER = [
	"glow",
	"player",
	"particle",

	"entity",
	"tile",
	"tile-accent",
	"tile-entity",

	"telegraph",
	"hitbox",
] as const;

export type RenderingID = typeof RENDERING_ORDER[number];
