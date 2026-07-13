import { Directions } from "./geometry/Direction.mjs";
import { Rectangle } from "./geometry/Rectangle.mjs";
import { Vector } from "./geometry/Vector.mjs";
import { MathUtils } from "./math/MathUtils.mjs";
export class CanvasIO {
    canvas;
    ctx;
    parentElement;
    keys;
    mouse;
    linePointedness = 1;
    constructor(canvasID = "", parentElement = document.body) {
        this.canvas = document.createElement("canvas");
        this.canvas.id = canvasID;
        this.ctx = this.canvas.getContext("2d");
        this.parentElement = parentElement;
        this.keys = {};
        this.mouse = {
            position: new Vector(0, 0),
            pressed: false,
            button: null,
        };
    }
    attach() {
        /* add the canvas to fill its parent element, and update the internal width / height of the canvas so that 1 canvas pixel = 1 on-screen pixel*/
        this.parentElement.appendChild(this.canvas);
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.parentElement.style.margin = "0px";
        this.parentElement.style.overflow = "hidden";
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener("resize", () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    addEventListeners() {
        this.parentElement.addEventListener("keydown", (event) => {
            this.keys[event.code] = true;
        });
        this.parentElement.addEventListener("keyup", (event) => {
            this.keys[event.code] = false;
        });
        this.canvas.addEventListener("mousedown", (event) => {
            this.mouse.pressed = true;
            this.mouse.button = (event.button === 0) ? "left" : "right";
        });
        this.canvas.addEventListener("mouseup", () => {
            this.mouse.pressed = false;
            this.mouse.button = null;
        });
        this.canvas.addEventListener("mousemove", (event) => {
            const canvasRect = this.canvas.getBoundingClientRect();
            this.mouse.position.x = (event.clientX - canvasRect.left) / (canvasRect.right - canvasRect.left) * this.canvas.width;
            this.mouse.position.y = (event.clientY - canvasRect.top) / (canvasRect.bottom - canvasRect.top) * this.canvas.height;
        });
        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    }
    width() {
        return this.canvas.getBoundingClientRect().width;
    }
    height() {
        return this.canvas.getBoundingClientRect().height;
    }
    boundingBox() {
        return Rectangle.fromDimensions(0, 0, this.width(), this.height());
    }
    strokeRect(rectangle) {
        this.ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    }
    fillRect(rectangle) {
        this.ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    }
    fillSquare(x, y, size) {
        this.ctx.fillRect(x, y, size, size);
    }
    strokeSquare(x, y, size) {
        this.ctx.strokeRect(x, y, size, size);
    }
    strokeLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    fillCanvas(color) {
        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width(), this.height());
        this.ctx.restore();
    }
    drawArrow(center, radius, direction) {
        const rotationAngles = {
            "right": 0,
            "down": 90,
            "left": 180,
            "up": 270,
        };
        this.ctx.save();
        this.ctx.translate(center.x, center.y);
        this.ctx.rotate(MathUtils.toRadians(rotationAngles[direction]));
        this.ctx.beginPath();
        this.ctx.moveTo(radius, 0);
        this.ctx.lineTo(radius * Math.cos(MathUtils.toRadians(120)), radius * Math.sin(MathUtils.toRadians(120)));
        this.ctx.lineTo(radius * Math.cos(MathUtils.toRadians(240)), radius * Math.sin(MathUtils.toRadians(240)));
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }
    polygon(...points) {
        if (typeof points[0] === "number") {
            if (points.length % 2 !== 0) {
                throw new Error(`Cannot draw polygon; the number of coordinates provided must be an even number, but instead the coordinates list was [${points.join(", ")}].`);
            }
            if (points.length < 4) {
                throw new Error(`Cannot draw polygon; at least 2 points must be provided, but instead the coordinates list was [${points.join(", ")}].`);
            }
            const coordinates = points;
            this.ctx.moveTo(coordinates[0], coordinates[1]);
            for (let i = 2; i + 1 < points.length; i += 2) {
                this.ctx.lineTo(coordinates[i], coordinates[i + 1]);
            }
            this.ctx.closePath();
        }
        else {
            const vectors = points;
            this.polygon(...vectors.map(v => [v.x, v.y]).flat());
        }
    }
    moveTo(point) {
        this.ctx.moveTo(point.x, point.y);
    }
    lineTo(point) {
        this.ctx.lineTo(point.x, point.y);
    }
    arcTo(point1, point2, radius) {
        this.ctx.arcTo(point1.x, point1.y, point2.x, point2.y, radius);
    }
    arcAbout(center, point1, point2, radius) {
        const angle1 = point1.subtract(center).angle();
        const angle2 = point2.subtract(center).angle();
        this.ctx.arc(center.x, center.y, radius, angle1, angle2);
    }
    fillPoly(...coordinates) {
        this.ctx.beginPath();
        this.polygon(...coordinates);
        this.ctx.fill();
    }
    circle(x, y, radius) {
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    }
    fillCircle(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    fillArc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
        this.ctx.lineTo(x, y);
        this.ctx.fill();
    }
    fillDiamond(x, y, radius) {
        this.fillPoly(x - radius, y, x, y - radius, x + radius, y, x, y + radius);
    }
    strokeCircle(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    gradientLine(x1, y1, x2, y2, innerColor, innerThickness, outerColor, totalThickness) {
        const mainPerpendicular = new Vector(x2, y2).subtract(new Vector(x1, y1)).normalize().rotate(90);
        for (const perpendicular of [mainPerpendicular, mainPerpendicular.multiply(-1)]) {
            const gradient = this.ctx.createLinearGradient(x1, y1, x1 + perpendicular.x * totalThickness, y1 + perpendicular.y * totalThickness);
            gradient.addColorStop(0, innerColor);
            gradient.addColorStop(innerThickness / totalThickness, innerColor);
            gradient.addColorStop(1, outerColor);
            this.ctx.fillStyle = gradient;
            this.fillPoly(new Vector(x1, y1).add(perpendicular.multiply(-1)), new Vector(x1, y1).add(perpendicular.multiply(totalThickness)), new Vector(x2, y2).add(perpendicular.multiply(totalThickness)), new Vector(x2, y2).add(perpendicular.multiply(-1)));
        }
        for (const [endpoint, direction] of [[new Vector(x1, y1), 1], [new Vector(x2, y2), -1]]) {
            const gradient = this.ctx.createRadialGradient(endpoint.x, endpoint.y, innerThickness, endpoint.x, endpoint.y, totalThickness);
            gradient.addColorStop(0, innerColor);
            gradient.addColorStop(1, outerColor);
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(endpoint.x, endpoint.y, totalThickness, Math.atan2(mainPerpendicular.y * direction, mainPerpendicular.x * direction), Math.atan2(-mainPerpendicular.y * direction, -mainPerpendicular.x * direction));
            this.ctx.fill();
        }
    }
    pointedLine(x1, y1, x2, y2, pointed = true) {
        if (!pointed) {
            this.strokeLine(x1, y1, x2, y2);
            return;
        }
        const tangent = new Vector(x2 - x1, y2 - y1).normalize();
        const normal = new Vector(-tangent.y, tangent.x);
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.fillPoly(x1 + normal.x / 2 * this.ctx.lineWidth, y1 + normal.y / 2 * this.ctx.lineWidth, x2 + normal.x / 2 * this.ctx.lineWidth, y2 + normal.y / 2 * this.ctx.lineWidth, x2 + tangent.x / 2 * this.ctx.lineWidth * this.linePointedness, y2 + tangent.y / 2 * this.ctx.lineWidth * this.linePointedness, x2 - normal.x / 2 * this.ctx.lineWidth, y2 - normal.y / 2 * this.ctx.lineWidth, x1 - normal.x / 2 * this.ctx.lineWidth, y1 - normal.y / 2 * this.ctx.lineWidth, x1 - tangent.x / 2 * this.ctx.lineWidth * this.linePointedness, y1 - tangent.y / 2 * this.ctx.lineWidth * this.linePointedness);
    }
    halfPointedLine(x1, y1, x2, y2, pointed = true) {
        if (!pointed) {
            this.strokeLine(x1, y1, x2, y2);
            return;
        }
        const tangent = new Vector(x2 - x1, y2 - y1).normalize();
        const normal = new Vector(-tangent.y, tangent.x);
        this.ctx.fillStyle = this.ctx.strokeStyle;
        this.ctx.beginPath();
        this.ctx.moveTo(x1 + normal.x / 2 * this.ctx.lineWidth, y1 + normal.y / 2 * this.ctx.lineWidth);
        this.ctx.lineTo(x2 + normal.x / 2 * this.ctx.lineWidth, y2 + normal.y / 2 * this.ctx.lineWidth);
        this.ctx.lineTo(x2 + tangent.x / 2 * this.ctx.lineWidth * this.linePointedness, y2 + tangent.y / 2 * this.ctx.lineWidth * this.linePointedness);
        this.ctx.lineTo(x2 - normal.x / 2 * this.ctx.lineWidth, y2 - normal.y / 2 * this.ctx.lineWidth);
        this.ctx.lineTo(x1 - normal.x / 2 * this.ctx.lineWidth, y1 - normal.y / 2 * this.ctx.lineWidth);
        this.ctx.arc(x1, y1, this.ctx.lineWidth / 2, tangent.angle() + Math.PI / 2, tangent.angle() + 3 * Math.PI / 2);
        this.ctx.fill();
    }
    clipRect(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();
    }
    clipArc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
        this.ctx.clip();
    }
    rotateTo(start, end) {
        const startAngle = typeof start === "number" ? start : Directions.angle[start];
        const endAngle = typeof end === "number" ? end : Directions.angle[end];
        this.ctx.rotate(startAngle - endAngle);
    }
    measureText(text, font) {
        this.ctx.save();
        this.ctx.font = font;
        const result = this.ctx.measureText(text);
        this.ctx.restore();
        return result;
    }
    static keyDirection(event) {
        if (event.key === "ArrowRight") {
            return "right";
        }
        else if (event.key === "ArrowLeft") {
            return "left";
        }
        else if (event.key === "ArrowUp") {
            return "up";
        }
        else if (event.key === "ArrowDown") {
            return "down";
        }
        else {
            return null;
        }
    }
    keyDirection(allowDiagonals) {
        const left = (this.keys["ArrowLeft"] && !this.keys["ArrowRight"]);
        const right = (this.keys["ArrowRight"] && !this.keys["ArrowLeft"]);
        const up = (this.keys["ArrowUp"] && !this.keys["ArrowDown"]);
        const down = (this.keys["ArrowDown"] && !this.keys["ArrowUp"]);
        if (left && up && allowDiagonals) {
            return "up-left";
        }
        if (right && up && allowDiagonals) {
            return "up-right";
        }
        if (left && down && allowDiagonals) {
            return "down-left";
        }
        if (right && down && allowDiagonals) {
            return "down-right";
        }
        if (left) {
            return "left";
        }
        if (right) {
            return "right";
        }
        if (up) {
            return "up";
        }
        if (down) {
            return "down";
        }
        return null;
    }
    numberKeys() {
        const keys = [];
        for (let i = 0; i <= 9; i++) {
            if (this.keys[`Digit${i}`]) {
                keys.push(i);
            }
        }
        return keys;
    }
    regularPolygon(center, size, numSides, angle = 0) {
        this.ctx.moveTo(center.x + size * Math.cos(angle), center.y + size * Math.sin(angle));
        for (let i = 1; i < numSides; i++) {
            const vertexAngle = angle + (i / numSides * 2 * Math.PI);
            this.ctx.lineTo(center.x + size * Math.cos(vertexAngle), center.y + size * Math.sin(vertexAngle));
        }
        this.ctx.closePath();
    }
    fillRegularPoly(center, size, numSides, angle = 0) {
        this.ctx.beginPath();
        this.regularPolygon(center, size, numSides, angle);
        this.ctx.fill();
    }
    strokeRegularPoly(center, size, numSides, angle = 0) {
        this.ctx.beginPath();
        this.regularPolygon(center, size, numSides, angle);
        this.ctx.stroke();
    }
}
const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
let canvasIO = null;
if (isBrowser()) {
    canvasIO = new CanvasIO();
    canvasIO.attach();
    canvasIO.addEventListeners();
}
export { canvasIO as canvasIO };
//# sourceMappingURL=CanvasIO.mjs.map