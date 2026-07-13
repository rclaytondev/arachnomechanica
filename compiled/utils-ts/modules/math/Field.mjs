import { BigRational } from "./BigRational.mjs";
import { MathUtils } from "./MathUtils.mjs";
import { Rational } from "./Rational.mjs";
export class Field {
    zero;
    one;
    add;
    multiply;
    opposite;
    inverse;
    areEqual;
    constructor(zero, one, add, multiply, opposite, inverse, areEqual = (a, b) => a === b) {
        this.zero = zero;
        this.one = one;
        this.add = add;
        this.multiply = multiply;
        this.opposite = opposite;
        this.inverse = inverse;
        this.areEqual = areEqual;
    }
    subtract(element1, element2) {
        return this.add(element1, this.opposite(element2));
    }
    divide(element1, element2) {
        return this.multiply(element1, this.inverse(element2));
    }
    exponentiate(element, exponent) {
        let result = this.one;
        for (let i = 0; i < Math.abs(exponent); i++) {
            result = this.multiply(result, exponent > 0 ? element : this.inverse(element));
        }
        return result;
    }
    sum(...elements) {
        let result = this.zero;
        for (const element of elements) {
            result = this.add(result, element);
        }
        return result;
    }
    product(...elements) {
        let result = this.one;
        for (const element of elements) {
            result = this.multiply(result, element);
        }
        return result;
    }
    static integersModulo(modulo) {
        if (!MathUtils.isPrime(modulo)) {
            throw new Error(`Cannot construct the field of integers modulo ${modulo}: the result will not be a field since ${modulo} is not prime.`);
        }
        return new Field(0, 1, (a, b) => (a + b) % modulo, (a, b) => (a * b) % modulo, num => (num === 0) ? num : modulo - num, num => MathUtils.modularInverse(num, modulo));
    }
    static REALS = new Field(0, 1, (a, b) => a + b, (a, b) => a * b, x => -x, x => 1 / x);
    static RATIONALS = new Field(new Rational(0, 1), new Rational(1, 1), (a, b) => a.add(b), (a, b) => a.multiply(b), x => x.opposite(), x => x.inverse(), (a, b) => a.equals(b));
    static BIG_RATIONALS = new Field(new BigRational(0, 1), new BigRational(1, 1), (a, b) => a.add(b), (a, b) => a.multiply(b), x => x.opposite(), x => x.inverse(), (a, b) => a.equals(b));
}
//# sourceMappingURL=Field.mjs.map