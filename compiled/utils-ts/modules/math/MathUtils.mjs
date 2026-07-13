import { BigintMath } from "./BigintMath.mjs";
export class MathUtils {
    static sum(numbers) {
        return [...numbers].reduce((accumulator, value) => accumulator + value, 0);
    }
    static product(numbers) {
        return [...numbers].reduce((accumulator, value) => accumulator * value, 1);
    }
    static dist(num1, num2) {
        return Math.abs(num1 - num2);
    }
    static toRadians(degrees) {
        return degrees / 180 * Math.PI;
    }
    static toDegrees(radians) {
        return radians / Math.PI * 180;
    }
    static constrain(value, min, max) {
        [min, max] = [Math.min(min, max), Math.max(min, max)];
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }
    static isPrime(n) {
        if (n <= 1 || n !== Math.floor(n)) {
            return false;
        }
        for (let k = 2; k <= Math.sqrt(n); k++) {
            if (n % k === 0) {
                return false;
            }
        }
        return true;
    }
    static generalizedModulo(num, modulo) {
        if (modulo <= 0) {
            throw new Error("Cannot take the modulo by a negative number or 0.");
        }
        if (num >= 0) {
            return num % modulo;
        }
        return num + modulo * Math.ceil((-num / modulo));
    }
    static modularExponentiate(base, exponent, modulo) {
        const LARGEST_SAFE_MODULO = 94906265; // sqrt(Number.MAX_SAFE_INTEGER)
        const needBigints = (modulo > LARGEST_SAFE_MODULO);
        if (needBigints) {
            return Number(BigintMath.modularExponentiate(BigInt(base), BigInt(exponent), BigInt(modulo)));
        }
        const exponentBinary = exponent.toString(2);
        let result = 1;
        let power = base;
        for (let i = 0; i < exponentBinary.length; i++) {
            if (exponentBinary[exponentBinary.length - 1 - i] === "1") {
                result = (result * power) % modulo;
            }
            power = (power ** 2) % modulo;
        }
        return result;
    }
    static gcd(num1, num2) {
        [num1, num2] = [Math.max(Math.abs(num1), Math.abs(num2)), Math.min(Math.abs(num1), Math.abs(num2))];
        if (num2 === 0) {
            return num1;
        }
        if (num1 % num2 === 0) {
            return num2;
        }
        return MathUtils.gcd(num1 % num2, num2);
    }
    static lcm(num1, num2) {
        return num1 * num2 / MathUtils.gcd(num1, num2);
    }
    static bezoutCoefficients(num1, num2) {
        if (num1 < 0 && num2 < 0) {
            const [coef1, coef2] = MathUtils.bezoutCoefficients(-num1, -num2);
            return [-coef1, -coef2];
        }
        else if (num1 < 0) {
            const [coef1, coef2] = MathUtils.bezoutCoefficients(-num1, num2);
            return [-coef1, coef2];
        }
        else if (num2 < 0) {
            const [coef1, coef2] = MathUtils.bezoutCoefficients(num1, -num2);
            return [coef1, -coef2];
        }
        if (num1 === 0 || num2 === 0) {
            throw new Error("Cannot calculate Bezout coefficients when either of the inputs are zero.");
        }
        if (num1 !== Math.floor(num1) || num2 !== Math.floor(num2)) {
            throw new Error("Calculating Bezout coefficients when either of the inputs are non-integers is not currently supported.");
        }
        if (num1 % num2 === 0) {
            return [0, 1];
        }
        else if (num2 % num1 === 0) {
            return [1, 0];
        }
        if (num1 < num2) {
            const [coef1, coef2] = MathUtils.bezoutCoefficients(num1, num2 % num1);
            return [coef1 - Math.floor(num2 / num1) * coef2, coef2];
        }
        else {
            const [coef1, coef2] = MathUtils.bezoutCoefficients(num1 % num2, num2);
            return [coef1, coef2 - Math.floor(num1 / num2) * coef1];
        }
    }
    static modularInverse(num, modulo) {
        const [coef1] = MathUtils.bezoutCoefficients(num, modulo);
        return MathUtils.generalizedModulo(coef1, modulo);
    }
    static factorial(num) {
        if (num < 0 || num % 1 !== 0) {
            throw new Error(`Cannot calculate the factorial of a non-integer (${num}).`);
        }
        let result = 1;
        for (let i = 1; i <= num; i++) {
            result *= i;
        }
        return result;
    }
    static factors(num) {
        return [...MathUtils.factorize(num).keys()];
    }
    static factorize(num) {
        if (num === 0 || num !== Math.floor(num)) {
            throw new Error("Cannot compute the prime factorization of 0.");
        }
        num = Math.abs(num);
        const result = new Map();
        let exponent2 = 0;
        while (num % 2 === 0) {
            num /= 2;
            exponent2++;
        }
        if (exponent2 > 0) {
            result.set(2, exponent2);
        }
        let exponent3 = 0;
        while (num % 3 === 0) {
            num /= 3;
            exponent3++;
        }
        if (exponent3 > 0) {
            result.set(3, exponent3);
        }
        for (let i = 5; i ** 2 <= num; i += (i % 6 === 1) ? 4 : 2) {
            let exponent = 0;
            while (num % i === 0) {
                num /= i;
                exponent++;
            }
            if (exponent !== 0) {
                result.set(i, exponent);
            }
        }
        if (num !== 1) {
            result.set(num, 1);
        }
        return result;
    }
    static factorsWithMultiplicity(num) {
        const result = [];
        const factorization = MathUtils.factorize(num);
        for (const [prime, exponent] of factorization) {
            for (let i = 0; i < exponent; i++) {
                result.push(prime);
            }
        }
        return result;
    }
    static unfactorize(factorizationOrPrimes, exponents) {
        if (factorizationOrPrimes instanceof Map) {
            const primes = [...factorizationOrPrimes.keys()];
            return MathUtils.product(primes.map(p => p ** factorizationOrPrimes.get(p)));
        }
        return MathUtils.product(factorizationOrPrimes.map((p, i) => p ** (exponents)[i]));
    }
    static divisors(num) {
        const divisorsBelowSqrt = [];
        const divisorsAboveSqrt = [];
        for (let i = 1; i ** 2 <= num; i++) {
            if (num % i === 0) {
                divisorsBelowSqrt.push(i);
                if (i ** 2 !== num) {
                    divisorsAboveSqrt.unshift(num / i);
                }
            }
        }
        return [...divisorsBelowSqrt, ...divisorsAboveSqrt];
    }
    static properDivisors(num) {
        const divisorsBelowSqrt = [];
        const divisorsAboveSqrt = [];
        for (let i = 2; i ** 2 <= num; i++) {
            if (num % i === 0) {
                divisorsBelowSqrt.push(i);
                if (i ** 2 !== num) {
                    divisorsAboveSqrt.unshift(num / i);
                }
            }
        }
        return [...divisorsBelowSqrt, ...divisorsAboveSqrt];
    }
    static binomial(n, k) {
        let result = 1;
        for (let i = n - k + 1; i <= n; i++) {
            result *= i;
        }
        for (let i = 1; i <= k; i++) {
            result /= i;
        }
        return result;
    }
    static rangeSum(min, max) {
        if (min > max) {
            return 0;
        }
        return min * (max - min + 1) + (max - min) * (max - min + 1) / 2;
    }
    static totient(num) {
        let result = 1;
        for (const [prime, exponent] of MathUtils.factorize(num)) {
            result *= prime ** (exponent - 1) * (prime - 1);
        }
        return result;
    }
    static digits(num) {
        const digits = [];
        do {
            digits.unshift(num % 10);
            num = Math.floor(num / 10);
        } while (num !== 0);
        return digits;
    }
    static fromDigits(digits) {
        return Number.parseInt(digits.join(""));
    }
}
//# sourceMappingURL=MathUtils.mjs.map