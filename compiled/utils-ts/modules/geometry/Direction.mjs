export class Directions {
    static DIRECTIONS = ["left", "right", "up", "down"];
    static DIAGONALS = ["up-left", "up-right", "down-left", "down-right"];
    static isDirection(value) {
        return Directions.DIRECTIONS.includes(value);
    }
    static isDiagonal(value) {
        return Directions.DIAGONALS.includes(value);
    }
    static isHorizontal(value) {
        return (value === "left" || value === "right");
    }
    static isVertical(value) {
        return (value === "up" || value === "down");
    }
    static opposite = {
        "left": "right",
        "right": "left",
        "up": "down",
        "down": "up",
        "up-left": "down-right",
        "up-right": "down-left",
        "down-left": "up-right",
        "down-right": "up-left",
    };
    static rotateClockwise = {
        "left": "up",
        "up": "right",
        "right": "down",
        "down": "left",
        "up-left": "up-right",
        "up-right": "down-right",
        "down-right": "down-left",
        "down-left": "up-left",
    };
    static rotateCounterclockwise = {
        "left": "down",
        "down": "right",
        "right": "up",
        "up": "left",
        "up-left": "down-left",
        "down-left": "down-right",
        "down-right": "up-right",
        "up-right": "up-left",
    };
    static rotateClockwise45 = {
        "right": "down-right",
        "down-right": "down",
        "down": "down-left",
        "down-left": "left",
        "left": "up-left",
        "up-left": "up",
        "up": "up-right",
        "up-right": "right",
    };
    static rotateCounterclockwise45 = {
        "right": "up-right",
        "up-right": "up",
        "up": "up-left",
        "up-left": "left",
        "left": "down-left",
        "down-left": "down",
        "down": "down-right",
        "down-right": "right",
    };
    static rotate45 = {
        "clockwise": Directions.rotateClockwise45,
        "counterclockwise": Directions.rotateCounterclockwise45,
    };
    static rotate = {
        "clockwise": Directions.rotateClockwise,
        "counterclockwise": Directions.rotateCounterclockwise,
    };
    static reflectX = {
        "left": "right",
        "right": "left",
        "up": "up",
        "down": "down",
        "up-left": "up-right",
        "up-right": "up-left",
        "down-left": "down-right",
        "down-right": "down-left",
    };
    static angle = {
        "right": 0,
        "up-right": Math.PI / 4,
        "up": Math.PI / 2,
        "up-left": 3 * Math.PI / 4,
        "left": Math.PI,
        "down-left": 5 * Math.PI / 4,
        "down": 3 * Math.PI / 2,
        "down-right": 7 * Math.PI / 4,
    };
    static createDiagonal = {
        "left": {
            "up": "up-left",
            "down": "down-left",
        },
        "right": {
            "up": "up-right",
            "down": "down-right",
        },
    };
    static allByAngle(start, direction) {
        const result = [];
        let current = start;
        for (let i = 0; i < 8; i++) {
            result.push(current);
            current = Directions.rotate45[direction][current];
        }
        return result;
    }
    static nextIn(directions, start, angularDirection) {
        for (const direction of Directions.allByAngle(start, angularDirection)) {
            if (directions.includes(direction)) {
                return direction;
            }
        }
        throw new Error("Cannot get the next direction in an empty list.");
    }
}
;
//# sourceMappingURL=Direction.mjs.map