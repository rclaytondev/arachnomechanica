export class BigintMath {
    static sum(numbers) {
        return numbers.reduce((accumulator, value) => accumulator + value, 0n);
    }
    static max(...values) {
        let max = values[0];
        for (const value of values) {
            if (value > max) {
                max = value;
            }
        }
        return max;
    }
    static min(...values) {
        let min = values[0];
        for (const value of values) {
            if (value < min) {
                min = value;
            }
        }
        return min;
    }
    static abs(value) {
        return (value < 0n) ? -value : value;
    }
    static sign(value) {
        if (value === 0n) {
            return 0n;
        }
        return (value > 0) ? 1n : -1n;
    }
    static recursiveGCD(num1, num2) {
        if (num1 % num2 === 0n) {
            return num2;
        }
        return BigintMath.recursiveGCD(num2, num1 % num2);
    }
    static gcd(num1, num2) {
        if (num1 === 0n || num2 === 0n) {
            throw new Error("Cannot calculate GCD when either of the inputs are zero.");
        }
        [num1, num2] = [BigintMath.max(BigintMath.abs(num1), BigintMath.abs(num2)), BigintMath.min(BigintMath.abs(num1), BigintMath.abs(num2))];
        return BigintMath.recursiveGCD(num1, num2);
    }
    static lcm(num1, num2) {
        return num1 * num2 / BigintMath.gcd(num1, num2);
    }
    static divideCeil(num, divisor) {
        return (num / divisor) + (num % divisor === 0n ? 0n : 1n);
    }
    static factorial(num) {
        if (num < 0) {
            throw new Error(`Cannot calculate the factorial of a negative integer (${num}).`);
        }
        let result = 1n;
        for (let i = 1n; i <= num; i++) {
            result *= i;
        }
        return result;
    }
    static floorSqrt(num) {
        const length = num.toString(2).length;
        let upperBound = 2n ** (BigInt(length) / 2n + 1n);
        let changed = true;
        while (changed) {
            const valueBefore = upperBound;
            upperBound = upperBound - (upperBound ** 2n - num) / (2n * upperBound);
            changed = (valueBefore !== upperBound);
        }
        for (let x = upperBound; true; x--) {
            if (x ** 2n <= num) {
                return x;
            }
        }
    }
    static isSquare(num) {
        return BigintMath.floorSqrt(num) ** 2n === num;
    }
    static binomial(n, k) {
        let result = 1n;
        for (let i = n - k + 1n; i <= n; i++) {
            result *= i;
        }
        for (let i = 1n; i <= k; i++) {
            result /= i;
        }
        return result;
    }
    static generalizedModulo(num, modulo) {
        if (modulo <= 0) {
            throw new Error("Cannot take the modulo by a negative number or 0.");
        }
        if (num >= 0) {
            return num % modulo;
        }
        return num + modulo * BigintMath.divideCeil(-num, modulo);
    }
    static bezoutCoefficients(num1, num2) {
        if (num1 < 0 && num2 < 0) {
            const [coef1, coef2] = BigintMath.bezoutCoefficients(-num1, -num2);
            return [-coef1, -coef2];
        }
        else if (num1 < 0) {
            const [coef1, coef2] = BigintMath.bezoutCoefficients(-num1, num2);
            return [-coef1, coef2];
        }
        else if (num2 < 0) {
            const [coef1, coef2] = BigintMath.bezoutCoefficients(num1, -num2);
            return [coef1, -coef2];
        }
        if (num1 === 0n || num2 === 0n) {
            throw new Error("Cannot calculate Bezout coefficients when either of the inputs are zero.");
        }
        if (num1 % num2 === 1n) {
            return [1n, -(num1 / num2)];
        }
        else if (num2 % num1 === 1n) {
            return [-(num2 / num1), 1n];
        }
        if (num1 < num2) {
            const [coef1, coef2] = BigintMath.bezoutCoefficients(num1, num2 % num1);
            return [coef1 - (num2 / num1) * coef2, coef2];
        }
        else {
            const [coef1, coef2] = BigintMath.bezoutCoefficients(num1 % num2, num2);
            return [coef1, coef2 - (num1 / num2) * coef1];
        }
    }
    static modularInverse(num, modulo) {
        const [coef1] = BigintMath.bezoutCoefficients(num, modulo);
        return BigintMath.generalizedModulo(coef1, modulo);
    }
    static modularExponentiate(base, exponent, modulo) {
        const exponentBinary = exponent.toString(2);
        let result = 1n;
        let power = BigInt(base);
        for (let i = 0; i < exponentBinary.length; i++) {
            if (exponentBinary[exponentBinary.length - 1 - i] === "1") {
                result = (result * power) % modulo;
            }
            power = (power ** 2n) % modulo;
        }
        return result;
    }
    static isPrime(n) {
        if (n <= 1) {
            return false;
        }
        for (let k = 2n; k ** 2n <= n; k++) {
            if (n % k === 0n) {
                return false;
            }
        }
        return true;
    }
    static rangeSum(min, max) {
        if (min > max) {
            return 0n;
        }
        return min * (max - min + 1n) + (max - min) * (max - min + 1n) / 2n;
    }
    static digits(num) {
        const digits = [];
        do {
            digits.unshift(num % 10n);
            num = num / 10n;
        } while (num !== 0n);
        return digits;
    }
    static fromDigits(digits) {
        return BigInt(digits.join(""));
    }
}
//# sourceMappingURL=BigintMath.mjs.map