import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { HashSet } from "../../utils-ts/modules/HashSet.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { PlayerData, RoomData, SpiderData } from "../constants/GameData.mjs";
import { GameUtils } from "../game-utilities/GameUtils.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";
import { Fireball } from "./Fireball.mjs";
export class PointOnSurface {
    normal;
    position;
    constructor(point, normal) {
        this.position = point;
        this.normal = normal;
    }
    move1Pixel(self, world, direction) {
        const blockers = world.angularMotionBlockers(this.position, direction, (e) => e !== self);
        if (blockers.length === 0) {
            const opposite = (direction === "clockwise" ? "counterclockwise" : "clockwise");
            const onPlatformEnd = world.angularMotionBlockers(this.position, opposite, e => e !== self).length !== 0;
            return onPlatformEnd ? "on-platform-end" : "floating";
        }
        const newTangent = Directions.nextIn(blockers, this.normal, direction);
        const newNormal = (direction === "clockwise") ? Directions.rotateCounterclockwise[newTangent] : Directions.rotateClockwise[newTangent];
        return new PointOnSurface(this.position.add(Vector.gridUnit(newTangent)), newNormal);
    }
    nextCornerSearchRegion(maxDistance, angularDirection) {
        const direction = this.tangentVector(angularDirection);
        const endpoint = this.position.add(Vector.unit(direction).multiply(maxDistance));
        const thinSearchRegion = Rectangle.fromOppositeCorners(this.position, endpoint);
        return thinSearchRegion.extend("all", 2);
    }
    nextPossibleCorner(maxDistance, angularDirection, world) {
        const searchRegion = this.nextCornerSearchRegion(maxDistance, angularDirection);
        const entities = [...world.entities.collideablesIntersecting(searchRegion)];
        const entityCorners = entities.flatMap(e => e.corners());
        const tiles = [...world.tiles.getTilesAt(searchRegion)];
        const overlaps = World.intersectingSolids(tiles, entities);
        if (overlaps.length !== 0) {
            return 0;
        }
        const tileCorners = tiles.flatMap(({ position, tile }) => tile.corners(position));
        const corners = new HashSet([...entityCorners, ...tileCorners]);
        const direction = this.tangentVector(angularDirection);
        const searchVector = Vector.gridUnit(direction);
        const hitboxes = entities.flatMap(e => e.hitboxes());
        const cornerDistances = [...corners].map(c => GameUtils.rayIntersectsPoint(this.position, searchVector, c));
        const entityDistances = hitboxes.map(h => GameUtils.rayIntersectsRectangle(this.position, searchVector, h.extend("all", -1)) - 1);
        return Math.max(0, Math.min(maxDistance, ...cornerDistances, ...entityDistances));
    }
    move(self, world, direction, max, stopAfterTurn = true) {
        let totalDistance = 0;
        const currentDirection = direction;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let currentPoint = this;
        while (true) {
            const distanceToTurn = currentPoint.nextPossibleCorner(max, currentDirection, world);
            const nextPoint = currentPoint.position.add(Vector.gridUnit(currentPoint.tangentVector(currentDirection)).multiply(distanceToTurn));
            const next = new PointOnSurface(nextPoint, currentPoint.normal);
            const afterTurn = next.move1Pixel(self, world, currentDirection);
            if (totalDistance + distanceToTurn > max) {
                return [
                    max,
                    new PointOnSurface(currentPoint.position.add(Vector.gridUnit(currentPoint.tangentVector(currentDirection)).multiply(max - totalDistance)), currentPoint.normal),
                ];
            }
            if (!(afterTurn instanceof PointOnSurface)) {
                return [totalDistance + distanceToTurn, next];
            }
            totalDistance += distanceToTurn + 1;
            if (stopAfterTurn && totalDistance <= max && afterTurn.normal !== currentPoint.normal) {
                return [
                    totalDistance - 1,
                    afterTurn,
                ];
            }
            currentPoint = afterTurn;
        }
    }
    tangentVector(direction) {
        return Directions.rotate[direction][this.normal];
    }
    equals(pointOnSurface) {
        return this.normal === pointOnSurface.normal && this.position.equals(pointOnSurface.position);
    }
}
class Turn {
    distance;
    point;
    constructor(distance, point) {
        this.distance = distance;
        this.point = point;
    }
}
class SpiderHitboxCalculator {
    normal;
    previousTurn;
    nextTurn;
    constructor(normal, previousTurn, nextTurn) {
        this.normal = normal;
        this.previousTurn = previousTurn;
        this.nextTurn = nextTurn;
    }
    wallDistance() {
        const distanceToTurn = Math.min(this.nextTurn.distance, this.previousTurn.distance);
        if (distanceToTurn >= SpiderData.TURN_WALL_DURATION) {
            return SpiderData.SIZE / 2;
        }
        return SpiderData.SIZE / 2 + GameUtils.lerp(distanceToTurn, 0, SpiderData.TURN_WALL_DURATION, SpiderData.TURN_WALL_DISTANCE, 0);
    }
    smoothedNormalAngle() {
        if (this.previousTurn.distance === 0 && this.nextTurn.distance === 0) {
            /* This is an edge case that can happen when moving past a platform from below. */
            const previousAngle = Directions.angle[this.previousTurn.point.normal];
            const nextAngle = Directions.angle[this.nextTurn.point.normal];
            return GameUtils.lerpAngle(1 / 2, 0, 1, previousAngle, nextAngle);
        }
        else if (this.previousTurn.distance + this.nextTurn.distance < 2 * SpiderData.TURN_WALL_DURATION) {
            const halfAngle1 = GameUtils.lerpAngle(1 / 2, 0, 1, Directions.angle[this.previousTurn.point.normal], Directions.angle[this.normal]);
            const halfAngle2 = GameUtils.lerpAngle(1 / 2, 0, 1, Directions.angle[this.normal], Directions.angle[this.nextTurn.point.normal]);
            return GameUtils.lerpAngle(this.previousTurn.distance, 0, this.previousTurn.distance + this.nextTurn.distance, halfAngle1, halfAngle2);
        }
        else if (this.previousTurn.distance < SpiderData.TURN_WALL_DURATION) {
            const halfAngle = GameUtils.lerpAngle(1 / 2, 0, 1, Directions.angle[this.normal], Directions.angle[this.previousTurn.point.normal]);
            return GameUtils.lerpAngle(this.previousTurn.distance, 0, SpiderData.TURN_WALL_DURATION, halfAngle, Directions.angle[this.normal]);
        }
        else if (this.nextTurn.distance < SpiderData.TURN_WALL_DURATION) {
            const halfAngle = GameUtils.lerpAngle(1 / 2, 0, 1, Directions.angle[this.normal], Directions.angle[this.nextTurn.point.normal]);
            const result = GameUtils.lerpAngle(this.nextTurn.distance, 0, SpiderData.TURN_WALL_DURATION, halfAngle, Directions.angle[this.normal]);
            return result;
        }
        else {
            return Directions.angle[this.normal];
        }
    }
    scaledSmoothedNormal(angle = this.smoothedNormalAngle()) {
        const wallDistance = this.wallDistance();
        return new Vector(Math.cos(angle), -Math.sin(angle)).multiply(wallDistance);
    }
}
export class CrawlingState {
    pointOnSurface;
    direction;
    subpixel = 0;
    constructor(pointOnSurface, direction) {
        this.pointOnSurface = pointOnSurface;
        this.direction = direction;
    }
    update(spider, world, canvasIO) {
        if (this.isFloating(spider, world) || this.isBasepointDetached(spider)) {
            spider.beginFalling();
            return;
        }
        this.move(spider, world, canvasIO);
        spider.projectileState.update(spider, world);
    }
    move(spider, world, canvasIO) {
        this.subpixel += spider.projectileState.speed;
        let amountMoved = 0;
        while (this.subpixel >= 1) {
            amountMoved++;
            const moved = this.move1Pixel(spider, world);
            if (moved && amountMoved % SpiderData.MAX_DISTANCE_PER_MOVE === 0 && this.subpixel >= 1) {
                this.updateHitbox(spider, world, canvasIO);
            }
        }
        const [normal, angle] = this.getNormalAndAngle(spider, world);
        this.updateHitbox(spider, world, canvasIO, normal);
        spider.angle = GameUtils.moveAngleTowards(spider.angle, angle, SpiderData.ANGULAR_SPEED);
    }
    move1Pixel(spider, world) {
        const nextPoint = this.pointOnSurface.move1Pixel(spider, world, this.direction);
        this.subpixel--;
        if (nextPoint === "on-platform-end" || nextPoint === "floating") {
            this.direction = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
            return false;
        }
        this.pointOnSurface = nextPoint;
        return true;
    }
    hitboxCalculator(spider, world) {
        const opposite = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
        const [nextTurnDistance, nextTurn] = this.pointOnSurface.move(spider, world, this.direction, 2 * SpiderData.TURN_WALL_DURATION);
        const [previousTurnDistance, previousTurn] = this.pointOnSurface.move(spider, world, opposite, 2 * SpiderData.TURN_WALL_DURATION);
        return new SpiderHitboxCalculator(this.pointOnSurface.normal, new Turn(previousTurnDistance, previousTurn), new Turn(nextTurnDistance, nextTurn));
    }
    getNormalAndAngle(spider, world) {
        const hitboxCalculator = this.hitboxCalculator(spider, world);
        const angle = hitboxCalculator.smoothedNormalAngle();
        const normal = hitboxCalculator.scaledSmoothedNormal(angle);
        return [normal, angle];
    }
    updateHitbox(spider, world, canvasIO, normal) {
        normal ??= this.getNormalAndAngle(spider, world)[0];
        const preferredCenter = this.pointOnSurface.position.add(normal);
        const offset = preferredCenter.subtract(spider.hitbox.center().add(spider.subpixel));
        const collides = (obj) => !(obj instanceof Fireball && obj.ignoredEntities.includes(spider));
        spider.move(offset, world, canvasIO, { collides });
    }
    isFloating(spider, world) {
        const opposite = this.direction === "clockwise" ? "counterclockwise" : "clockwise";
        const blockers1 = world.angularMotionBlockers(this.pointOnSurface.position, this.direction, (o) => o !== spider);
        const blockers2 = world.angularMotionBlockers(this.pointOnSurface.position, opposite, (o) => o !== spider);
        return blockers1.length === 0 && blockers2.length === 0;
    }
    isBasepointDetached(spider) {
        const distance = Vector.dist(spider.hitbox.center(), this.pointOnSurface.position);
        return (distance > SpiderData.MAX_BASEPOINT_DISTANCE);
    }
    runAway(point) {
        const distance = Vector.dist(this.pointOnSurface.position, point);
        const direction = this.pointOnSurface.tangentVector(this.direction);
        const nextDistance = Vector.dist(this.pointOnSurface.position.add(Vector.unit(direction)), point);
        if (nextDistance < distance) {
            this.direction = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
        }
    }
}
export class SpiderLeg {
    minDistance;
    maxDistance;
    distance;
    destinationDistance;
    attachmentOffset;
    length;
    position = new Vector(0, 0);
    constructor(length, attachmentOffset, minDistance, maxDistance) {
        this.length = length;
        this.attachmentOffset = attachmentOffset;
        this.distance = minDistance;
        this.destinationDistance = maxDistance;
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
    }
    update(spider, world) {
        if (Math.abs(this.distance) <= this.minDistance || Math.sign(this.distance) !== Math.sign(this.attachmentOffset.x)) {
            this.destinationDistance = this.maxDistance * Math.sign(this.attachmentOffset.x);
        }
        else if (Math.abs(this.distance) >= this.maxDistance && Math.sign(this.distance) === Math.sign(this.attachmentOffset.x)) {
            this.destinationDistance = this.minDistance * Math.sign(this.attachmentOffset.x);
        }
        if (!(spider.projectileState instanceof TelegraphState)) {
            this.distance = GameUtils.moveTowards(this.distance, this.destinationDistance, SpiderData.LEG_SPEED);
        }
        const destination = this.destination(spider, world);
        const updateSpeed = spider.projectileState.speed + SpiderData.LEG_UPDATE_SPEED;
        this.position = GameUtils.moveVectorTowards(this.position, destination, updateSpeed);
    }
    destination(spider, world) {
        if (spider.movement instanceof FallingState || spider.movement.isFloating(spider, world)) {
            return this.position;
        }
        const direction = this.distance > 0 ? "clockwise" : "counterclockwise";
        const [distance, point] = spider.movement.pointOnSurface.move(spider, world, direction, Math.abs(this.distance), false);
        return point.position;
    }
    jointPosition(spider, position) {
        const center = spider.hitbox.center();
        const distance = Vector.dist(position, center);
        const horizontal = position.subtract(center).normalize();
        const up = horizontal.rotate(this.attachmentOffset.x < 0 ? 90 : -90);
        const height = Math.sqrt(Math.max(0, this.length ** 2 - (distance / 2) ** 2));
        return center.add(horizontal.multiply(distance / 2)).add(up.multiply(height));
    }
    display(spider, canvasIO) {
        const attachment = this.attachment(spider);
        const joint = this.jointPosition(spider, this.position);
        canvasIO.ctx.strokeStyle = "black";
        canvasIO.ctx.lineWidth = 5;
        canvasIO.linePointedness = 2;
        canvasIO.pointedLine(attachment.x, attachment.y, joint.x, joint.y);
        canvasIO.pointedLine(joint.x, joint.y, this.position.x, this.position.y);
    }
    attachment(spider) {
        const center = spider.hitbox.center();
        return center.add(this.attachmentOffset.rotate(-MathUtils.toDegrees(spider.angle) + 90));
    }
}
export class FallingState {
    velocity = new Vector(0, 0);
    update(spider, world, canvasIO) {
        spider.move(this.velocity, world, canvasIO, {});
        this.velocity = this.velocity.add(0, PlayerData.GRAVITY);
    }
}
class ProjectileState {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render(spider, world) { return []; }
}
class TelegraphState extends ProjectileState {
    timerProgress = 0;
    speed = 0;
    update(spider, world) {
        if (spider.seesPlayer(world)) {
            this.timerProgress++;
            if (this.timerProgress > SpiderData.SHOT_DELAY) {
                spider.shootProjectile(world);
                spider.projectileState = new RechargingState();
            }
        }
        else {
            spider.projectileState = new DefaultState();
        }
    }
    render(spider, world) {
        return [new Renderable(c => this.display(spider, c, world), "telegraph")];
    }
    display(spider, canvasIO, world) {
        const center = spider.hitbox.center();
        const player = world.player.hitbox.center();
        const timerProgress = MathUtils.constrain(this.timerProgress, 0, SpiderData.SHOT_DELAY);
        const opacity = GameUtils.lerp(timerProgress, 0, SpiderData.SHOT_DELAY, 0, 1);
        const width = GameUtils.lerp(timerProgress, 0, SpiderData.SHOT_DELAY, 30, 2);
        GameUtils.glowOutline(center.x, center.y, player.x, player.y, width, opacity, canvasIO, 255, 255, 255);
    }
    numGlowingEyes() {
        return SpiderData.NUM_EYES;
    }
}
class DefaultState extends ProjectileState {
    speed = SpiderData.SPEED;
    update(spider, world) {
        if (spider.seesPlayer(world)) {
            spider.projectileState = new TelegraphState();
        }
    }
    numGlowingEyes() {
        return SpiderData.NUM_EYES;
    }
}
class RechargingState extends ProjectileState {
    speed = SpiderData.FAST_SPEED;
    rechargeProgress = 0;
    update(spider, world) {
        if (spider.seesPlayer(world)) {
            this.rechargeProgress = 0;
            if (spider.movement instanceof CrawlingState) {
                spider.movement.runAway(world.player.hitbox.center());
            }
        }
        else {
            this.rechargeProgress++;
        }
        if (this.rechargeProgress > SpiderData.RECHARGE_TIME) {
            spider.projectileState = new DefaultState();
        }
    }
    numGlowingEyes() {
        return Math.floor(GameUtils.lerp(MathUtils.constrain(this.rechargeProgress, 0, SpiderData.RECHARGE_TIME), 0, SpiderData.RECHARGE_TIME, 0, SpiderData.NUM_EYES));
    }
}
export class Spider extends RectangularCollideable {
    movement;
    projectileState = new DefaultState();
    angle = 0;
    legs = [];
    constructor(position, movement, world) {
        super(Rectangle.square(position.x, position.y, SpiderData.HITBOX_SIZE));
        this.movement = movement;
        this.legs = this.initializeLegs(world);
    }
    initializeLegs(world) {
        const legs = [
            new SpiderLeg(SpiderData.LEG_1.LENGTH, SpiderData.LEG_1.ATTACHMENT.reflectX(), SpiderData.LEG_1.MIN_DISTANCE, SpiderData.LEG_1.MAX_DISTANCE),
            new SpiderLeg(SpiderData.LEG_1.LENGTH, SpiderData.LEG_1.ATTACHMENT, SpiderData.LEG_1.MIN_DISTANCE, SpiderData.LEG_1.MAX_DISTANCE),
            new SpiderLeg(SpiderData.LEG_2.LENGTH, SpiderData.LEG_2.ATTACHMENT.reflectX(), SpiderData.LEG_2.MIN_DISTANCE, SpiderData.LEG_2.MAX_DISTANCE),
            new SpiderLeg(SpiderData.LEG_2.LENGTH, SpiderData.LEG_2.ATTACHMENT, SpiderData.LEG_2.MIN_DISTANCE, SpiderData.LEG_2.MAX_DISTANCE),
        ];
        for (const leg of legs) {
            leg.position = leg.destination(this, world);
        }
        return legs;
    }
    render(world) {
        return [
            new Renderable(c => this.display(c, world), "entity"),
            new Renderable(c => this.displayGlowEffect(c), "glow"),
            ...this.projectileState.render(this, world),
        ];
    }
    display(canvasIO, world) {
        this.displayBody(canvasIO, world);
        this.displayEyes(canvasIO);
        this.displayLegs(canvasIO);
    }
    displayBody(canvasIO, world) {
        canvasIO.ctx.save();
        const position = this.hitbox.center();
        canvasIO.ctx.translate(position.x, position.y);
        canvasIO.ctx.rotate(-this.angle);
        canvasIO.ctx.fillStyle = SpiderData.COLOR;
        if (this.seesPlayer(world) && DEBUG_SETTINGS.SPIDERS.VISUALIZE) {
            canvasIO.ctx.fillStyle = "green";
        }
        canvasIO.fillRegularPoly(new Vector(0, 0), SpiderData.SIZE / 2, 6);
        canvasIO.ctx.restore();
    }
    displayEyes(canvasIO) {
        const center = this.hitbox.center();
        const numGlowing = this.projectileState.numGlowingEyes();
        let count = 0;
        for (let angle = 0; angle < 360; angle += 360 / SpiderData.NUM_EYES) {
            const position = new Vector(0, -SpiderData.EYE_DISTANCE).rotate(angle + 90 + MathUtils.toDegrees(-this.angle));
            canvasIO.ctx.fillStyle = (count < numGlowing) ? SpiderData.EYE_COLOR : SpiderData.UNLIT_EYE_COLOR;
            canvasIO.fillDiamond(center.x + position.x, center.y + position.y, SpiderData.EYE_SIZE);
            count++;
        }
    }
    displayGlowEffect(canvasIO) {
        const center = this.hitbox.center();
        const glowIntensity = GameUtils.lerp(this.projectileState.numGlowingEyes(), 0, SpiderData.NUM_EYES, 0, SpiderData.GLOW_INTENSITY);
        GameUtils.glowCircle(center.x, center.y, SpiderData.GLOW_SIZE, glowIntensity, canvasIO, SpiderData.GLOW_COLOR.red, SpiderData.GLOW_COLOR.green, SpiderData.GLOW_COLOR.blue);
    }
    displayLegs(canvasIO) {
        for (const leg of this.legs) {
            leg.display(this, canvasIO);
        }
    }
    displayDebug(canvasIO, world) {
        if (this.movement instanceof FallingState || this.movement.isFloating(this, world) || !DEBUG_SETTINGS.SPIDERS.VISUALIZE) {
            return;
        }
        const point = this.movement.pointOnSurface.position;
        const normalEndpoint = point.add(Vector.unit(this.movement.pointOnSurface.normal).multiply(20));
        canvasIO.ctx.strokeStyle = "red";
        canvasIO.ctx.lineWidth = 3;
        canvasIO.strokeLine(point.x, point.y, normalEndpoint.x, normalEndpoint.y);
        const [smoothedNormal] = this.movement.getNormalAndAngle(this, world);
        const smoothedEndpoint = point.add(smoothedNormal);
        canvasIO.ctx.strokeStyle = "green";
        canvasIO.ctx.lineWidth = 3;
        canvasIO.strokeLine(point.x, point.y, smoothedEndpoint.x, smoothedEndpoint.y);
    }
    update(world, canvasIO) {
        this.movement.update(this, world, canvasIO);
        for (const leg of this.legs) {
            leg.update(this, world);
        }
    }
    seesPlayer(world) {
        const center = this.hitbox.center();
        const player = world.player.hitbox;
        const up = new Vector(0, -1).rotate(MathUtils.toDegrees(-this.angle)).multiply(15);
        const collides = (obj) => obj !== this && obj !== world.player;
        return world.hasLineOfSight(center.add(up), player, collides) && world.hasLineOfSight(center.subtract(up), player, collides);
    }
    shootProjectile(world) {
        const center = this.hitbox.center();
        const player = world.player.hitbox.center();
        const direction = player.subtract(center).normalize();
        const velocity = direction.multiply(SpiderData.PROJECTILE_SPEED);
        const acceleration = direction.multiply(SpiderData.PROJECTILE_ACCELERATION);
        const projectile = new Fireball(center, velocity, acceleration, [this]);
        world.entities.add(projectile);
    }
    beginCrawling(world) {
        const centerBottom = this.hitbox.edgeCenter("down");
        for (let distance = 0; distance <= SpiderData.HITBOX_SIZE / 2; distance++) {
            for (const sign of [-1, 1]) {
                const collides = (o) => o !== this;
                const possibleBasepoint = new Vector(centerBottom.x + sign * distance, centerBottom.y);
                const motionBlockers = world.angularMotionBlockers(possibleBasepoint, "clockwise", collides);
                if (motionBlockers.some(d => ["up-left", "left", "down-left", "down-right", "right", "up-right"].includes(d))) {
                    this.movement = new CrawlingState(new PointOnSurface(possibleBasepoint, "up"), "clockwise");
                    return true;
                }
            }
        }
        return false;
    }
    beginFalling() {
        this.movement = new FallingState();
    }
    static spawn(tilePosition, world) {
        const direction = Directions.DIRECTIONS.find(dir => {
            const tile = world.tiles.get(tilePosition.add(Vector.unit(dir)));
            return tile instanceof BasicTile;
        });
        if (!direction) {
            return false;
        }
        const tileSquare = Tiles.getTileSquare(tilePosition);
        const pointOnSurface = new PointOnSurface(tileSquare.edgeCenter(direction), Directions.opposite[direction]);
        const movement = new CrawlingState(pointOnSurface, "clockwise");
        const position = tileSquare.center().subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2);
        const spider = new Spider(position, movement, world);
        return world.addEntityIfEmpty(spider);
    }
    onCollision(collision, world) {
        if (collision.directionOf(this) === "down" && this.movement instanceof FallingState) {
            this.beginCrawling(world);
        }
        else if (this.movement instanceof CrawlingState) {
            const collisionDirection = Vector.unit(collision.directionOf(this));
            const tangent = Vector.unit(this.movement.pointOnSurface.tangentVector(this.movement.direction));
            const opposite = (this.movement.direction === "clockwise" ? "counterclockwise" : "clockwise");
            const oppositeTangent = Vector.unit(this.movement.pointOnSurface.tangentVector(opposite));
            if (Vector.dist(tangent, collisionDirection) < Vector.dist(oppositeTangent, collisionDirection)) {
                this.movement.direction = (this.movement.direction === "clockwise") ? "counterclockwise" : "clockwise";
            }
        }
    }
    translate(amount, world) {
        super.translate(amount, world);
        if (this.movement instanceof FallingState) {
            for (const leg of this.legs) {
                leg.position = leg.position.add(amount);
            }
        }
    }
}
LoadingManager.onload(() => {
    EntitySpawner.registerEntityType((tileRegion, safeRegion, world) => {
        EntitySpawner.spawnEntities(tileRegion.area() / (RoomData.SIZE ** 2) * SpiderData.SPIDERS_PER_ROOM, SpiderData.SPAWN_EVENNESS, tileRegion, [
            EntitySpawner.spawnRequirements.replaceEmpty,
            EntitySpawner.spawnRequirements.solidAdjacent,
        ], Spider.spawn, safeRegion, world);
    });
});
//# sourceMappingURL=Spider.mjs.map