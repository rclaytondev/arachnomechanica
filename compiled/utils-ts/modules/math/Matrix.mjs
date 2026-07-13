import { ArrayUtils } from "../core-extensions/ArrayUtils.mjs";
export class Matrix {
    width;
    height;
    field;
    rows; // uses maps instead of arrays so we can only store nonzero entries (for high performance)
    constructor(width, height, field, values = []) {
        this.field = field;
        this.width = width;
        this.height = height;
        this.rows = new Map();
        for (const [rowIndex, row] of values.entries()) {
            for (const [columnIndex, value] of row.entries()) {
                this.set(rowIndex, columnIndex, value);
            }
        }
    }
    static fromFunction(width, height, callback, field) {
        const matrix = new Matrix(width, height, field, []);
        for (let rowIndex = 0; rowIndex < height; rowIndex++) {
            for (let columnIndex = 0; columnIndex < width; columnIndex++) {
                matrix.set(rowIndex, columnIndex, callback(rowIndex, columnIndex));
            }
        }
        return matrix;
    }
    get(row, column) {
        if (!this.rows.get(row)) {
            return this.field.zero;
        }
        return this.rows.get(row).get(column) ?? this.field.zero;
    }
    set(rowIndex, column, value) {
        if (this.field.areEqual(value, this.field.zero)) {
            const row = this.rows.get(rowIndex);
            if (row) {
                row.delete(column);
                if (row.size === 0) {
                    this.rows.delete(rowIndex);
                }
            }
        }
        else {
            let row = this.rows.get(rowIndex);
            if (!row) {
                this.rows.set(rowIndex, row = new Map());
            }
            row.set(column, value);
        }
    }
    update(row, column, updateFunc) {
        const value = this.get(row, column);
        this.set(row, column, updateFunc(value));
    }
    setInRow(row, index, value) {
        if (this.field.areEqual(value, this.field.zero)) {
            row.delete(index);
        }
        else {
            row.set(index, value);
        }
    }
    setRow(row, rowIndex) {
        if (row.size === 0) {
            this.rows.delete(rowIndex);
        }
        else {
            this.rows.set(rowIndex, row);
        }
    }
    // static multiply<FieldElementType>(matrix1: Matrix<FieldElementType>, matrix2: Matrix<FieldElementType>): Matrix<FieldElementType> {
    // 	if(matrix1.field !== matrix2.field) {
    // 		throw new Error("Cannot multiply matrices over different fields.");
    // 	}
    // 	if(matrix1.width !== matrix2.height) {
    // 		throw new Error(`In order to multiply matrices, the width of the first matrix must equal the height of the second, but in this case, the width of the first matrix was ${matrix1.width} whereas the height of the second matrix was ${matrix2.height}`);
    // 	}
    // 	const field = matrix1.field;
    // 	const result = new Matrix(matrix2.width, matrix1.height, field);
    // 	for(let rowIndex = )
    // }
    values() {
        const result = [];
        for (let rowIndex = 0; rowIndex < this.height; rowIndex++) {
            result[rowIndex] = [];
            for (let columnIndex = 0; columnIndex < this.width; columnIndex++) {
                result[rowIndex][columnIndex] = this.get(rowIndex, columnIndex);
            }
        }
        return result;
    }
    *nonzeroEntries() {
        for (const [rowIndex, row] of this.rows.entries()) {
            for (const [columnIndex, value] of row.entries()) {
                yield [rowIndex, columnIndex, value];
            }
        }
    }
    toString() {
        const lines = [];
        for (let y = 0; y < this.height; y++) {
            let line = "";
            for (let x = 0; x < this.width; x++) {
                const maxWidth = Math.max(...new Array(this.height).fill(0).map((v, i) => `${this.get(i, x)}`.length));
                const entry = `${this.get(y, x)}`;
                const numSpaces = (x === this.width - 1 ? 0 : maxWidth - entry.length + 1);
                line += (entry + " ".repeat(numSpaces));
            }
            lines.push(line);
        }
        return lines.join("\n");
    }
    copy() {
        return new Matrix(this.width, this.height, this.field, this.values());
    }
    equals(matrix) {
        if (matrix.width !== this.width || matrix.height !== this.height) {
            return false;
        }
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                if (!this.field.areEqual(this.get(row, column), matrix.get(row, column))) {
                    return false;
                }
            }
        }
        return true;
    }
    static identity(field, size) {
        const result = new Matrix(size, size, field);
        for (let i = 0; i < size; i++) {
            result.set(i, i, field.one);
        }
        return result;
    }
    subtract(matrix) {
        for (const [row, column, value] of matrix.nonzeroEntries()) {
            this.set(row, column, this.field.subtract(this.get(row, column), value));
        }
        return this;
    }
    swapRows(rowIndex1, rowIndex2) {
        // Only swaps indices where one of the rows has a nonzero entry for performance reasons.
        // As a result, this runs in O(n) time, where n is the total number of nonzero entries in the two rows.
        const swappedIndices = new Set();
        const row1 = this.rows.get(rowIndex1) ?? new Map();
        const row2 = this.rows.get(rowIndex2) ?? new Map();
        for (const [index, value] of row1.entries()) {
            this.setInRow(row1, index, row2.get(index) ?? this.field.zero);
            row2.set(index, value);
            swappedIndices.add(index);
        }
        for (const [index, value] of row2.entries()) {
            if (!swappedIndices.has(index)) {
                this.setInRow(row2, index, row1.get(index) ?? this.field.zero);
                row1.set(index, value);
            }
        }
        this.setRow(row1, rowIndex1);
        this.setRow(row2, rowIndex2);
    }
    multiplyRow(rowIndex, scalar) {
        for (const [index, entry] of (this.rows.get(rowIndex) ?? new Map()).entries()) {
            this.set(rowIndex, index, this.field.multiply(entry, scalar));
        }
    }
    addScaledRow(sourceRowIndex, destinationRowIndex, scalar) {
        for (const [index, entry] of (this.rows.get(sourceRowIndex) ?? new Map()).entries()) {
            const newValue = this.field.add(this.field.multiply(entry, scalar), this.get(destinationRowIndex, index));
            this.set(destinationRowIndex, index, newValue);
        }
    }
    applyRowOperation(rowOperation) {
        if (rowOperation.type === "add") {
            this.addScaledRow(rowOperation.sourceRowIndex, rowOperation.destinationRowIndex, rowOperation.scalar);
        }
        else if (rowOperation.type === "multiply") {
            this.multiplyRow(rowOperation.rowIndex, rowOperation.scalar);
        }
        else if (rowOperation.type === "swap") {
            this.swapRows(rowOperation.rowIndex1, rowOperation.rowIndex2);
        }
    }
    *gaussianElimination(reduced) {
        yield* new GaussianElimination(this.copy()).steps(reduced);
    }
    rowEchelonForm(reduced) {
        const steps = [...this.gaussianElimination(reduced)];
        if (steps.length === 0) {
            return this;
        }
        else {
            return steps[steps.length - 1].after;
        }
    }
    rank() {
        const rowEchelonForm = this.rowEchelonForm(false);
        for (let row = rowEchelonForm.height - 1; row >= 0; row--) {
            if (ArrayUtils.range(0, rowEchelonForm.width - 1).some(column => !rowEchelonForm.field.areEqual(rowEchelonForm.get(row, column), rowEchelonForm.field.zero))) {
                return row + 1;
            }
        }
        return 0;
    }
    nullity() {
        return this.width - this.rank();
    }
    inverse() {
        const inverse = Matrix.identity(this.field, this.width);
        const rowOperations = [...this.gaussianElimination(true)];
        if (rowOperations.length === 0) {
            /* already in reduced row eschelon form */
            return this.equals(Matrix.identity(this.field, this.width)) ? this.copy() : null;
        }
        if (rowOperations.length !== 0 && !rowOperations[rowOperations.length - 1].after.equals(Matrix.identity(this.field, this.width))) {
            return null;
        }
        for (const rowOperation of rowOperations) {
            inverse.applyRowOperation(rowOperation);
        }
        return inverse;
    }
}
class GaussianElimination {
    matrix;
    constructor(matrix) {
        this.matrix = matrix;
    }
    *swapRows(rowIndex1, rowIndex2) {
        if (rowIndex1 === rowIndex2) {
            return;
        }
        const beforeSwap = this.matrix.copy();
        this.matrix.swapRows(rowIndex1, rowIndex2);
        yield {
            type: "swap",
            rowIndex1, rowIndex2,
            before: beforeSwap.copy(),
            after: this.matrix.copy(),
        };
    }
    *addScaledRow(sourceRowIndex, destinationRowIndex, scalar) {
        if (this.matrix.field.areEqual(scalar, this.matrix.field.zero)) {
            return;
        }
        const beforeAdd = this.matrix.copy();
        this.matrix.addScaledRow(sourceRowIndex, destinationRowIndex, scalar);
        yield {
            type: "add",
            sourceRowIndex, destinationRowIndex, scalar,
            before: beforeAdd.copy(),
            after: this.matrix.copy(),
        };
    }
    *multiplyRow(rowIndex, scalar) {
        if (this.matrix.field.areEqual(scalar, this.matrix.field.one)) {
            return;
        }
        const beforeMultiplication = this.matrix.copy();
        this.matrix.multiplyRow(rowIndex, scalar);
        yield {
            type: "multiply",
            rowIndex, scalar,
            before: beforeMultiplication.copy(),
            after: this.matrix.copy(),
        };
    }
    *steps(reduced = true) {
        const nonzeroColumns = [];
        let pivotRow = 0;
        for (let i = 0; i < this.matrix.width; i++) {
            /* Swap rows if necessary to move any nonzero entry to the pivot row. */
            let foundNonzeroEntry = false;
            for (let j = pivotRow; j < this.matrix.height; j++) {
                if (!this.matrix.field.areEqual(this.matrix.get(j, i), this.matrix.field.zero)) {
                    yield* this.swapRows(pivotRow, j);
                    foundNonzeroEntry = true;
                    break;
                }
            }
            if (foundNonzeroEntry) {
                // yield* this.multiplyRow(pivotRow, this.matrix.field.inverse(this.matrix.get(pivotRow, i)));
                /* Add a scaled copy of row i to make all the entries below the pivot row equal to 0 */
                for (let j = pivotRow + 1; j < this.matrix.height; j++) {
                    const scalar = this.matrix.field.divide(this.matrix.field.opposite(this.matrix.get(j, i)), this.matrix.get(pivotRow, i));
                    yield* this.addScaledRow(i, j, scalar);
                }
                nonzeroColumns.push({ column: i, pivotRow: pivotRow });
                pivotRow++;
            }
        }
        if (reduced) {
            for (const { column, pivotRow } of [...nonzeroColumns].reverse()) {
                /* Multiply row by a scalar to make the leftmost nonzero entry 1. */
                yield* this.multiplyRow(pivotRow, this.matrix.field.inverse(this.matrix.get(pivotRow, column)));
                /* Add a scaled copy to rows above to make the entries above equal to 0. */
                for (let rowAbove = pivotRow - 1; rowAbove >= 0; rowAbove--) {
                    const entryAbove = this.matrix.get(rowAbove, column);
                    const scalar = this.matrix.field.opposite(entryAbove);
                    yield* this.addScaledRow(pivotRow, rowAbove, scalar);
                }
            }
        }
    }
}
//# sourceMappingURL=Matrix.mjs.map