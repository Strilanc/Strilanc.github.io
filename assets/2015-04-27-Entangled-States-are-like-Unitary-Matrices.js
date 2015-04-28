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

Quop.prototype.draw = function (ctx, x, y, d) {
    var w = d / 2;
    var r = w / 2;

    // Arrows
    for (i = 0; i < 4; i++) {
        var dx = i % 2;
        var dy = (i - dx) / 2;
        var cx = x + dx * w + r;
        var cy = y + dy * w + r;
        var v = this.m[i];

        ctx.fillStyle = "lightgray";
        var p = v.norm2();
        ctx.fillRect(cx - r, cy - r + w*(1-p), w, w*p);

        ctx.beginPath();
        ctx.arc(cx, cy, Math.sqrt(v.norm2()) * r, 0, 2 * Math.PI);
        ctx.fillStyle = "yellow";
        ctx.fill();
        ctx.strokeStyle = "gray";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + v.r * r, cy - v.i * r);
        ctx.strokeStyle = "black";
        ctx.stroke();

        // Text
        var t = v.toString();
        ctx.fillStyle = 'black';
        ctx.fillText(t, cx - ctx.measureText(t).width/2, cy + r - 5);
        t = ["|00〉", "|01〉", "|10〉", "|11〉"][i];
        ctx.fillText(t, cx - r + 5, cy - r + 15);
    }

    // Grid
    ctx.beginPath();
    for (var i = 0; i <= 2; i++) {
        ctx.moveTo(x + w * i, y);
        ctx.lineTo(x + w * i, y + w * 2);

        ctx.moveTo(x, y + w * i);
        ctx.lineTo(x + w * 2, y + w * i);
    }
    ctx.strokeStyle = "black";
    ctx.stroke();
};

