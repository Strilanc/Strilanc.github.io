/**
 * A Complex number of the form a + bi, where i is the square root of -1.
 * @param real The real part of the Complex number. The 'a' in a + bi.
 * @param imag The imaginary part of the Complex number. The 'b' in a + bi.
 * @class
 */
function Complex(real, imag) {
    this.real = real;
    this.imag = imag;
}

/**
 * Wraps the given number into a Complex value (unless it's already a Complex value).
 * @param {number|Complex} v
 * @returns {Complex)
 */
Complex.from = function (v) {
    if (v instanceof Complex) {
        return v;
    }
    if (typeof v == "number") {
        return new Complex(v, 0);
    }
    throw "Don't know how create a Complex equal to: " + v;
};

/**
 * Returns the real component of a Complex, integer, or float value.
 * @param {number|Complex} v
 * @returns {number)
 */
Complex.real = function (v) {
    if (v instanceof Complex) {
        return v.real;
    }
    if (typeof v == "number") {
        return v;
    }
    throw "Don't know how to get real part of: " + v;
};

/**
 * Returns the imaginary component of a Complex value, or else 0 for integer and float values.
 * @param {number|Complex} v
 * @returns {number)
 */
Complex.imag = function (v) {
    if (v instanceof Complex) {
        return v.imag;
    }
    if (typeof v == "number") {
        return 0;
    }
    throw "Don't know how to get imaginary part of: " + v;
};

/**
 * Determines if the receiving complex value is equal to the given complex, integer, or float value.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {number|Complex|object} other
 * @returns {boolean}
 */
Complex.prototype.isEqualTo = function (other) {
    if (other instanceof Complex) {
        return this.real == other.real && this.imag == other.imag;
    }
    if (typeof other == "number") {
        return this.real == other;
    }
    return false;
};

/**
 * Returns a compact text representation of the receiving complex value.
 * @returns {String}
 */
Complex.prototype.toString = function () {
    var epsilon = 0.00000001;

    var radicalToString = function(v) {
        var matches = [
            [1, "1"],
            [0.5, "½"],
            [Math.sqrt(0.5), "√½"],
            [0.25, "¼"],
            [0.125, "⅛"],
            [Math.sqrt(0.125), "√⅛"]
        ];
        for (var i = 0; i < matches.length; i++) {
            if (Math.abs(Math.abs(v) - matches[i][0]) < epsilon) {
                return (v < 0 ? "-" : "") + matches[i][1];
            }
        }
        if (Math.abs(v).toString().length > 4) { return v.toFixed(2); }
        return v.toString();
    };

    if (Math.abs(this.imag) < epsilon) {
        return radicalToString(this.real);
    }
    if (Math.abs(this.real) < epsilon) {
        if (Math.abs(this.imag - 1) < epsilon == 1) {
            return "i";
        }
        if (Math.abs(this.imag + 1) < epsilon) {
            return "-i";
        }
        return this.imag.toString() + "i";
    }
    var separator = this.imag > 0 ? "+" : "-";
    var imagFactor = Math.abs(Math.abs(this.imag) - 1) < epsilon ? "" : radicalToString(Math.abs(this.imag));
    return radicalToString(this.real) + separator + imagFactor + "i";
};

/**
 * Returns the squared euclidean length of the receiving complex value.
 * @returns {number}
 */
Complex.prototype.norm2 = function () {
    return this.real * this.real + this.imag * this.imag;
};

/**
 * Returns the euclidean length of the receiving complex value.
 * @returns {number}
 */
Complex.prototype.abs = function () {
    return Math.sqrt(this.norm2());
};

/**
 * Returns the complex conjugate of the receiving complex value, with the same real part but a negated imaginary part.
 * @returns {Complex}
 */
Complex.prototype.conjugate = function () {
    return new Complex(this.real, -this.imag);
};

/**
 * Returns the angle, in radians, of the receiving complex value with 0 being +real-ward and τ/4 being +imag-ward.
 * Zero defaults to having a phase of zero.
 * @returns {number}
 */
Complex.prototype.phase = function () {
    return Math.atan2(this.imag, this.real);
};

/**
 * Returns a unit complex value parallel to the receiving complex value.
 * Zero defaults to having the unit vector 1+0i.
 * @returns {Complex}
 */
Complex.prototype.unit = function () {
    var m = this.norm2();
    if (m < 0.00001) {
        var theta = this.phase();
        return new Complex(Math.cos(theta), -Math.sin(theta));
    }
    return this.dividedBy(Math.sqrt(m));
};

/**
 * Returns the sum of the receiving complex value plus the given value.
 * @param {number|Complex} v
 * @returns {Complex)
 */
Complex.prototype.plus = function (v) {
    var c = Complex.from(v);
    return new Complex(this.real + c.real, this.imag + c.imag);
};

/**
 * Returns the difference from the receiving complex value to the given value.
 * @param {number|Complex} v
 * @returns {Complex)
 */
Complex.prototype.minus = function (v) {
    var c = Complex.from(v);
    return new Complex(this.real - c.real, this.imag - c.imag);
};

/**
 * Returns the product of the receiving complex value times the given value.
 * @param {number|Complex} v
 * @returns {Complex)
 */
Complex.prototype.times = function (v) {
    var c = Complex.from(v);
    return new Complex(
        this.real * c.real - this.imag * c.imag,
        this.real * c.imag + this.imag * c.real);
};

/**
 * Returns the ratio of the receiving complex value to the given value.
 * @param {number|Complex} v
 * @returns {Complex)
 */
Complex.prototype.dividedBy = function (v) {
    var c = Complex.from(v);
    var d = c.norm2();
    if (d === 0) throw "Division by Zero";

    var n = this.times(c.conjugate());
    return new Complex(n.real / d, n.imag / d);
};

/**
 * The complex number equal to zero.
 * @type {Complex}
 */
Complex.ZERO = new Complex(0, 0);

/**
 * The square root of negative 1.
 * @type {Complex}
 */
Complex.I = new Complex(0, 1);
// uses: complex.js

/**
 * A matrix of complex values.
 * @param rows {Complex[][]} The rows of complex coefficients making up the matrix.
 * @class
 */
function Matrix(rows) {
    if (!(rows instanceof Array)) {
        throw "need(rows instanceof Array): " + rows;
    }
    if (rows.length == 0) {
        throw "need(rows.length > 0): " + rows;
    }

    if (!rows.every(function(row) { return row instanceof Array; })) {
        throw "need(rows.all(_.length == cols.length)): " + rows;
    }
    var w = rows[0].length;
    if (w == 0 || !rows.every(function(row) { return row.length === w; })) {
        throw "need(rows.map(e -> e.length).single() > 0): " + rows;
    }
    if (![].concat.apply([], rows).every(function(e) { return e instanceof Complex; })) {
        throw "need(rows.flatten().all(_ instanceof Complex)): " + rows;
    }

    this.rows = rows;
}

Matrix.prototype.tensorPower = function(p) {
    if (p == 0) {
        return Matrix.identity(1);
    }
    var t = this;
    while (p > 1) {
        // TODO: use repeated squaring instead
        t = t.tensorProduct(this);
        p -= 1;
    }
    return t;
};

Matrix.prototype.width = function() {
    return this.rows[0].length;
};

Matrix.prototype.height = function() {
    return this.rows.length;
};

/**
 * Returns a matrix of the given dimensions, using the given function to generate the coefficients.
 * @param {int} width
 * @param {int} height
 * @param {function} coefficientRowColGenerator
 * @returns {Matrix}
 */
Matrix.generate = function (width, height, coefficientRowColGenerator) {
    var rows = [];
    for (var r = 0; r < height; r++) {
        var row = [];
        rows.push(row);
        for (var c = 0; c < width; c++) {
            row.push(Complex.from(coefficientRowColGenerator(r, c)));
        }
    }

    return new Matrix(rows);
};

/**
 * Converts the given square block of coefficients into a square complex matrix.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs The coefficients of the matrix, arranged in a flat array of
 * square length with the coefficients (which can be numeric or complex) in row order.
 * @returns {Matrix}
 */
Matrix.square = function (coefs) {
    if (coefs instanceof Array) {
        var n = Math.round(Math.sqrt(coefs.length));
        if (n * n != coefs.length) throw "Not square: " + coefs;
        return Matrix.generate(n, n, function(r, c) { return coefs[r * n + c]; });
    }

    throw "Don't know how to convert value into matrix: " + coefs;
};

/**
 * Converts the array of complex coefficients into a column vector.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs
 * @returns {Matrix}
 */
Matrix.col = function (coefs) {
    return Matrix.generate(1, coefs.length, function(r) { return coefs[r]; });
};

/**
 * Converts the array of complex coefficients into a row vector.
 * @param {(number|Complex)[]|number[]|Complex[]} coefs
 * @returns {Matrix}
 */
Matrix.row = function (coefs) {
    return Matrix.generate(coefs.length, 1, function(r, c) { return coefs[c]; });
};

/**
 * Determines if the receiving matrix is equal to the given matrix.
 * This method returns false, instead of throwing, when given badly typed arguments.
 * @param {Matrix|object} other
 * @returns {boolean}
 */
Matrix.prototype.isEqualTo = function (other) {
    if (!(other instanceof Matrix)) return false;

    var w = this.width();
    var h = other.height();
    if (other.width() != w || other.height() != h) return false;

    for (var r = 0; r < h; r++) {
        for (var c = 0; c < w; c++) {
            if (!this.rows[r][c].isEqualTo(other.rows[r][c])) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Returns a text representation of the receiving matrix.
 * (It uses curly braces so you can paste it into wolfram alpha.)
 * @returns {string}
 */
Matrix.prototype.toString = function () {
    var data = this.rows.map(function(row) {
        var rowData = row.map(function(e) {
           return e === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE ? "C" : e.toString();
        });
        return rowData.join(", ");
    }).join("}, {");
    return "{{" + data + "}}";
};

/**
 * Returns the conjugate transpose of the receiving operation (the adjoint is the inverse when the matrix is unitary).
 * @returns {Matrix}
 */
Matrix.prototype.adjoint = function () {
    var m = this;
    return Matrix.generate(this.height(), this.width(), function(r, c) {
        return m.rows[c][r].conjugate();
    });
};

/**
 * Returns the result of scaling the receiving matrix by the given scalar factor.
 * @param {number|Complex} v
 * @returns {Matrix}
 */
Matrix.prototype.scaledBy = function (v) {
    var m = this;
    return Matrix.generate(this.width(), this.height(), function(r, c) {
        return m.rows[r][c].times(v);
    });
};

/**
 * Returns the sum of the receiving matrix and the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.plus = function (other) {
    var m = this;
    var w = this.width();
    var h = this.height();
    if (other.width() != w || other.height() != h) throw "Incompatible matrices: " + this + " + " + other;
    return Matrix.generate(w, h, function(r, c) {
        return m.rows[r][c].plus(other.rows[r][c]);
    });
};

/**
 * Returns the difference from the receiving matrix to the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.minus = function (other) {
    var m = this;
    var w = this.width();
    var h = this.height();
    if (other.width() != w || other.height() != h) throw "Incompatible matrices: " + this + " - " + other;
    return Matrix.generate(w, h, function(r, c) {
        return m.rows[r][c].minus(other.rows[r][c]);
    });
};

/**
 * Returns the matrix product (i.e. the composition) of the receiving matrix and the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.times = function (other) {
    var m = this;
    var w = other.width();
    var h = this.height();
    var n = this.width();
    if (other.height() != n) throw "Incompatible matrices: " + this + " * " + other;
    return Matrix.generate(w, h, function(r, c) {
        var t = Complex.ZERO;
        for (var i = 0; i < n; i++) {
            t = t.plus(m.rows[r][i].times(other.rows[i][c]));
        }
        return t;
    });
};

/**
 * Returns the tensor product of the receiving matrix and the given matrix.
 * @param {Matrix} other
 * @returns {Matrix}
 */
Matrix.prototype.tensorProduct = function (other) {
    var m = this;
    var w1 = this.width();
    var w2 = other.width();
    var h1 = this.height();
    var h2 = other.height();
    return Matrix.generate(w1 * w2, h1 * h2, function(r, c) {
        var r1 = Math.floor(r / h2);
        var c1 = Math.floor(c / w2);
        var r2 = r % h2;
        var c2 = c % w2;
        var v1 = m.rows[r1][c1];
        var v2 = other.rows[r2][c2];
        if (v1 === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO || v2 === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO) {
            return Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
        }
        if (v1 === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE || v2 === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE) {
            return r1 == c1 && r2 == c2 ? Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
        }
        return v1.times(v2);
    });
};

/**
 * Returns a single-qubit quantum operation corresponding to the given rotation.
 *
 * The direction of the given x, y, z vector determines which axis to rotate around, and the length of the vector
 * determines what fraction of an entire turn to rotate. For example, if [x, y, z] is [1/√8), 0, 1/√8], then the
 * rotation is a half-turn around the X+Z axis and the resulting operation is the Hadamard operation
 * {{1, 1}, {1, -1}}/√2.
 *
 * @param {number} x The x component of the rotation vector.
 * @param {number} y The y component of the rotation vector.
 * @param {number} z The z component of the rotation vector.
 *
 * @returns {Matrix}
 */
Matrix.fromRotation = function (x, y, z) {
    var sinc = function(t) {
        if (Math.abs(t) < 0.0002) return 1 - t*t / 6.0;
        return Math.sin(t) / t;
    };

    x = -x * Math.PI * 2;
    y = -y * Math.PI * 2;
    z = -z * Math.PI * 2;

    var s = -11*x + -13*y + -17*z >= 0 ? 1 : -1;  // phase correction discontinuity on an awkward plane
    var theta = Math.sqrt(x*x + y*y + z*z);
    var sigma_v = Matrix.PAULI_X.scaledBy(x).plus(
                  Matrix.PAULI_Y.scaledBy(y)).plus(
                  Matrix.PAULI_Z.scaledBy(z));

    var ci = new Complex(1 + Math.cos(s * theta), Math.sin(s * theta)).times(0.5);
    var cv = new Complex(Math.sin(theta/2) * sinc(theta/2), -s * sinc(theta)).times(s * 0.5);

    return Matrix.identity(2).scaledBy(ci).minus(sigma_v.scaledBy(cv));
};

/**
 * Returns a matrix for an n-wire circuit that swaps wires i and j.
 * @param {int} numWires
 * @param {int} swapWire1
 * @param {int} swapWire2
 */
Matrix.fromWireSwap = function(numWires, swapWire1, swapWire2) {
    return Matrix.generate(1 << numWires, 1 << numWires, function(r, c) {
        var bitSwap = function(n) {
            var m1 = 1 << swapWire1;
            var m2 = 1 << swapWire2;
            var s = n & ~(m1 | m2);
            if ((n & m1) != 0) s |= m2;
            if ((n & m2) != 0) s |= m1;
            return s;
        };
        return bitSwap(r) === c ? 1 : 0;
    });
};

/**
 * Returns the identity matrix, with 1s on the main diagonal and all other entries zero.
 * @param size The dimension of the returned identity matrix.
 * @returns {Matrix}
 */
Matrix.identity = function(size) {
    return Matrix.generate(size, size, function(r, c) {
        return r == c ? 1 : Matrix.__TENSOR_SYGIL_COMPLEX_ZERO;
    });
};


/**
 * A special complex value that the tensor product checks for in order to support controlled operations.
 * @type {Complex}
 */
Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE = new Complex(1, 0);

/**
 * A marked complex zero that the tensor product propagates, so large empty areas can be grayed out when drawing.
 * @type {Complex}
 */
Matrix.__TENSOR_SYGIL_COMPLEX_ZERO = Complex.from(0);

/**
 * A special value that acts like the pseudo-operation "use this qubit as a control" w.r.t. the tensor product.
 *
 * Implemented as a matrix [[C, 0], [0, 1]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {Matrix}
 */
Matrix.CONTROL = Matrix.square([Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE, Matrix.__TENSOR_SYGIL_COMPLEX_ZERO,
                                Matrix.__TENSOR_SYGIL_COMPLEX_ZERO, 1]);

/**
 * A special value that acts like the pseudo-operation "use this qubit as an anti-control" w.r.t. the tensor product.
 *
 * Implemented as a matrix [[1, 0], [0, C]], where C is a special value that causes a 1 to end up on the diagonal of the
 * expanded matrix and 0 otherwise.
 * @type {Matrix}
 */
Matrix.ANTI_CONTROL = Matrix.square([1, Matrix.__TENSOR_SYGIL_COMPLEX_ZERO,
                                     Matrix.__TENSOR_SYGIL_COMPLEX_ZERO, Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE]);

/**
 * The 2x2 Pauli X matrix.
 * @type {Matrix}
 */
Matrix.PAULI_X = Matrix.square([0, 1, 1, 0]);

/**
 * The 2x2 Pauli Y matrix.
 * @type {Matrix}
 */
Matrix.PAULI_Y = Matrix.square([0, new Complex(0, -1), new Complex(0, 1), 0]);

/**
 * The 2x2 Pauli Z matrix.
 * @type {Matrix}
 */
Matrix.PAULI_Z = Matrix.square([1, 0, 0, -1]);

/**
 * The 2x2 Hadamard matrix.
 * @type {Matrix}
 */
Matrix.HADAMARD = Matrix.square([1, 1, 1, -1]).scaledBy(Math.sqrt(0.5));
/**
 * A 2-d rectangle.
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @constructor
 */
function Rect(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

/**
 *
 * @param {number} x The x-coordinate of the center of the square.
 * @param {number} y The y-coordinate of the center of the square.
 * @param {number} r Half of the diameter of the square.
 * @returns {Rect}
 */
Rect.centeredSquareWithRadius = function(x, y, r) {
    return new Rect(x - r, y - r, r*2, r*2);
};

Rect.prototype.isEqualTo = function(other) {
    return other instanceof Rect &&
        other.x == this.x &&
        other.y == this.y &&
        other.w == this.w &&
        other.h == this.h;
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.center = function() {
    return {x: this.x + this.w / 2, y: this.y + this.h / 2};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.topLeft = function() {
    return {x: this.x, y: this.y};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.topRight = function() {
    return {x: this.x + this.w, y: this.y};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.bottomLeft = function() {
    return {x: this.x, y: this.y + this.h};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.bottomRight = function() {
    return {x: this.x + this.w, y: this.y + this.h};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.centerLeft = function() {
    return {x: this.x, y: this.y + this.h/2};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.centerRight = function() {
    return {x: this.x + this.w, y: this.y + this.h/2};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.topCenter = function() {
    return {x: this.x + this.w/2, y: this.y};
};

/**
 * @returns {{x: number, y: number}}
 */
Rect.prototype.bottomCenter = function() {
    return {x: this.x + this.w/2, y: this.y + this.h};
};


/**
 * @returns number
 */
Rect.prototype.right = function() {
    return this.x + this.w;
};

/**
 * @returns number
 */
Rect.prototype.bottom = function() {
    return this.y + this.h;
};

/**
 * Returns the result of removing the given width from the left side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostWidth
 * @returns Rect
 */
Rect.prototype.skipLeft = function(lostWidth) {
    var d = Math.min(lostWidth, this.w);
    return new Rect(this.x + d, this.y, this.w - d, this.h);
};

/**
 * Returns the result of removing the given width from the right side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostWidth
 * @returns Rect
 */
Rect.prototype.skipRight = function(lostWidth) {
    var d = Math.min(lostWidth, this.w);
    return new Rect(this.x, this.y, this.w - d, this.h);
};

/**
 * Returns the result of removing the given height from the top side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostHeight
 * @returns Rect
 */
Rect.prototype.skipTop = function(lostHeight) {
    var d = Math.min(lostHeight, this.h);
    return new Rect(this.x, this.y + d, this.w, this.h - d);
};

/**
 * Returns the result of removing the given height from the bottom side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} lostHeight
 * @returns Rect
 */
Rect.prototype.skipBottom = function(lostHeight) {
    var d = Math.min(lostHeight, this.h);
    return new Rect(this.x, this.y, this.w, this.h - d);
};

/**
 * Returns the result of removing all but the given width from the left side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptWidth
 * @returns Rect
 */
Rect.prototype.takeLeft = function(keptWidth) {
    var d = Math.max(keptWidth, 0);
    return new Rect(this.x, this.y, d, this.h);
};

/**
 * Returns the result of removing all but the given width from the right side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptWidth
 * @returns Rect
 */
Rect.prototype.takeRight = function(keptWidth) {
    var d = Math.max(keptWidth, 0);
    return new Rect(this.x + this.w - d, this.y, d, this.h);
};

/**
 * Returns the result of removing all but the given height from the top side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptHeight
 * @returns Rect
 */
Rect.prototype.takeTop = function(keptHeight) {
    var d = Math.max(keptHeight, 0);
    return new Rect(this.x, this.y, this.w, d);
};

/**
 * Returns the result of removing all but the given height from the bottom side of the rectangle.
 * The cut is clamped so it doesn't go into negative heights.
 *
 * @param {number} keptHeight
 * @returns Rect
 */
Rect.prototype.takeBottom = function(keptHeight) {
    var d = Math.max(keptHeight, 0);
    return new Rect(this.x, this.y + this.h - d, this.w, d);
};

/**
 * Returns the result of padding to each side of the rectangle by the given amount.
 *
 * @param {number} p The margin from the receiving rect's outside to the returned rect's inside.
 * @returns Rect
 */
Rect.prototype.paddedBy = function(p) {
    return new Rect(this.x - p, this.y - p, this.w + p * 2, this.h + p * 2);
};

/**
 * Determines if the given point is in the receiving rect or not.
 *
 * Note that the top and left of the rectangle are inclusive, but the bottom and right are exclusive.
 *
 * @param {{x: number, y: number}} p The query point.
 * @returns {boolean}
 */
Rect.prototype.containsPoint = function(p) {
    return p.x >= this.x &&
        p.x < this.x + this.w &&
        p.y >= this.y &&
        p.y < this.y + this.h;
};
Rect.prototype.topHalf = function() {
    return this.skipBottom(this.h / 2);
};

Rect.prototype.bottomHalf = function() {
    return this.skipTop(this.h / 2);
};

Rect.prototype.leftHalf = function() {
    return this.skipRight(this.w / 2);
};

Rect.prototype.rightHalf = function() {
    return this.skipLeft(this.w / 2);
};
// uses: complex.js
// uses: matrix.js

/**
 * A named single-qubit quantum operation.
 *
 * @param {string} symbol The text shown inside the gate's box when drawn on the circuit.
 * @param {Matrix} matrix The operation the gate applies.
 * @param {string} name A helpful human-readable name for the operation.
 * @param {string} description A helpful description of what the operation does.
 * @constructor
 */
function Gate(symbol, matrix, name, description) {
    this.symbol = symbol;
    this.matrix = matrix;
    this.name = name;
    this.description = description;
}

Gate.prototype.toString = function() {
    return this.name;
};

Gate.CONTROL = new Gate(
    "•",
    Matrix.CONTROL,
    "Control",
    "Linked operations apply only when control qubit is ON.\n" +
    "\n" +
    "The control 'operation' is really more like a a modifier. It conditions\n" +
    "other operations (ones in the same column) to only occur when the\n" +
    "control qubit is true. When the control qubit is in a superposition of\n" +
    "ON and OFF, the other operations only apply in the parts of the\n" +
    "superposition control qubit is on.");

Gate.ANTI_CONTROL = new Gate(
    "◦",
    Matrix.ANTI_CONTROL,
    "Anti-Control",
    "Linked operations apply only when control qubit is OFF.\n" +
    "\n" +
    "The anti-control operation like the control operation, except it\n" +
    "conditions on OFF instead of ON. Linked operations will only apply\n" +
    "to parts of the superposition where the control qubit is OFF.");

/**
 * A visualization gate with no effect.
 *
 * @type {Gate}
 */
Gate.PEEK = new Gate(
    "Peek",
    Matrix.identity(2),
    "Peek",
    "Shows the odds that a wire WOULD be on, IF it was measured.\n" +
    "\n" +
    "When this 'operation' is controlled, it show both the probability that the\n" +
    "wire is on in the cases where the controls are true (p|c) as well as the\n" +
    "overall probability of the wire being on and the controls being satisfied\n" +
    "(p∧c).\n" +
    "\n" +
    "(In practice this 'operation' would disturb the result and require\n" +
    "re-running the computation many times. Here we get to be more\n" +
    "convenient.)");

Gate.DOWN = new Gate(
    "↓",
    Matrix.fromRotation(0.25, 0, 0),
    "Down Gate",
    "Cycles through OFF, (1+i)(OFF - i ON), ON, and (1-i)(OFF + i ON).\n" +
    "\n" +
    "The Down gate is a non-standard square-root-of-NOT gate. It's one\n" +
    "of the four square roots of the Pauli X gate, so applying it twice\n" +
    "is equivalent to a NOT. The Down gate is the inverse of the Up\n" +
    "gate.");

Gate.UP = new Gate(
    "↑",
    Matrix.fromRotation(0.75, 0, 0),
    "Up Gate / Beam Splitter",
    "Cycles through OFF, (1-i)(OFF + i ON), ON, and (1+i)(OFF - i ON).\n" +
    "\n" +
    "The Up gate's effect is analogous to an optical beam splitter, in\n" +
    "that it splits and rotates the relative phase the right way. However,\n" +
    "it does have a different global phase factor so that it can be one of\n" +
    "the four square roots of the Pauli X gate (so applying it twice is\n" +
    "equivalent to a NOT). The Up gate is the inverse of the Down gate.");

Gate.X = new Gate(
    "X",
    Matrix.PAULI_X,
    "Not Gate  /  Pauli X Gate",
    "Toggles between ON and OFF.\n" +
    "\n" +
    "The NOT gate is also known as the Pauli X gate because it corresponds\n" +
    "to a 180° turn around the X axis of the Block Sphere. It pairs states\n" +
    "that agree on everything except the value of target qubit, and swaps\n" +
    "the amplitudes within each pair.");

Gate.RIGHT = new Gate(
    "→",
    Matrix.fromRotation(0, 0.25, 0),
    "Right Gate",
    "Cycles through OFF, (1+i)(OFF + ON), i On, and (1-i)(OFF - ON).\n" +
    "\n" +
    "The Right gate is a non-standard gate. It's one of the four square\n" +
    "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
    "Y gate. The Right gate is the inverse of the Left gate.");

Gate.LEFT = new Gate(
    "←",
    Matrix.fromRotation(0, 0.75, 0),
    "Left Gate",
    "Cycles through OFF, (1-i)(OFF - ON), i On, and (1+i)(OFF + ON).\n" +
    "\n" +
    "The Left gate is a non-standard gate. It's one of the four square\n" +
    "roots of the Pauli Y gate, so applying it twice is equivalent to a\n" +
    "Y gate. The Left gate is the inverse of the Right gate.");

Gate.Y = new Gate(
    "Y",
    Matrix.PAULI_Y,
    "Pauli Y Gate",
    "Toggles with a phase adjustment.\n" +
    "\n" +
    "The Pauli Y gate corresponds to a 180° turn around the Y axis of the\n" +
    "Block Sphere. You can think of it as a combination of the X and Z gates,\n" +
    "but with an extra 90 degree global phase twist. The Y its own inverse.");

Gate.COUNTER_CLOCKWISE = new Gate(
    "↺",
    Matrix.fromRotation(0, 0, 0.25),
    "Counter Phase Gate",
    "Multiplies the ON phase by i (without affecting the OFF state).\n" +
    "\n" +
    "The Counter Phase gate, sometimes called just 'the phase gate', is one\n" +
    "of the four square roots of the Pauli Z gate. It is the inverse of the\n" +
    "Clockwise Phase gate.");

Gate.CLOCKWISE = new Gate(
    "↻",
    Matrix.fromRotation(0, 0, 0.75),
    "Clockwise Phase Gate",
    "Multiplies the ON phase by -i (without affecting the OFF state).\n" +
    "\n" +
    "The Clockwise Phase gate is one of the four square roots of the Pauli Z\n" +
    "gate. It is the inverse of the Counter Phase gate.");

Gate.Z = new Gate(
    "Z",
    Matrix.PAULI_Z,
    "Phase Flip Gate / Pauli Z Gate",
    "Inverts the ON phase (without affecting the OFF state).\n" +
    "\n" +
    "The Pauli Z gate corresponds to a 180° turn around the Z axis of the\n" +
    "Block Sphere. It negates the amplitude of every state where the\n" +
    "target qubit is ON.");

Gate.H = new Gate(
    "H",
    Matrix.HADAMARD,
    "Hadamard Gate",
    "Cycles ON through ON+OFF, but cycles OFF through ON-OFF.\n" +
    "\n" +
    "The Hadamard gate is the simplest quantum gate that can create and\n" +
    "interfere superpositions. It appears often in many quantum algorithms,\n" +
    "especially at the start (because applying one to every wire goes from\n" +
    "a classical state to a uniform superposition of all classical states).\n" +
    "\n" +
    "The hadamard operation also corresponds to a 180° turn around the\n" +
    "X+Z diagonal axis of the Block Sphere, and is its own inverse.");

Gate.SWAP_HALF = new Gate(
    "Swap",
    Matrix.square([1, 0, 0, 0,
                   0, 0, 1, 0,
                   0, 1, 0, 0,
                   0, 0, 0, 1]),
    "Swap Gate [Half]",
    "Swaps the values of two qubits.\n" +
    "\n" +
    "(You must place two swap gate halves in a column to do a swap.)");

Gate.DRAW_MATRIX_SYMBOL = "\\__SPECIAL_SYMBOL__DRAW_MATRIX";

Gate.fromPhaseRotation = function(fraction, symbol) {
    var mod = function(n, d) { return ((n % d) + d) % d; };
    var dif_mod = function(n, d) { return mod(n + d/2, d) - d/2; };
    var deg = dif_mod(fraction, 1) * 360;
    var deg_desc = (Math.round(deg*64)/64).toString();
    var name_desc =
          fraction == 1/3 ? "/3"
        : fraction == -1/3 ? "-/3"
        : fraction == 1/8 ? "/8"
        : fraction == -1/8 ? "-/8"
        : fraction == 1/16 ? "/16"
        : fraction == -1/16 ? "-/16"
        : (Math.round(deg*64)/64).toString() + "°";

    return new Gate(
        symbol || "Z(" + name_desc + ")",
        Matrix.fromRotation(0, 0, fraction),
        deg_desc + "° Phase Gate",
        "Rotates the phase of a qubit's ON state by " + deg_desc + " degrees,\n" +
        "while leaving its OFF state alone. The standard Pauli Z gate\n" +
        "corresponds to Z(180°).");
};

Gate.fromRotation = function(x, y, z, symbol) {
    if (x == 0 && y == 0) {
        return Gate.fromPhaseRotation(z, symbol);
    }

    var n = Math.sqrt(x*x + y*y + z*z);
    var deg = n*360;
    return new Gate(
        symbol || Gate.DRAW_MATRIX_SYMBOL, // special character that means "render the matrix"
        Matrix.fromRotation(x, y, z),
        deg +  "° around <" + x/n + ", " + y/n + ", " + z/n + ">",
        "A custom operation based on a rotation.");
};

Gate.fromCustom = function(matrix) {
    return new Gate(
        Gate.DRAW_MATRIX_SYMBOL,
        matrix,
        matrix.toString(),
        "A custom operation.");
};

/**
 * A column of gates in a circuit with many qubits.
 *
 * @param {(Gate|null)[]} gates The list of gates to apply to each wire, with the i'th gate applying to the i'th wire.
 * Wires without a gate in this column should use null instead.
 * @constructor
 */
function GateColumn(gates) {
    this.gates = gates;
}

/**
 * @param {number} size
 * @returns {GateColumn}
 */
GateColumn.empty = function(size) {
    var gates = [];
    for (var i = 0; i < size; i++) {
        gates.push(null);
    }
    return new GateColumn(gates);
};

GateColumn.prototype.isEmpty = function() {
    return this.gates.every(function(e) { return e === null; });
};

/**
 * Returns the matrix corresponding to the parallel applications of the operations in this circuit column.
 */
GateColumn.prototype.matrix = function() {
    var ops = [];
    var swapIndices = [];
    for (var i = 0; i < this.gates.length; i++) {
        var op;
        if (this.gates[i] === null) {
            op = Matrix.identity(2)
        } else if (this.gates[i] === Gate.SWAP_HALF) {
            swapIndices.push(i);
            op = Matrix.identity(2);
        } else {
            op = this.gates[i].matrix;;
        }
        ops.push(op);
    }

    var result = ops.reduce(function (a, e) { return e.tensorProduct(a); }, Matrix.identity(1));
    if (swapIndices.length === 2) {
        result = Matrix.fromWireSwap(this.gates.length, swapIndices[0], swapIndices[1]).times(result);
    }
    return result;
};

/**
 * Returns the result of applying this circuit column to the given state.
 * @param {Matrix} state A column matrix of the correct size.
 * @returns {Matrix}
 */
GateColumn.prototype.transform = function(state) {
    return this.matrix().times(state);
};
// ===================================
//      CONFIGURATION CONSTANTS
// ===================================
var AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL = "yellow";
var AMPLITUDE_CIRCLE_FILL_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ONE = "#201000";
var AMPLITUDE_CIRCLE_STROKE_COLOR = "gray";
var AMPLITUDE_CLEAR_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ZERO = "#444";
var AMPLITUDE_PROBABILITY_FILL_UP_COLOR = "orange";

/**
 * @param {CanvasRenderingContext2D} ctx
 * @constructor
 */
function Painter(ctx) {
    this.ctx = ctx;
}

/**
 * Draws the inside of a rectangle.
 * @param {Rect} rect The rectangular area to fill.
 * @param {=string} color The fill color. Defaults to black.
 */
Painter.prototype.fillRect = function (rect, color) {
    this.ctx.fillStyle = color || "white";
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
};

/**
 * Draws the outside of a rectangle.
 * @param {Rect} rect The rectangular perimeter to stroke.
 * @param {=string} color The stroke color. Defaults to black.
 * @param {=number} thickness The stroke thickness. Defaults to 1.
 */
Painter.prototype.strokeRect = function (rect, color, thickness) {
    this.ctx.strokeStyle = color || "black";
    this.ctx.strokeWidth = thickness || 1;
    this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
};

/**
 * Draws the inside of a circle.
 * @param {{x: number, y: number}} center The center of the circle.
 * @param radius The distance from the center of the circle to its side.
 * @param {=string} color The fill color. Defaults to white.
 */
Painter.prototype.fillCircle = function (center, radius, color) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color || "white";
    ctx.fill();
};

/**
 * Draws the outside of a circle.
 * @param {{x: number, y: number}} center The center of the circle.
 * @param radius The distance from the center of the circle to its side.
 * @param {=string} color The stroke color. Defaults to black.
 * @param {=number} thickness The stroke thickness. Defaults to 1.
 */
Painter.prototype.strokeCircle = function (center, radius, color, thickness) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = color || "black";
    ctx.strokeWidth = thickness || 1;
    ctx.stroke();
};

/**
 * Draws a string. Handles multi-line strings.
 *
 * @param {string} text The string to draw.
 * @param {number} x The left position of the drawn string.
 * @param {number} y The top position of the drawn string.
 * @param {=string} fontColor The text color. Defaults to black.
 * @param {=number} fontSize The text size. Defaults to 12px.
 * @param {=string} fontFamily The text font family. Defaults to Helvetica.
 */
Painter.prototype.printText = function (text, x, y, fontColor, fontSize, fontFamily) {
    fontSize = fontSize || 12;
    fontColor = fontColor || "black";
    fontFamily = fontFamily || "Helvetica";

    this.ctx.fillStyle = fontColor;
    this.ctx.font = fontSize + "px " + fontFamily;

    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        this.ctx.fillText(lines[i], x, y + (i*4*fontSize)/3);
    }
};

/**
 * Draws a string centered around the given point. Does NOT handle multi-line strings.
 *
 * @param text The string to draw.
 * @param x The x coordinate of the center position of the drawn string.
 * @param y The y coordinate of the center position of the drawn string.
 * @param {=string} fontColor The text color. Defaults to black.
 * @param {=number} fontSize The text size. Defaults to 12px.
 * @param {=string} fontFamily The text font family. Defaults to Helvetica.
 */
Painter.prototype.printCenteredText = function (text, x, y, fontColor, fontSize, fontFamily) {
    fontSize = fontSize || 12;
    fontColor = fontColor || "black";
    fontFamily = fontFamily || "Helvetica";

    this.ctx.fillStyle = fontColor;
    this.ctx.font = fontSize + "px " + fontFamily;
    var s = this.ctx.measureText(text);

    this.ctx.fillText(text, x - s.width / 2, y + fontSize/3);
};

/**
 * Draws a line segment between the two points.
 *
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @param {=string} color The color of the drawn line. Defaults to black.
 * @param {=number} thickness The thickness of the drawn line. Defaults to 1.
 */
Painter.prototype.strokeLine = function(p1, p2, color, thickness) {
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.strokeStyle = color || "black";
    this.ctx.strokeWidth = thickness || 1;
    this.ctx.stroke();
};

/**
 * Draws representations of complex values used to weight components of a superposition.
 *
 * @param {Rect} area The drawing area, where the amplitude will be represented visually.
 * @param {Complex} amplitude The complex value to represent visually. Its magnitude should be at most 1.
 */
Painter.prototype.paintAmplitude = function(amplitude, area) {
    if (amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_ZERO) {
        painter.fillRect(area, AMPLITUDE_CLEAR_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ZERO);
        return;
    }

    var c = area.center();
    var magnitude = amplitude.abs();
    var p = amplitude.norm2();
    var d = Math.min(area.w, area.h) / 2;
    var r = d * magnitude;
    var dx = d * amplitude.real;
    var dy = d * amplitude.imag;
    var isControl = amplitude === Matrix.__TENSOR_SYGIL_COMPLEX_CONTROL_ONE;

    if (magnitude <= 0.0001) {
        return; // Even showing a tiny dot is too much.
    }

    // fill rect from bottom to top as the amplitude becomes more probable
    painter.fillRect(area.takeBottom(p * area.h), AMPLITUDE_PROBABILITY_FILL_UP_COLOR);

    // show the direction and magnitude as a circle with a line indicator
    painter.fillCircle(c, r, isControl
        ? AMPLITUDE_CIRCLE_FILL_COLOR_WHEN_CONTROL_FORCES_VALUE_TO_ONE
        : AMPLITUDE_CIRCLE_FILL_COLOR_TYPICAL);
    painter.strokeCircle(c, r, AMPLITUDE_CIRCLE_STROKE_COLOR);
    painter.strokeLine(c, {x: c.x + dx, y: c.y - dy});

    // cross out (in addition to the darkening) when controlled
    if (isControl) {
        painter.strokeLine(area.topLeft(), area.bottomRight());
    }
};

/**
 * Draws a grid.
 * @param {Rect} topLeftCell
 * @param {number} cols
 * @param {number} rows
 * @param {=string} strokeColor
 * @param {=number} strokeThickness
 */
Painter.prototype.strokeGrid = function(topLeftCell, cols, rows, strokeColor, strokeThickness) {
    var x = topLeftCell.x;
    var y = topLeftCell.y;
    var dw = topLeftCell.w;
    var dh = topLeftCell.h;
    var x2 = x + cols*dw;
    var y2 = y + rows*dh;
    this.ctx.beginPath();
    for (var c = 0; c <= rows; c++) {
        this.ctx.moveTo(x + c*dw, y);
        this.ctx.lineTo(x + c*dw, y2);
    }
    for (var r = 0; r <= rows; r++) {
        this.ctx.moveTo(x, y + r*dh);
        this.ctx.lineTo(x2, y + r*dh);
    }

    this.ctx.strokeStyle = strokeColor || "black";
    this.ctx.strokeWidth = strokeThickness || 1;
    this.ctx.stroke();
};
var canvas = document.getElementById("drawCanvas");
if (canvas !== null) {
    var numWires = 4;

    var ctx = canvas.getContext("2d");
    var painter = new Painter(ctx);

    // --- Layout Constants ---
    var gateRadius = 20;
    var circuitOperationHorizontalSpacing = 10;
    /**
     * @type {GateColumn[]}
     */
    var circuitOperationColumns = [];

    var TOOLBOX_HEIGHT = 4 * (gateRadius*2 + 2) - gateRadius;

    var CIRCUIT_AREA = new Rect(0, TOOLBOX_HEIGHT + 2, canvas.width, 201);
    var STATE_DRAW_Y = CIRCUIT_AREA.bottom() + 2;
    var STATE_DRAW_H = canvas.height - STATE_DRAW_Y;

    var OPERATION_HINT_AREA = new Rect(
        0,
        STATE_DRAW_Y,
        STATE_DRAW_H,
        STATE_DRAW_H);

    var INTERMEDIATE_STATE_HINT_AREA = new Rect(
        OPERATION_HINT_AREA.right() + 5,
        STATE_DRAW_Y,
        STATE_DRAW_H,
        STATE_DRAW_H);

    var OUTPUT_STATE_HINT_AREA = new Rect(
        canvas.width - STATE_DRAW_H,
        STATE_DRAW_Y,
        STATE_DRAW_H,
        STATE_DRAW_H);

    var makeBitLabel = function(i) {
        if (i == 0) return "A1";
        if (i == 1) return "A2";
        if (i == 2) return "B1";
        if (i == 3) return "B2";
        return "bit" + i;
    };

// --- Math and Circuits ---
    /**
     * @param {Matrix} input
     * @param {GateColumn[]} operations
     * @returns {Matrix}
     */
    var transformVectorWithOperations = function (input, operations) {
        for (var i = 0; i < operations.length; i++) {
            input = operations[i].transform(input);
        }
        return input;
    };

// --- Define toolbox gate types ---
    var spinR = new Gate(
        "R(t)",
        Matrix.identity(2),
        "Evolving Rotation Gate",
        "A rotation gate where the angle of rotation increases and cycles over\n" +
        "time.");
    var spinH = new Gate(
        "H(t)",
        Matrix.identity(2),
        "Evolving Hadamard Gate",
        "Smoothly interpolates from no-op to the Hadamard gate and back over\n" +
        "time. A continuous rotation around the X+Z axis of the Block Sphere.");
    var spinX = new Gate(
        "X(t)",
        Matrix.identity(2),
        "Evolving X Gate",
        "Smoothly interpolates from no-op to the Pauli X gate and back over\n" +
        "time. A continuous rotation around the X axis of the Block Sphere.");
    var spinY = new Gate(
        "Y(t)",
        Matrix.identity(2),
        "Evolving Y Gate",
        "Smoothly interpolates from no-op to the Pauli Y gate and back over\n" +
        "time. A continuous rotation around the Y axis of the Block Sphere.");
    var spinZ = new Gate(
        "Z(t)",
        Matrix.identity(2),
        "Evolving Z Gate",
        "Smoothly interpolates from no-op to the Pauli Z gate and back over\n" +
        "time. A phase gate where the phase angle increases and cycles over\n" +
        "time. A continuous rotation around the Z axis of the Block Sphere.");
    var timeVaryingGates = [spinX, spinY, spinZ, spinR, spinH];

    /**
     * @type {{hint: string, gates: Gate[]}[]}
     */
    var gateSet = [
        {
            hint: "Special",
            gates: [
                Gate.CONTROL,
                Gate.SWAP_HALF,
                Gate.PEEK,
                Gate.ANTI_CONTROL
            ]
        },
        {
            hint: "Half Turns",
            gates: [Gate.H, null, null, Gate.X, Gate.Y, Gate.Z]
        },
        {
            hint: "Quarter Turns (+/-)",
            gates: [
                Gate.DOWN,
                Gate.RIGHT,
                Gate.COUNTER_CLOCKWISE,
                Gate.UP,
                Gate.LEFT,
                Gate.CLOCKWISE]
        },
        {
            hint: "Evolving",
            gates: timeVaryingGates
        },
        {
            hint: "Other Z",
            gates: [
                Gate.fromRotation(0, 0, 1 / 3),
                Gate.fromRotation(0, 0, 1 / 8),
                Gate.fromRotation(0, 0, 1 / 16),
                Gate.fromRotation(0, 0, -1 / 3),
                Gate.fromRotation(0, 0, -1 / 8),
                Gate.fromRotation(0, 0, -1 / 16)
            ]
        }
    ];

// --- Layout Functions ---
    var isHoveringOverTimeBasedGate = false;
    var wireIndexToY = function (i) {
        return CIRCUIT_AREA.y + (2 * i + 1) * CIRCUIT_AREA.h / numWires / 2;
    };
    var wireYToIndex = function (y) {
        var result = Math.round(((y - CIRCUIT_AREA.y) * 2 * numWires / CIRCUIT_AREA.h - 1) / 2);
        if (result < 0 || result >= numWires) return null;
        return result;
    };
    var operationIndexToX = function (index) {
        if (held !== null && held.col !== null) {
            if (index === held.col && circuitOperationColumns.length > 0) {
                index -= 0.5;
            }
            if (index > held.col) {
                index -= 1;
            }
        }
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        return s * (index + 1);
    };
    /**
     * @param {number} x
     * @param {number} y
     * @param {GateColumn[]} circuitCols
     * @returns {{ col : number, row : number, inExisting : boolean }}
     */
    var posToColumnIndexAndInsertSuggestion = function (x, y, circuitCols) {
        var s = gateRadius * 2 + circuitOperationHorizontalSpacing;
        var c = x / s - 0.5;
        var i = Math.floor(c);
        var j = wireYToIndex(y);
        if (j === null) {
            return null;
        }
        if (i < 0) {
            return {col: 0, row: j, inExisting: false};
        }
        if (i >= circuitCols.length) {
            return {col: i, row: j, inExisting: false};
        }

        var dc = c % 1;
        var isBefore = dc <= 0.3;
        var isAfter = dc >= 0.7;
        var isCentered = !isBefore && !isAfter;
        var isFree = circuitCols[i].gates[j] === null;
        if (isFree && isCentered) {
            return {col: i, row: j, inExisting: true};
        }

        var di = isAfter ? 1 : 0;
        return {col: i + di, row: j, inExisting: false};
    };

// --- State ---
    var latestMouseX = 0;
    var latestMouseY = 0;
    /**
     * @type {null|{ gate: Gate, col: (number|null), row: (number|null) }}
     */
    var held = null;
    var isTapping = false;
    var wasTapping = false;

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawFloatingGate = function (x, y, g) {
        var b = Rect.centeredSquareWithRadius(x, y, gateRadius);
        painter.fillRect(b, "orange");
        painter.strokeRect(b);
        drawGateSymbol(x, y, g);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawGateSymbol = function(x, y, g) {
        if (g.symbol === Gate.DRAW_MATRIX_SYMBOL) {
            drawMatrix(Rect.centeredSquareWithRadius(x, y, gateRadius), g.matrix)
        } else if (g === Gate.CONTROL) {
            painter.fillCircle({x: x, y: y}, 5, "black");
        } else if (g === Gate.ANTI_CONTROL) {
            var c = {x: x, y: y};
            var r = 5;
            painter.fillCircle(c, r);
            painter.strokeCircle(c, r);
        } else {
            painter.printCenteredText(g.symbol, x, y);
        }
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawToolboxGate = function (x, y, g) {
        var b = Rect.centeredSquareWithRadius(x, y, gateRadius);
        painter.fillRect(b);
        painter.strokeRect(b);
        drawGateSymbol(x, y, g);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Gate} g
     */
    var drawToolboxGateHintIfHovering = function (x, y, g) {
        var b = Rect.centeredSquareWithRadius(x, y, gateRadius);
        if (!b.containsPoint({x: latestMouseX, y: latestMouseY})) {
            return;
        }
        isHoveringOverTimeBasedGate |= !isNotTimeBasedGate(g);
        if (isTapping && !wasTapping) {
            held = {
                gate: g,
                row: null,
                col: null
            };
        }
        if (held === null) {
            var r = gateRadius;

            painter.fillRect(b, "orange");
            painter.strokeRect(b);

            var r2 = new Rect(50, y + r + 10, 400, (g.description.split("\n").length + 5) * 16 + 4 * r + 35);
            painter.fillRect(r2);
            painter.strokeRect(r2);
            painter.printText(
                g.name +
                "\n\n" +
                g.description +
                "\n\n" +
                "Transition Matrix (input chooses column(s)):\n" +
                "  if OFF   if ON\n" +
                "\n" +
                "                            OFF output\n" +
                "\n" +
                "\n" +
                "                            ON output\n" +
                "\n" +
                "\n" +
                g.matrix.toString(), 50 + 5, y + r + 25);
            drawMatrix(new Rect(55, y + r + 15 + (g.description.split("\n").length + 5) * 16, 4 * r, 4 * r), g.matrix);
        } else {
            painter.fillRect(b);
            painter.strokeRect(b);
        }
        drawGateSymbol(x, y, g);
    };

    /**
     * @param {GateColumn} gateColumn
     * @param {int} columnIndex
     */
    var drawColumnControlWires = function(gateColumn, columnIndex) {
        var hasControls = gateColumn.gates.indexOf(Gate.CONTROL) > -1;
        var hasAntiControls = gateColumn.gates.indexOf(Gate.ANTI_CONTROL) > -1;
        var hasSwaps = gateColumn.gates.indexOf(Gate.SWAP_HALF) > -1;

        if (!hasControls && !hasAntiControls && !hasSwaps) {
            return;
        }

        var minIndex;
        var maxIndex;
        for (var i = 0; i < gateColumn.gates.length; i++) {
            if (gateColumn.gates[gateColumn.gates.length - 1 - i] !== null) {
                minIndex = gateColumn.gates.length - 1 - i;
            }
            if (gateColumn.gates[i] !== null) {
                maxIndex = i;
            }
        }
        var x = operationIndexToX(columnIndex);
        painter.strokeLine({x: x, y: wireIndexToY(minIndex)}, {x: x, y: wireIndexToY(maxIndex)});
    };

    /**
     * Returns the probability of controls on a column being satisfied and a wire being ON,
     * if that was measured.
     *
     * @param {GateColumn} gateColumn
     * @param {int} targetWire
     * @param {Matrix} columnState
     * @returns {{conditional: number, total: number, canDiffer: boolean}}
     */
    var measureGateColumnProbabilityOn = function (gateColumn, targetWire, columnState) {
        var expectedMask = 0;
        var requiredMask = 0;
        for (var i = 0; i < gateColumn.gates.length; i++) {
            if (gateColumn.gates[i] === Gate.CONTROL) {
                requiredMask |= 1 << i;
                expectedMask |= 1 << i;
            } else if (gateColumn.gates[i] === Gate.ANTI_CONTROL) {
                requiredMask |= 1 << i;
            }
        }
        return {
            conditional: measureConditionalProbability(targetWire, expectedMask, requiredMask, columnState),
            total: measureProbability(expectedMask | (1 << targetWire), requiredMask | (1 << targetWire), columnState),
            canDiffer: requiredMask != 0
        };
    };

    /**
     * @param {GateColumn} gateColumn
     * @param {int} columnIndex
     * @param {Matrix} columnState A complex column vector.
     */
    var drawCircuitOperation = function (gateColumn, columnIndex, columnState) {

        drawColumnControlWires(gateColumn, columnIndex);
        var x = operationIndexToX(columnIndex);
        var hasTwoSwaps = gateColumn.gates.filter(function(e) { return e === Gate.SWAP_HALF; }).length === 2;

        for (var i = 0; i < gateColumn.gates.length; i++) {
            var cy = wireIndexToY(i);
            var b = Rect.centeredSquareWithRadius(x, cy, gateRadius);
            var gate = gateColumn.gates[i];
            if (gate === null) {
                continue;
            }

            var isHolding = held !== null && held.col === columnIndex && held.row === i;
            var canGrab = b.containsPoint({x: latestMouseX, y: latestMouseY}) && held === null && !isTapping;
            var didGrab = b.containsPoint({x: latestMouseX, y: latestMouseY}) && held === null && !wasTapping && isTapping;
            var highlightGate = isHolding || canGrab;
            var isModifier = gate === Gate.CONTROL ||
                gate === Gate.ANTI_CONTROL ||
                (gate === Gate.SWAP_HALF && hasTwoSwaps);
            var doDrawGateBox = isHolding || canGrab || !isModifier;
            if (doDrawGateBox) {
                painter.fillRect(b, highlightGate ? "orange" : "white");
                painter.strokeRect(b);
            }
            if (gate === Gate.PEEK) {
                var p = measureGateColumnProbabilityOn(gateColumn, i, columnState);
                drawProbabilityBox(b, p.conditional, p.total, p.canDiffer);
            } else if (gate == Gate.SWAP_HALF) {
                if (hasTwoSwaps) {
                    var swapRect = Rect.centeredSquareWithRadius(x, cy, gateRadius/2);
                    painter.strokeLine(swapRect.topLeft(), swapRect.bottomRight());
                    painter.strokeLine(swapRect.topRight(), swapRect.bottomLeft());
                } else {
                    painter.printCenteredText("Swap", x, cy - 5);
                    painter.printCenteredText("(Unpaired)", x, cy + 5, undefined, 8);
                }
            } else {
                drawGateSymbol(x, cy, gate);
            }
            if (didGrab) {
                held = {gate: gate, col: null, row: null};
                circuitOperationColumns[columnIndex].gates[i] = null;
            }
        }
    };
    /**
     * @param {Matrix} inputState
     * @param {GateColumn[]} gateColumns
     */
    var drawCircuit = function (inputState, gateColumns) {
        for (var i = 0; i < numWires; i++) {
            var wireY = wireIndexToY(i);
            painter.printCenteredText(makeBitLabel(i) + ":", CIRCUIT_AREA.x + 14, wireY);
            painter.strokeLine({x: CIRCUIT_AREA.x + 30, y: wireY}, {x: CIRCUIT_AREA.x + canvas.width, y: wireY});
        }
        for (var i2 = 0; i2 < gateColumns.length; i2++) {
            inputState = gateColumns[i2].matrix().times(inputState);
            drawCircuitOperation(gateColumns[i2], i2, inputState);
        }
    };

    /**
     * @param {Rect} rect
     * @param {number} conditional_probability
     * @param {number} intersection_probability
     * @param {boolean} can_differ
     */
    var drawProbabilityBox = function (rect, conditional_probability, intersection_probability, can_differ) {
        painter.fillRect(rect);
        painter.strokeRect(rect);
        if (!can_differ) {
            var w = rect.w * conditional_probability;
            painter.fillRect(rect.takeLeft(w), "gray");
            painter.printCenteredText((conditional_probability*100).toFixed(1) + "%", rect.center().x, rect.center().y);
        } else {
            if (isNaN(conditional_probability)) {
                ctx.beginPath();
                ctx.moveTo(rect.x, rect.y);
                ctx.lineTo(rect.x + rect.w, rect.y + rect.h/2);
                ctx.lineTo(rect.x, rect.y + rect.h/2);
                ctx.lineTo(rect.x, rect.y);
                ctx.fillStyle = "gray";
                ctx.fill();
                painter.strokeLine(rect.topLeft(), rect.centerRight());
                painter.printText("|:N/A", rect.x + 2, rect.y + 15, undefined, 10);
            } else {
                var w1 = rect.w * conditional_probability;
                painter.fillRect(rect.topHalf().takeLeft(w1), "gray");
                painter.printText(" |:" + Math.round(conditional_probability*100) + "%", rect.x + 2, rect.y + 15, undefined, 10);
            }
            var w2 = rect.w * intersection_probability;
            painter.fillRect(rect.bottomHalf().takeLeft(w2), "gray");
            ctx.fillStyle = "black";
            ctx.fillText("∧:" + Math.round(intersection_probability*100) + "%", rect.x + 2, rect.y + rect.h/2 + 15);
        }
    };

    /**
     * @param {Rect} rect
     * @param {Matrix} matrix
     */
    var drawMatrix = function (rect, matrix) {
        var n = matrix.width();
        var w = rect.w / n;
        var h = rect.h / n;
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                painter.paintAmplitude(matrix.rows[j][i], new Rect(rect.x + w * i, rect.y + h * j, w, h));
            }
        }

        // draw borders
        ctx.beginPath();
        var r = rect.x + rect.w;
        var b = rect.y + rect.h;
        for (var k = 0; k <= n; k++) {
            var x = rect.x + w * k;
            var y = rect.y + h * k;
            ctx.moveTo(rect.x, y);
            ctx.lineTo(r, y);
            ctx.moveTo(x, b);
            ctx.lineTo(x, rect.y);
        }
        ctx.strokeStyle = "black";
        ctx.stroke();
    };

    /**
     * @param {Rect} rect
     * @param {Matrix} values A column vector.
     */
    var drawState = function (rect, values) {
        // draw values
        var s = 1 << Math.ceil(numWires / 2);
        var dw = Math.floor(Math.min(rect.w, rect.h) / s);
        var dh = dw;
        for (var i = 0; i < values.height(); i++) {
            var dx = i % s;
            var dy = Math.floor(i / s);
            var x = rect.x + dw * dx;
            var y = rect.y + dh * dy;
            painter.paintAmplitude(values.rows[i][0], new Rect(x, y, dw, dh));
        }

        // draw borders
        painter.strokeGrid(new Rect(rect.x, rect.y, dw, dh), s, values.height() / s);
    };

    /**
     * Determines the probability of a wire or wires having particular values, given a quantum state.
     *
     * Note that wire probabilities are not independent in general. Wires may be correlated.
     *
     * @param {int} wireExpectedMask The bits of this number determine the desired wire values.
     * @param {int} wireRequiredMask The set bits of this number determine which wire values to check.
     * @param {Matrix} state A complex column vector.
     */
    var measureProbability = function(wireExpectedMask, wireRequiredMask, state) {
        var t = 0;
        for (var i = 0; i < state.height(); i++) {
            if ((i & wireRequiredMask) == (wireExpectedMask & wireRequiredMask)) {
                t += state.rows[i][0].norm2();
            }
        }
        return t;
    };

    /**
     * @param {int} wireTarget
     * @param {int} wireExpectedMask
     * @param {int} wireRequiredMask
     * @param {Matrix} state
     */
    var measureConditionalProbability = function(wireTarget, wireExpectedMask, wireRequiredMask, state) {
        var t_off = 0;
        var t_on = 0;
        for (var i = 0; i < state.height(); i++) {
            if ((i & wireRequiredMask) == (wireExpectedMask & wireRequiredMask)) {
                if ((i & (1 << wireTarget)) != 0) {
                    t_on += state.rows[i][0].norm2();
                } else {
                    t_off += state.rows[i][0].norm2();
                }
            }
        }
        return t_on / (t_off + t_on);
    };

    /**
     * @param {number} x
     * @param {Matrix} outputState
     */
    var drawSingleWireProbabilities = function (x, outputState) {
        for (var i = 0; i < numWires; i++) {
            var p = measureProbability(1 << i, 1 << i, outputState);
            drawProbabilityBox(Rect.centeredSquareWithRadius(x + 25, wireIndexToY(i), gateRadius), p, p, false);
        }
    };

    /**
     * @param {GateColumn[]} operations
     * @param {Rect} drawRect
     */
    var drawOutputAfter = function (operations, drawRect) {
        var input = makeInputVector();
        var output = transformVectorWithOperations(input, operations);
        drawSingleWireProbabilities(canvas.width - gateRadius*2 - 10, output);
        var gridRect = drawRect.skipLeft(14).skipTop(14);
        drawState(gridRect, output);
        painter.printCenteredText(makeBitLabel(0), gridRect.x + gridRect.w/4, drawRect.y + 8);
        painter.printCenteredText(makeBitLabel(1), gridRect.x + gridRect.w*2/4, drawRect.y + 6);
        painter.printCenteredText(makeBitLabel(0), gridRect.x + gridRect.w*3/4, drawRect.y + 8);
        painter.printCenteredText(makeBitLabel(2), drawRect.x + 6, gridRect.y + gridRect.h/4);
        painter.printCenteredText(makeBitLabel(3), drawRect.x + 4, gridRect.y + gridRect.h*2/4);
        painter.printCenteredText(makeBitLabel(2), drawRect.x + 6, gridRect.y + gridRect.h*3/4);
    };

    var drawGateSet = function () {
        var backRect = new Rect(0, 0, canvas.width, TOOLBOX_HEIGHT);
        painter.fillRect(backRect, "#CCC");
        painter.strokeRect(backRect);

        for (var i = 0; i < 2; i++) {
            for (var c = 0; c < gateSet.length; c++) {
                var col = gateSet[c];
                var x1 = c * (gateRadius * 4 + 22) + 50;
                var x2 = x1 + gateRadius * 2 + 2;
                if (i == 0) {
                    painter.printCenteredText(col.hint, (x1 + x2) / 2, 10);
                }

                for (var r = 0; r < col.gates.length; r++) {
                    if (col.gates[r] === null) continue;
                    var dx = Math.floor(r / 3);
                    var dy = r % 3;
                    var x = x1 + (gateRadius * 2 + 2) * dx;
                    var y = 18 + gateRadius + dy * (gateRadius * 2 + 2);
                    if (i == 0) {
                        drawToolboxGate(x, y, col.gates[r]);
                    } else {
                        drawToolboxGateHintIfHovering(x, y, col.gates[r]);
                    }
                }
            }
        }
    };

    var redraw = function () {
        isHoveringOverTimeBasedGate = false;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var candidateNewCols = circuitOperationColumns.slice(0);
        for (var i = 0; i < candidateNewCols.length; i++) {
            candidateNewCols[i] = new GateColumn(candidateNewCols[i].gates.slice(0));
        }
        var insertSite = CIRCUIT_AREA.containsPoint({x: latestMouseX, y: latestMouseY})
            ? posToColumnIndexAndInsertSuggestion(latestMouseX, latestMouseY, candidateNewCols)
            : null;
        if (insertSite !== null && held === null && insertSite.col >= candidateNewCols.length) {
            insertSite = null;
        }

        // Add held operation into circuit
        if (insertSite !== null && held !== null) {
            if (!insertSite.inExisting) {
                while (candidateNewCols.length < insertSite.col) {
                    candidateNewCols.push(GateColumn.empty(numWires));
                }
                candidateNewCols.splice(insertSite.col, 0, GateColumn.empty(numWires));
                held.row = insertSite.row;
                held.col = insertSite.col;
            } else {
                held.row = null;
                held.col = null;
            }
            candidateNewCols[insertSite.col].gates[insertSite.row] = held.gate;
        }

        if (insertSite !== null && held === null) {
            var x1 = operationIndexToX(insertSite.col - 0.5);
            var x2 = operationIndexToX(insertSite.col + 0.5);
            ctx.fillStyle = held === null ? "yellow" : "orange";
            ctx.fillRect(x1, CIRCUIT_AREA.y, x2 - x1, CIRCUIT_AREA.h);
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(x2, CIRCUIT_AREA.y);
            ctx.lineTo(x2, CIRCUIT_AREA.y + CIRCUIT_AREA.h);
            ctx.strokeStyle = "gray";
            ctx.stroke();
        }

        drawCircuit(makeInputVector(), candidateNewCols);

        if (insertSite !== null) {
            var m = candidateNewCols[insertSite.col].matrix();
            drawMatrix(OPERATION_HINT_AREA, m);

            drawOutputAfter(candidateNewCols.slice(0, insertSite.col + 1), INTERMEDIATE_STATE_HINT_AREA);
        }
        drawOutputAfter(candidateNewCols, OUTPUT_STATE_HINT_AREA);

        drawGateSet();

        if (held !== null && insertSite === null) {
            drawFloatingGate(latestMouseX, latestMouseY, held.gate);
        }

        if (insertSite !== null && held !== null && wasTapping && !isTapping) {
            circuitOperationColumns = candidateNewCols.filter(function(e) { return !e.isEmpty();});
        }

        var shouldBeTicking = isHoveringOverTimeBasedGate || hasTimeBasedGates();
        var isTicking = ticker !== null;
        if (isTicking != shouldBeTicking) {
            if (shouldBeTicking) {
                ticker = setInterval(tick, 50);
            } else {
                clearInterval(ticker);
                ticker = null;
            }
        }
    };

    var hasTimeBasedGates = function() {
        return !circuitOperationColumns.every(function(e) { return e.gates.every(isNotTimeBasedGate); });
    };
    var isNotTimeBasedGate = function(g) {
        return timeVaryingGates.indexOf(g) == -1;
    };

    var mouseUpdate = function (p, pressed) {
        //noinspection JSUnresolvedFunction
        latestMouseX = p.pageX - $(canvas).position().left;
        //noinspection JSUnresolvedFunction
        latestMouseY = p.pageY - $(canvas).position().top;
        if (isTapping != pressed) {
            wasTapping = isTapping;
            isTapping = pressed;
        }
        redraw();

        if (!isTapping) {
            held = null;
        }
        if (isTapping != wasTapping) {
            wasTapping = isTapping;
            redraw();
        }
    };
    //noinspection JSUnresolvedFunction
    $(canvas).mousedown(function (p) {
        if (p.which != 1) return;
        mouseUpdate(p, true);
    });
    //noinspection JSUnresolvedFunction
    $(document).mouseup(function (p) {
        if (p.which != 1) return;
        mouseUpdate(p, false);
    });
    //noinspection JSUnresolvedFunction
    $(document).mousemove(function (p) {
        if (isTapping) {
            mouseUpdate(p, isTapping);
        }
    });
    //noinspection JSUnresolvedFunction
    $(canvas).mousemove(function (p) {
        if (!isTapping) {
            mouseUpdate(p, isTapping);
        }
    });
    //noinspection JSUnresolvedFunction
    $(canvas).mouseleave(function () {
        mouseUpdate({offsetX: -100, offsetY: -100}, isTapping);
    });

    var ts = 0;
    /**
     * @returns {Matrix}
     */
    var makeInputVector = function () {
        return Matrix.col([1, 0]).tensorPower(numWires);
    };

    var tick = function() {
        ts += 0.05;
        ts %= 2 * Math.PI;
        var u = ts / 2 / Math.PI;
        var u2 = u / Math.sqrt(2);
        var c = Math.cos(ts);
        var s = Math.sin(ts);

        spinR.matrix = Matrix.square([c, -s, s, c]);
        spinX.matrix = Matrix.fromRotation(u, 0, 0);
        spinY.matrix = Matrix.fromRotation(0, u, 0);
        spinZ.matrix = Matrix.fromRotation(0, 0, u);
        spinH.matrix = Matrix.fromRotation(u2, 0, u2);
        redraw();
    };
    var ticker = null;
    redraw();
}

