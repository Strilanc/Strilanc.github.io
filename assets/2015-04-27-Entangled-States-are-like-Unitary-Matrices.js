function Complex(r, i) {
    this.r = r;
    this.i = i;
}

var real = function (c) {
    if (c instanceof Complex) {
        return c.r;
    }
    return float(c);
};

Complex.from = function (c) {
    if (c instanceof Complex) {
        return c;
    }
    return new Complex(c, 0);
};

Complex.prototype.toString = function () {
    return this.r.toFixed(3) + " + " + this.i.toFixed(3) + "i";
};

Complex.prototype.plus = function (c) {
    c = Complex.from(c);
    return new Complex(this.r + c.r, this.i + c.i);
};

Complex.prototype.minus = function (c) {
    c = Complex.from(c);
    return new Complex(this.r - c.r, this.i - c.i);
};

Complex.prototype.times = function (c) {
    c = Complex.from(c);
    return new Complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r);
};

Complex.prototype.phase = function () {
    return Math.atan2(this.i, this.r);
};

Complex.prototype.dividedBy = function (c) {
    c = Complex.from(c);
    var d = c.norm2();
    if (d === 0) throw "Division by Zero";

    var n = this.times(c.conjugate());
    return new Complex(n.r / d, n.i / d);
};

Complex.prototype.norm2 = function () {
    return this.r * this.r + this.i * this.i;
};

Complex.prototype.conjugate = function () {
    return new Complex(this.r, -this.i);
};

Complex.prototype.unit = function () {
    var m = Math.sqrt(this.norm2());
    if (m < 0.00001) {
        var theta = Math.atan2(this.i, this.r);
        return new Complex(Math.cos(theta), -Math.sin(theta));
    }
    return this.dividedBy(m);
};

function Quop(v) {
    this.m = [Complex.from(v[0]), Complex.from(v[1]), Complex.from(v[2]), Complex.from(v[3])];
}

Quop.prototype.toString = function () {
    return "[[" + this.m[0] + ", " + this.m[1] + "], [" + this.m[2] + ", " + this.m[3] + "]]";
};

Quop.prototype.transpose = function () {
    return new Quop([this.m[0], this.m[2],
                     this.m[1], this.m[3]]);
};

Quop.prototype.adjoint = function () {
    return new Quop([this.m[0].conjugate(), this.m[2].conjugate(),
        this.m[1].conjugate(), this.m[3].conjugate()]);
};

Quop.prototype.scaledBy = function (s) {
    s = Complex.from(s);
    return new Quop([this.m[0].times(s), this.m[1].times(s),
        this.m[2].times(s), this.m[3].times(s)]);
};

Quop.prototype.plus = function (other) {
    return new Quop([this.m[0].plus(other.m[0]), this.m[1].plus(other.m[1]),
        this.m[2].plus(other.m[2]), this.m[3].plus(other.m[3])]);
};

Quop.prototype.times = function (other) {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];

    var e = other.m[0];
    var f = other.m[1];
    var g = other.m[2];
    var h = other.m[3];

    return new Quop([
        a.times(e).plus(b.times(g)), a.times(f).plus(b.times(h)),
        c.times(e).plus(d.times(g)), c.times(f).plus(d.times(h))]);
};

