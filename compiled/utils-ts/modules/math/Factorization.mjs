import { ArrayUtils } from "../core-extensions/ArrayUtils.mjs";
import { GenUtils } from "../core-extensions/GenUtils.mjs";
import { MapUtils } from "../core-extensions/MapUtils.mjs";
import { MathUtils } from "./MathUtils.mjs";
import { Sequence } from "./Sequence.mjs";
export class Factorization {
    exponents = new Map();
    constructor(exponents) {
        this.exponents = MapUtils.filter(exponents, (p, e) => e !== 0);
    }
    static ONE = new Factorization(new Map());
    static fromPrime(prime) {
        return new Factorization(new Map([[prime, 1]]));
    }
    static fromPrimePower(prime, exponent) {
        return new Factorization(new Map([[prime, exponent]]));
    }
    static fromNumber(num) {
        return new Factorization(MathUtils.factorize(num));
    }
    static exponentInFactorial(num, prime) {
        let exponent = 0;
        for (let i = 1; prime ** i <= num; i++) {
            exponent += Math.floor(num / (prime ** i));
        }
        return exponent;
    }
    static factorial(num) {
        const primes = [...Sequence.PRIMES.termsBelow(num, "inclusive")];
        const exponents = new Map();
        for (const prime of primes) {
            exponents.set(prime, Factorization.exponentInFactorial(num, prime));
        }
        return new Factorization(exponents);
    }
    static lcm(...factorizations) {
        const result = new Map();
        for (const factorization of factorizations) {
            for (const [prime, exponent] of factorization.exponents) {
                result.set(prime, Math.max(exponent, result.get(prime) ?? -Infinity));
            }
        }
        return new Factorization(result);
    }
    toNumber() {
        return MathUtils.unfactorize(this.exponents);
    }
    toString() {
        if (this.exponents.size === 0) {
            return "1";
        }
        const primePowers = [...this.exponents.entries()].sort((a, b) => a[0] - b[0]);
        const formatPrimePower = (p, e) => (e === 1) ? `${p}` : `${p}^${e}`;
        return primePowers.map(([p, e]) => formatPrimePower(p, e)).join(" * ");
    }
    factors() {
        return [...this.exponents.keys()];
    }
    divisors() {
        const divisors = [];
        const primes = this.factors();
        for (const exponents of GenUtils.cartesianProduct(...primes.map((p) => ArrayUtils.range(0, this.exponents.get(p))))) {
            divisors.push(new Factorization(new Map(primes.map((p, i) => [p, exponents[i]]))));
        }
        return divisors;
    }
    multiply(factorization) {
        const primes = new Set([...this.exponents.keys(), ...factorization.exponents.keys()]);
        return new Factorization(new Map([...primes].map(p => [p, (this.exponents.get(p) ?? 0) + (factorization.exponents.get(p) ?? 0)])));
    }
    exponentiate(power) {
        const exponents = new Map();
        for (const [prime, exponent] of this.exponents) {
            exponents.set(prime, exponent * power);
        }
        return new Factorization(exponents);
    }
    divides(factorization) {
        return [...this.exponents.entries()].every(([prime, exponent]) => exponent <= (factorization.exponents.get(prime) ?? 0));
    }
    isCoprimeTo(factorization) {
        for (const [prime, exponent] of this.exponents.entries()) {
            const otherExponent = factorization.exponents.get(prime);
            if (exponent > 0 && otherExponent != undefined && otherExponent > 0) {
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=Factorization.mjs.map