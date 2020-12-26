export default class Vector {

    v: number[];

    constructor(v: number[]) {
        this.v = [];
        for (let i = 0; i < v.length; i++) {
            this.v[i] = Math.round(1000000 * v[i]) / 1000000;
        }
    }

    /**
     * Returns a vector that is the sum of this vector and the given vector
     *
     * @param {Vector} vector  The vector to add to this vector
     * @returns {Vector} The resulting vector.
     */
    add(vector: Vector): Vector {
        const u = vector.getArrayValue();
        const r = [];
        for (var i = 0; i < this.v.length; i++) {
            r[i] = this.v[i] + u[i];
        }
        return new Vector(r);
    }

    /**
     * Returns a vector that is the difference of this vector and the given vector
     *
     * @param {Vector} vector  The vector to subtract from this vector
     * @returns {Vector} The resulting vector.
     */
    subtract(vector: Vector): Vector {
        const u = vector.getArrayValue();
        const r = [];
        for (var i = 0; i < this.v.length; i++) {
            r[i] = this.v[i] - u[i];
        }
        return new Vector(r);
    }

    /**
     * Returns a vector that is this vector scaled by the given amount
     *
     * @param {Number} scaler  The amount to scale this vector by
     * @returns {Vector} The resulting vector.
     */
    scale(scaler: number): Vector {
        const r = [];
        for (let i = 0; i < this.v.length; i++) {
            r[i] = this.v[i] * scaler;
        }
        return new Vector(r);
    }

    /**
     * Returns the length of this vector
     *
     * @returns {Number} The length of this vector
     */
    magnitude(): number {
        let lengthSquared = 0;
        for (let i = 0; i < this.v.length; i++) {
            lengthSquared += this.v[i] * this.v[i];
        }
        return Math.sqrt(lengthSquared);
    }

    /**
     * Returns the length of this vector
     *
     * @returns {Number} The length of this vector
     */
    magSquared(): number {
        let lengthSquared = 0;
        for (let i = 0; i < this.v.length; i++) {
            lengthSquared += this.v[i] * this.v[i];
        }
        return lengthSquared;
    }

    /**
     * Returns a vector that has the same direction as this vector and the given
     * length, or 1 if no length is provided.
     *
     * @returns {Vector} The normalized version of this vector
     */
    normalize(length: number = 1): Vector {
        if (length === undefined) {
            length = 1;
        }
        const magnitude = this.magnitude();
        // If this vector has no direction, just use scale to return a copy
        // and set the first coordinate of that copy to the desired length.
        if (magnitude === 0) return this.scale(0).setCoordinate(0, length);
        return this.scale(length / this.magnitude());
    }

    /**
     * Returns the dot product of this vector and the given vector
     *
     * @param {Vector} vector  The vector to make the new vector orthogonal to
     * @returns {Number} The dot product of the vectors
     */
    dotProduct(vector: Vector): number {
        const u = vector.getArrayValue();
        let dotProduct = 0;
        for (let i = 0; i < this.v.length; i++) {
            dotProduct += this.v[i] * u[i];
        }
        return dotProduct;
    }

    /**
     * Returns a vector that is in the same plain as this vector and the given
     * vector but that is perpendicular to the given vector
     *
     * @param {Vector} vector  The vector to make the new vector orthogonal to
     * @returns {Vector}  The resulting vector
     */
    orthoganalize(vector: Vector): Vector {
        return this.subtract(vector.normalize(this.dotProduct(vector.normalize())));
    }

    /**
     * Returns a vector that is the product of matrix*this vector.
     * For left multiplication to be valid, the given matrix must have the
     * same number of columns that this vector has. The result has
     * dimensionality equal to the number of rows of the matrix
     *
     * @param {Array}  The matrix as a 2D array
     * @returns {Vector}  The resulting vector
     */
    leftMultiply(matrix: number[][]): Vector {
        const r = [];
        for (let row = 0; row < matrix.length; row++) {
            r[row] = 0;
            for (let col = 0; col < matrix[row].length; col++) {
                r[row] += matrix[row][col] * this.v[col];
            }
        }
        return new Vector(r);
    }

    /**
     * Returns the array this vector object wraps
     *
     * @returns {Array}  The array representation of this vector
     */
    getArrayValue(): number[] {
        return [...this.v];
    }

    /**
     * Returns true if this vector is identical to the given vector
     *
     * @returns {Boolean}  True if the two vectors are equal
     */
    equals(vector: Vector): boolean {
        const u = vector.getArrayValue();
        if (u.length != this.v.length) {
            return false;
        }
        for (let i = 0; i < this.v.length; i++) {
            if (this.v[i] != u[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Gets the nth coordinate of this vector
     *
     * @return {Number}  The coordinate requested
     */
    getCoordinate(index: number): number {
        return this.v[index];
    }

    /**
     * Sets the nth coordinate of this vector
     *
     * @return {Vector}  This vector, for chaining.
     */
    setCoordinate(index: number, value: number): Vector {
        this.v[index] = value;
        return this;
    }

    /**
     * Returns a vector that is the result of concatenating it with a second
     * vector.
     *
     * @param {Vector} vector  The vector to augment this vector with
     * @returns {Vector}  The resulting vector
     */
    augment(vector: Vector): Vector {
        return new Vector([...this.v, ...vector.getArrayValue()]);
    }

    crossProduct3(vector: Vector) {
        const { v } = this;
        const u = vector.getArrayValue();
        return new Vector([
            v[1] * u[2] - v[2] * u[1],
            v[2] * u[0] - v[0] * u[2],
            v[0] * u[1] - v[1] * u[0],
        ]);
    }
}
