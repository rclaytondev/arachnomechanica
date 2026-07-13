import { Vector } from "./Vector.mjs";
export class Line {
    endpoint1;
    endpoint2;
    constructor(endpoint1, endpoint2) {
        this.endpoint1 = endpoint1;
        this.endpoint2 = endpoint2;
    }
    getX(y) {
        return this.endpoint1.x + ((y - this.endpoint1.y) / (this.endpoint2.y - this.endpoint1.y) * (this.endpoint2.x - this.endpoint1.x));
    }
    getY(x) {
        return this.endpoint1.y + ((x - this.endpoint1.x) / (this.endpoint2.x - this.endpoint1.x) * (this.endpoint2.y - this.endpoint1.y));
    }
    scale(num) {
        return new Line(this.endpoint1.multiply(num), this.endpoint2.multiply(num));
    }
    isHorizontal() {
        return this.endpoint1.y === this.endpoint2.y;
    }
    isVertical() {
        return this.endpoint1.x === this.endpoint2.x;
    }
    lineIntersection(line) {
        if (this.isVertical() && line.isVertical()) {
            return null;
        }
        else if (this.isVertical() || line.isVertical()) {
            const verticalLine = [this, line].find(v => v.isVertical());
            const otherLine = [this, line].find(v => !v.isVertical());
            return new Vector(verticalLine.endpoint1.x, otherLine.slope() * (verticalLine.endpoint1.x - otherLine.endpoint1.x) + otherLine.endpoint1.y);
        }
        const slope1 = this.slope();
        const slope2 = line.slope();
        if (slope1 === slope2) {
            return null;
        }
        const yIntercept1 = this.yIntercept();
        const yIntercept2 = line.yIntercept();
        const xIntersection = (yIntercept2 - yIntercept1) / (slope1 - slope2);
        const yIntersection = xIntersection * slope1 + yIntercept1;
        return new Vector(xIntersection, yIntersection);
    }
    intersection(line, line1Mode = "line", line2Mode = "line") {
        const intersection = this.lineIntersection(line);
        if (intersection === null) {
            return null;
        }
        const onSameSide = (value, value1, value2) => {
            if (value1 === value) {
                return true;
            }
            return (value1 > value) === (value2 > value);
        };
        const contains = (l, mode) => (!(mode !== "line"
            && (!onSameSide(l.endpoint1.x, l.endpoint2.x, intersection.x) || !onSameSide(l.endpoint1.y, l.endpoint2.y, intersection.y)))
            && !(mode === "segment"
                && (!onSameSide(l.endpoint1.x, l.endpoint2.x, intersection.x) || !onSameSide(l.endpoint1.y, l.endpoint2.y, intersection.y))));
        if (!contains(this, line1Mode) || !contains(line, line2Mode)) {
            return null;
        }
        return intersection;
    }
    contains(point) {
        if (this.isVertical()) {
            return point.x === this.endpoint1.x;
        }
        return this.getY(point.x) === point.y;
    }
    slope() {
        return (this.endpoint1.y - this.endpoint2.y) / (this.endpoint1.x - this.endpoint2.x);
    }
    yIntercept() {
        return (-this.slope() * this.endpoint1.x) + this.endpoint1.y;
    }
    isPerpendicularTo(line) {
        if (this.isVertical()) {
            return line.isHorizontal();
        }
        if (this.isHorizontal()) {
            return line.isVertical();
        }
        if (line.isHorizontal() || line.isVertical()) {
            return false;
        }
        return this.slope() === -1 / line.slope();
    }
    static areCollinear(points) {
        if (points.length <= 2) {
            return true;
        }
        const [p1, p2, ...others] = points;
        const line = new Line(p1, p2);
        return others.every(p => line.contains(p));
    }
}
//# sourceMappingURL=Line.mjs.map