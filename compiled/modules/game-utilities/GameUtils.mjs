import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { HashSet } from "../../utils-ts/modules/HashSet.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { Particle } from "./Particle.mjs";
export class GameUtils {
    static frameCount = 0;
    static moveTowards(value, target, speed) {
        if (value < target) {
            return Math.min(value + speed, target);
        }
        else {
            return Math.max(value - speed, target);
        }
    }
    static moveVectorTowards(value, target, speed) {
        const distance = Vector.dist(value, target);
        if (distance <= speed) {
            return target;
        }
        const direction = target.subtract(value).normalize();
        return value.add(direction.multiply(speed));
    }
    static lerp(value, min1, max1, min2, max2) {
        if (min1 === max1) {
            throw new Error("Cannot lerp because the source range had a length of zero.");
        }
        return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
    }
    static lerpAngle(value, min1, max1, min2, max2) {
        /* As `value` moves from `min1` to `max1`, the output will move from `min2` to `max2`, taking the shorter path around the circle. */
        const closest = ArrayUtils.minValue([max2, max2 + 2 * Math.PI, max2 - 2 * Math.PI], n => MathUtils.dist(min2, n));
        return GameUtils.lerp(value, min1, max1, min2, closest);
    }
    static moveAngleTowards(angle, target, speed) {
        angle = MathUtils.generalizedModulo(angle, 2 * Math.PI);
        target = MathUtils.generalizedModulo(target, 2 * Math.PI);
        const closest = ArrayUtils.minValue([target, target + 2 * Math.PI, target - 2 * Math.PI], n => MathUtils.dist(angle, n));
        return GameUtils.moveTowards(angle, closest, speed);
    }
    static angleDistance(angle1, angle2) {
        return Math.abs(GameUtils.signedAngleDistance(angle1, angle2));
    }
    static signedAngleDistance(angle1, angle2) {
        return GameUtils.signedModularDistance(angle1, angle2, 2 * Math.PI);
    }
    static signedModularDistance(num1, num2, modulo) {
        num1 = MathUtils.generalizedModulo(num1, modulo);
        num2 = MathUtils.generalizedModulo(num2, modulo);
        return ArrayUtils.minValue([
            num2 - num1,
            num2 + modulo - num1,
            num2 - modulo - num1,
        ], Math.abs);
    }
    static toroidalDistance(point1, point2, width, height = width) {
        return Math.sqrt(GameUtils.signedModularDistance(point1.x, point2.x, width) ** 2
            + GameUtils.signedModularDistance(point1.y, point2.y, height) ** 2);
    }
    static taxicabDistance(point1, point2) {
        return MathUtils.dist(point1.x, point2.x) + MathUtils.dist(point1.y, point2.y);
    }
    static diagonalAngle(direction1, direction2) {
        if ((direction1 === "right" && direction2 === "up") || (direction1 === "up" && direction2 === "right")) {
            return Math.PI / 4;
        }
        else if ((direction1 === "up" && direction2 === "left") || (direction1 === "left" && direction2 === "up")) {
            return 3 * Math.PI / 4;
        }
        else if ((direction1 === "left" && direction2 === "down") || (direction1 === "down" && direction2 === "left")) {
            return 5 * Math.PI / 4;
        }
        else if ((direction1 === "down" && direction2 === "right") || (direction1 === "right" && direction2 === "down")) {
            return 7 * Math.PI / 4;
        }
        else {
            return Directions.angle[direction1];
        }
    }
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    static randomPermutation(items) {
        items = [...items];
        const result = [];
        while (items.length > 0) {
            const index = ArrayUtils.randomIndex(items);
            result.push(items[index]);
            items.splice(index, 1);
        }
        return result;
    }
    static weightedRandom(items, weights) {
        if (weights.every(w => w === 0)) {
            return ArrayUtils.randomItem(items);
        }
        const sum = MathUtils.sum(weights);
        const randomValue = GameUtils.random(0, sum);
        let partialSum = 0;
        for (let i = 0; i < items.length; i++) {
            partialSum += weights[i];
            if (partialSum >= randomValue) {
                return items[i];
            }
        }
        throw new Error("Unexpected: unreachable code reached in weightedRandom.");
    }
    static randomInCircle(centerX, centerY, radius) {
        const angle = GameUtils.random(0, 360);
        const distance = Math.sqrt(Math.random()) * radius;
        return new Vector(centerX, centerY).add(new Vector(0, distance).rotate(angle));
    }
    static randomInRect(rectangle, random = GameUtils.random) {
        return new Vector(random(rectangle.left, rectangle.right), random(rectangle.top, rectangle.bottom));
    }
    static pastKeys = {};
    static startedPressingKey(canvasIO) {
        return Object.keys(canvasIO.keys).some(k => canvasIO.keys[k] && !GameUtils.pastKeys[k]);
    }
    static randomEvenlySpaced(options) {
        const result = [];
        while (result.length < options.amount) {
            const candidates = new Array(options.trials).fill(0).map(options.generate);
            const previous = [...result, ...(options.previousPoints ?? [])];
            if (previous.length === 0) {
                result.push(candidates[0]);
            }
            else {
                result.push(ArrayUtils.maxValue(candidates, point => ArrayUtils.minOutput(previous, p => options.metric(point, p))));
            }
        }
        return result;
    }
    static hexColor(red, green, blue, alpha) {
        return `#${[red, green, blue, alpha].map(n => Math.floor(n).toString(16).padStart(2, "0")).join("")}`;
    }
    static glowCircle(x, y, size, intensity, canvasIO, red = 255, green = 255, blue = 255) {
        GameUtils.glowArc(x, y, 0, size, intensity, canvasIO, 0, 2 * Math.PI, red, green, blue);
    }
    static glowCircleOutline(x, y, size, thickness, intensity, canvasIO, red = 255, green = 255, blue = 255) {
        GameUtils.glowArc(x, y, size, size + thickness, intensity, canvasIO, 0, 2 * Math.PI, red, green, blue);
        GameUtils.glowArc(x, y, size, size - thickness, intensity, canvasIO, 0, 2 * Math.PI, red, green, blue);
    }
    static glowArc(x, y, size1, size2, intensity, canvasIO, startAngle, endAngle, red = 255, green = 255, blue = 255) {
        const gradient = GameUtils.glowCircleGradient(size1, size2, intensity, red, green, blue);
        canvasIO.ctx.save();
        canvasIO.ctx.translate(x, y);
        canvasIO.ctx.fillStyle = gradient;
        canvasIO.ctx.globalCompositeOperation = "lighter";
        if (size1 !== 0 && size1 < size2) {
            canvasIO.ctx.beginPath();
            canvasIO.circle(0, 0, size2);
            canvasIO.circle(0, 0, size1);
            canvasIO.ctx.clip("evenodd");
        }
        canvasIO.fillArc(0, 0, Math.max(size1, size2), startAngle, endAngle);
        canvasIO.ctx.restore();
    }
    static glowLine(x1, y1, x2, y2, size, intensity, canvasIO, red = 255, green = 255, blue = 255) {
        const offset = new Vector(x2 - x1, y2 - y1);
        const length = offset.magnitude();
        canvasIO.ctx.save();
        canvasIO.ctx.globalCompositeOperation = "lighter";
        canvasIO.ctx.translate(x1, y1);
        canvasIO.ctx.rotate(offset.angle());
        canvasIO.ctx.fillStyle = GameUtils.glowLineGradient(size, intensity, red, green, blue);
        canvasIO.ctx.fillRect(0, -size, length, size);
        canvasIO.ctx.restore();
    }
    static glowOutline(x1, y1, x2, y2, size, intensity, canvasIO, red = 255, green = 255, blue = 255) {
        GameUtils.glowLine(x1, y1, x2, y2, size, intensity, canvasIO, red, green, blue);
        GameUtils.glowLine(x2, y2, x1, y1, size, intensity, canvasIO, red, green, blue);
        const length = Math.hypot(x1 - x2, y1 - y2);
        canvasIO.ctx.save();
        canvasIO.ctx.translate(x1, y1);
        canvasIO.ctx.rotate(new Vector(x2 - x1, y2 - y1).angle());
        GameUtils.glowArc(0, 0, 0, size, intensity, canvasIO, Math.PI / 2, 3 * Math.PI / 2, red, green, blue);
        GameUtils.glowArc(length, 0, 0, size, intensity, canvasIO, -Math.PI / 2, Math.PI / 2, red, green, blue);
        canvasIO.ctx.restore();
    }
    static glowCircleGradients = new Map();
    static glowLineGradients = new Map();
    static glowCircleGradient(size1, size2, intensity, red = 255, green = 255, blue = 255) {
        const argsString = `${size1}, ${size2} ${intensity}, ${red}, ${green}, ${blue}`;
        const cachedResult = GameUtils.glowCircleGradients.get(argsString);
        if (cachedResult) {
            return cachedResult;
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createRadialGradient(0, 0, size1, 0, 0, size2);
        for (let i = 0; i < 1; i += 1 / Math.abs(size2 - size1)) {
            const opacity = Math.floor(intensity * 255 * (1 - i) ** 2);
            const color = GameUtils.hexColor(red, green, blue, opacity);
            gradient.addColorStop(i, color);
        }
        GameUtils.glowCircleGradients.set(argsString, gradient);
        return gradient;
    }
    static glowLineGradient(length, intensity, red = 255, green = 255, blue = 255) {
        length = Math.floor(length);
        const argsString = `${length}, ${intensity}, ${red}, ${green}, ${blue}`;
        const cachedResult = GameUtils.glowLineGradients.get(argsString);
        if (cachedResult) {
            return cachedResult;
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, -length);
        for (let i = 0; i < 1; i += 1 / length) {
            const color = GameUtils.hexColor(red, green, blue, Math.floor(intensity * 255 * (1 - i) ** 2));
            gradient.addColorStop(i, color);
        }
        GameUtils.glowLineGradients.set(argsString, gradient);
        return gradient;
    }
    static shatterParticles(display, world, position, pieces, maxVelocity, canvasIO, angleEvenness, settings) {
        const angles = GameUtils.randomEvenlySpaced({
            generate: () => GameUtils.random(0, 2 * Math.PI),
            metric: MathUtils.dist,
            amount: pieces - 1,
            trials: angleEvenness,
        }).sort((a, b) => a - b);
        for (const [i, angle] of [0, ...angles, 2 * Math.PI].entries()) {
            const next = angles[i + 1];
            if (typeof next !== "number") {
                break;
            }
            const velocity = new Vector(Math.cos(-(angle + next) / 2), -Math.sin(-(angle + next) / 2)).multiply(maxVelocity);
            const displaySector = () => {
                canvasIO.ctx.save();
                canvasIO.clipArc(0, 0, 100, angle, next);
                canvasIO.ctx.translate(-position.x, -position.y);
                display(canvasIO);
                canvasIO.ctx.restore();
            };
            world.particles.add(new Particle(position, velocity, { ...settings, shape: displaySector, rotation: 0 }), world, canvasIO);
        }
    }
    static lerpColor(value, min, max, color1, color2) {
        if (value < min) {
            return color1;
        }
        if (value > max) {
            return color2;
        }
        return {
            red: GameUtils.lerp(value, min, max, color1.red, color2.red),
            green: GameUtils.lerp(value, min, max, color1.green, color2.green),
            blue: GameUtils.lerp(value, min, max, color1.blue, color2.blue),
        };
    }
    static formatColor(color) {
        return `rgb(${color.red}, ${color.green}, ${color.blue})`;
    }
    static loadImage(filePath, width, height) {
        const element = document.createElement("img");
        element.src = filePath;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        element.onload = () => {
            ctx.drawImage(element, 0, 0, width, height);
        };
        return canvas;
    }
    static rayIntersectsVertical(rayStart, rayDirection, verticalLineX) {
        if ((rayDirection.x < 0 && rayStart.x < verticalLineX) || (rayDirection.x > 0 && rayStart.x > verticalLineX)) {
            return Infinity;
        }
        return (verticalLineX - rayStart.x) / rayDirection.x;
    }
    static rayIntersectsHorizontal(rayStart, rayDirection, horizontalLineY) {
        if ((rayDirection.y < 0 && rayStart.y < horizontalLineY) || (rayDirection.y > 0 && rayStart.y > horizontalLineY)) {
            return Infinity;
        }
        return (horizontalLineY - rayStart.y) / rayDirection.y;
    }
    static rayIntersectsHSegment(rayStart, rayDirection, horizontalLineY, xStart, xEnd) {
        const distance = GameUtils.rayIntersectsHorizontal(rayStart, rayDirection, horizontalLineY);
        const intersectionX = rayStart.x + distance * rayDirection.x;
        return (xStart <= intersectionX && intersectionX <= xEnd) ? distance : Infinity;
    }
    static rayIntersectsVSegment(rayStart, rayDirection, verticalLineX, yStart, yEnd) {
        const distance = GameUtils.rayIntersectsVertical(rayStart, rayDirection, verticalLineX);
        const intersectionY = rayStart.y + distance * rayDirection.y;
        return (yStart <= intersectionY && intersectionY <= yEnd) ? distance : Infinity;
    }
    static rayIntersectsRectangle(rayStart, rayDirection, rectangle) {
        if (rectangle.contains(rayStart)) {
            return 0;
        }
        return Math.min(GameUtils.rayIntersectsHSegment(rayStart, rayDirection, rectangle.top, rectangle.left, rectangle.right), GameUtils.rayIntersectsHSegment(rayStart, rayDirection, rectangle.bottom, rectangle.left, rectangle.right), GameUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.left, rectangle.top, rectangle.bottom), GameUtils.rayIntersectsVSegment(rayStart, rayDirection, rectangle.right, rectangle.top, rectangle.bottom));
    }
    static rayIntersectsSegment(rayStart, rayDirection, endpoint1, endpoint2) {
        if (endpoint1.x === endpoint2.x) {
            return GameUtils.rayIntersectsVSegment(rayStart, rayDirection, endpoint1.x, Math.min(endpoint1.y, endpoint2.y), Math.max(endpoint1.y, endpoint2.y));
        }
        if (endpoint1.y === endpoint2.y) {
            return GameUtils.rayIntersectsHSegment(rayStart, rayDirection, endpoint1.y, Math.min(endpoint1.x, endpoint2.x), Math.max(endpoint1.x, endpoint2.x));
        }
        const lineDirection = endpoint2.subtract(endpoint1);
        const distance = (endpoint1.y + (rayStart.x - endpoint1.x) / lineDirection.x * lineDirection.y - rayStart.y) / (rayDirection.y - rayDirection.x / lineDirection.x * lineDirection.y);
        const intersection = rayStart.add(rayDirection.multiply(distance));
        if (distance >= 0
            && Rectangle.fromOppositeCorners(endpoint1, endpoint2).contains(intersection)) {
            return distance;
        }
        return Infinity;
    }
    static rayIntersectsPoint(rayStart, rayDirection, point) {
        if (point.equals(rayStart)) {
            return 0;
        }
        if (rayDirection.x === 0) {
            const intersects = rayDirection.y !== 0 && point.x === rayStart.x && Math.sign(point.y - rayStart.y) === Math.sign(rayDirection.y);
            return intersects ? (point.y - rayStart.y) / rayDirection.y : Infinity;
        }
        if (rayDirection.y === 0) {
            const intersects = rayDirection.x !== 0 && point.y === rayStart.y && Math.sign(point.x - rayStart.x) === Math.sign(rayDirection.x);
            return intersects ? (point.x - rayStart.x) / rayDirection.x : Infinity;
        }
        const multiplierX = (point.x - rayStart.x) / rayDirection.x;
        const multiplierY = (point.y - rayStart.y) / rayDirection.y;
        const intersects = multiplierX === multiplierY && multiplierX > 0;
        return intersects ? multiplierX : Infinity;
    }
    static gridSquaresContaining(point, gridSize = 1) {
        point = point.divide(gridSize);
        const result = [];
        for (const x of new Set([Math.floor(point.x), Math.ceil(point.x) - 1])) {
            for (const y of new Set([Math.floor(point.y), Math.ceil(point.y) - 1])) {
                result.push(new Vector(x, y));
            }
        }
        return result;
    }
    static gridSquaresOnRay(rayStart, rayDirection, maxDistance, gridSize = 1) {
        rayStart = rayStart.divide(gridSize);
        rayDirection = rayDirection.divide(gridSize);
        const result = [];
        const add = (v) => {
            if (!result.some(w => w.equals(v))) {
                result.push(v);
            }
        };
        let point = rayStart;
        while (Vector.dist(point, rayStart) < maxDistance * rayDirection.magnitude()) {
            GameUtils.gridSquaresContaining(point).forEach(add);
            let distance = Infinity;
            if (rayDirection.x > 0) {
                distance = Math.min(distance, GameUtils.rayIntersectsVertical(point, rayDirection, Math.floor(point.x) + 1));
            }
            else if (rayDirection.x < 0) {
                distance = Math.min(distance, GameUtils.rayIntersectsVertical(point, rayDirection, Math.ceil(point.x) - 1));
            }
            if (rayDirection.y > 0) {
                distance = Math.min(distance, GameUtils.rayIntersectsHorizontal(point, rayDirection, Math.floor(point.y) + 1));
            }
            else if (rayDirection.y < 0) {
                distance = Math.min(distance, GameUtils.rayIntersectsHorizontal(point, rayDirection, Math.ceil(point.y) - 1));
            }
            distance = Math.max(distance, 10 ** -10); // prevent it from getting stuck due to floating point errors
            if (distance === Infinity) {
                throw new Error("The ray did not intersect any grid squares. (This may happen if rayDirection = 0).");
            }
            point = point.add(rayDirection.multiply(distance));
        }
        return result;
    }
    static rectIntersectionDistance(rect, direction, target) {
        if (rect.intersects(target)) {
            return 0;
        }
        if (Directions.isHorizontal(direction)) {
            if (!(rect.bottom > target.y && rect.y < target.bottom)) {
                return Infinity;
            }
            const distance = (direction === "right") ? target.x - rect.right : rect.x - target.right;
            return distance >= 0 ? distance : Infinity;
        }
        else {
            if (!(rect.right > target.x && rect.x < target.right)) {
                return Infinity;
            }
            const distance = (direction === "down") ? target.y - rect.bottom : rect.y - target.bottom;
            return distance >= 0 ? distance : Infinity;
        }
    }
    static reachableNodes(startNode, neighbors, hashFunction) {
        const visited = new HashSet([startNode], hashFunction);
        const boundary = [startNode];
        while (boundary.length !== 0) {
            const node = boundary.pop();
            for (const neighbor of neighbors(node)) {
                if (!visited.has(neighbor)) {
                    boundary.push(neighbor);
                }
                visited.add(neighbor);
            }
            visited.add(node);
        }
        return [...visited];
    }
}
//# sourceMappingURL=GameUtils.mjs.map