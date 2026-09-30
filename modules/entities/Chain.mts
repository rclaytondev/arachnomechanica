import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ChainData, WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-engine/world/Entity.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Renderable } from "../game-engine/world/Renderer.mjs";
import { Tiles } from "../game-engine/world/Tiles.mjs";
import { World } from "../game-engine/world/World.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";

export class Chain extends Entity {
	tilePosition: Vector;
	height: number;
	isClimbed: boolean = false;

	constructor(tilePosition: Vector, height: number, world: World) {
		super(world);
		this.tilePosition = tilePosition;
		this.height = height;
	}

	render() {
		return [
			new Renderable(c => this.display(c), "background-entity"),
			new Renderable(c => this.displayGlow(c), "glow"),
			new Renderable(c => this.displayEnds(c), "tile-entity"),
		];
	}
	display(canvasIO: CanvasIO) {
		const tile = Tiles.getTileSquare(this.tilePosition);
		const center = tile.center();
		for(let i = 0; i < this.height * ChainData.NUM_SEGMENTS; i ++) {
			const position = new Vector(center.x, tile.y + i * (WorldData.TILE_SIZE / ChainData.NUM_SEGMENTS));
			Chain.displaySegment(position, canvasIO);
		}
	}
	solidBelow() {
		return this.world.tiles.get(this.tilePosition.add(0, this.height)) instanceof BasicTile;
	}
	displayEnds(canvasIO: CanvasIO) {
		const top = this.tilePosition.add(1/2, 0).multiply(WorldData.TILE_SIZE);
		canvasIO.ctx.save();
		canvasIO.ctx.translate(top.x, top.y);
		canvasIO.ctx.scale(1, -1);
		canvasIO.ctx.drawImage(ChainData.END_IMAGE, -ChainData.END_WIDTH / 2, 0);
		canvasIO.ctx.restore();


		if(this.solidBelow()) {
			const bottom = this.tilePosition.add(0, this.height).add(1/2, 0).multiply(WorldData.TILE_SIZE);
			canvasIO.ctx.drawImage(ChainData.END_IMAGE, bottom.x - ChainData.END_WIDTH / 2, bottom.y);
		}
	}
	displayGlow(canvasIO: CanvasIO) {
		const position = this.tilePosition.add(1/2, 0).multiply(WorldData.TILE_SIZE);
		GraphicsUtils.glowCircle(
			position.x, position.y,
			ChainData.END_GLOW_RADIUS, ChainData.END_GLOW_INTENSITY,
			canvasIO, ChainData.END_GLOW_COLOR,
		);


		if(this.solidBelow()) {
			const positionBelow = this.tilePosition.add(0, this.height).add(1/2, 0).multiply(WorldData.TILE_SIZE);
			GraphicsUtils.glowCircle(
				positionBelow.x, positionBelow.y,
				ChainData.END_GLOW_RADIUS, ChainData.END_GLOW_INTENSITY,
				canvasIO, ChainData.END_GLOW_COLOR,
			);
		}
	}
	static displaySegment(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = ChainData.COLOR;
		Chain.displayThinSegment(position, canvasIO);
		Chain.displayThickSegment(position.add(0, ChainData.THIN_SEGMENT_LENGTH), canvasIO);
		Chain.displayThinSegment(position.add(0, ChainData.THICK_SEGMENT_LENGTH + ChainData.THIN_SEGMENT_LENGTH), canvasIO);
	}
	static displayThinSegment(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillRect(
			position.x - ChainData.LINE_WIDTH / 2,
			position.y,
			ChainData.LINE_WIDTH,
			ChainData.THIN_SEGMENT_LENGTH,
		);
	}
	static THICK_SEGMENT_POLY = [
		new Vector(ChainData.LINE_WIDTH / 2, -ChainData.LINE_WIDTH),
		new Vector(ChainData.LINE_WIDTH / 2 + ChainData.LINE_WIDTH, 0),
		new Vector(ChainData.LINE_WIDTH / 2 + ChainData.LINE_WIDTH, ChainData.THICK_SEGMENT_LENGTH),
		new Vector(ChainData.LINE_WIDTH / 2, ChainData.LINE_WIDTH + ChainData.THICK_SEGMENT_LENGTH),
	];
	static THICK_SEGMENT_POLY_REFLECTED = Chain.THICK_SEGMENT_POLY.map(v => v.reflectX());
	static displayThickSegment(position: Vector, canvasIO: CanvasIO) {
		canvasIO.fillPoly(...Chain.THICK_SEGMENT_POLY.map(v => v.add(position)));
		canvasIO.fillPoly(...Chain.THICK_SEGMENT_POLY_REFLECTED.map(v => v.add(position)));
	}

	update() {
		if(this.isClimbed && !this.world.player.hitbox.intersects(this.climbRegion())) {
			this.isClimbed = false;
		}

		const tileAbove = this.world.tiles.get(this.tilePosition.add(0, -1));
		if(tileAbove === EmptyTile.EMPTY) {
			this.world.entities.delete(this);
		}
	}


	boundingBox(): Rectangle {
		return Rectangle.fromDimensions(
			this.tilePosition.x * WorldData.TILE_SIZE,
			this.tilePosition.y * WorldData.TILE_SIZE,
			WorldData.TILE_SIZE,
			this.height * WorldData.TILE_SIZE,
		);
	}
	climbRegion() {
		const centerX = (this.tilePosition.x + 1/2) * WorldData.TILE_SIZE;
		return Rectangle.fromDimensions(
			centerX - ChainData.CLIMB_WIDTH / 2,
			this.tilePosition.y * WorldData.TILE_SIZE,
			ChainData.CLIMB_WIDTH,
			this.height * WorldData.TILE_SIZE,
		);
	}
}
