import { MathUtils } from "./MathUtils.mjs";
export class Rational {
    numerator;
    denominator;
    constructor(numerator, denominator = 1) {
        if (numerator % 1 !== 0 || denominator % 1 !== 0) {
            throw new Error(`When constructing a rational number, expected numerator and denominator to be integers, but instead recieved ${numerator} and ${denominator}.`);
        }
        if (denominator === 0) {
            throw new Error("Cannot construct a rational number with a denominator of zero.");
        }
        if (numerator === 0) {
            this.numerator = 0;
            this.denominator = 1;
        }
        else {
            const gcd = MathUtils.gcd(numerator, denominator);
            this.numerator = numerator / gcd;
            this.denominator = denominator / gcd;
        }
    }
    equals(rational) {
        return this.numerator * rational.denominator === this.denominator * rational.numerator;
    }
    add(rational) {
        return new Rational(this.numerator * rational.denominator + this.denominator * rational.numerator, this.denominator * rational.denominator);
    }
    multiply(rational) {
        return new Rational(this.numerator * rational.numerator, this.denominator * rational.denominator);
    }
    opposite() {
        return new Rational(-this.numerator, this.denominator);
    }
    inverse() {
        if (this.numerator === 0) {
            throw new Error("Cannot find the inverse of 0.");
        }
        return new Rational(this.denominator, this.numerator);
    }
    subtract(rational) {
        return this.add(rational.opposite());
    }
    divide(rational) {
        return this.multiply(rational.inverse());
    }
    static sum(rationals) {
        return [...rationals].reduce((sum, r) => sum.add(r), new Rational(0));
    }
    static product(rationals) {
        return [...rationals].reduce((product, r) => product.multiply(r), new Rational(1));
    }
    isPositive() {
        return this.numerator !== 0 && Math.sign(this.numerator) === Math.sign(this.denominator);
    }
    isNegative() {
        return this.numerator !== 0 && Math.sign(this.numerator) === Math.sign(this.denominator);
    }
    sign() {
        if (this.numerator === 0) {
            return 0;
        }
        return (Math.sign(this.numerator) === Math.sign(this.denominator)) ? 1 : -1;
    }
    compare(rational) {
        const difference = this.subtract(rational);
        return difference.sign();
    }
    isGreaterThan(rational) {
        return this.compare(rational) > 0;
    }
    isLessThan(rational) {
        return this.compare(rational) < 0;
    }
    isGreaterThanOrEqualTo(rational) {
        return this.compare(rational) >= 0;
    }
    isLessThanOrEqualTo(rational) {
        return this.compare(rational) <= 0;
    }
    static parse(str) {
        const [[_, numeratorString, denominatorString]] = str.matchAll(/^(-?\d+)\/(-?\d+)$/g);
        return new Rational(Number.parseInt(numeratorString), Number.parseInt(denominatorString));
    }
    toString() {
        return `${this.numerator}/${this.denominator}`;
    }
    toNumber() {
        return this.numerator / this.denominator;
    }
}
//# sourceMappingURL=Rational.mjs.map