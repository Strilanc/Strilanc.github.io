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

var maxBy = function (items, projection) {
    var hasBest = false;
    var bestValue = null;
    var bestWeight = null;
    for (var i in items) {
        if (items.hasOwnProperty(i)) {
            var v = items[i];
            var w = projection(v);
            if (!hasBest || w > bestWeight) {
                hasBest = true;
                bestValue = v;
                bestWeight = w;
            }
        }
    }
    return bestValue;
};

var squaredSum = function (items) {
    var total = 0;
    for (var i in items) {
        if (items.hasOwnProperty(i)) {
            var v = items[i];
            total += v * v;
        }
    }
    return total;
};

Quop.prototype.ubreakdown = function () {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];

    var t = a.plus(d).dividedBy(new Complex(0, 2));
    var x = b.plus(c).dividedBy(new Complex(2, 0));
    var y = b.minus(c).dividedBy(new Complex(0, -2));
    var z = a.minus(d).dividedBy(new Complex(2, 0));

    var p = maxBy([t, x, y, z], function (e) {
        return e.norm2();
    }).unit();
    var pt = t.dividedBy(p);
    var px = x.dividedBy(p);
    var py = y.dividedBy(p);
    var pz = z.dividedBy(p);

    return [pt.r, px.r, py.r, pz.r, p];
};

var sin_scale_ratio = function (theta, factor) {
    // Near zero, switch to a Taylor series based approximation to avoid floating point error blowup.
    if (Math.abs(theta) < 0.0001) {
        var d = theta * theta / 6;
        return factor * (1 - d * factor * factor) / (1 - d);
    }
    return Math.sin(theta * factor) / Math.sin(theta);
};

var rotation_matrix = function (theta) {
    var c = Math.cos(theta);
    var s = Math.sin(theta);
    return new Quop([c, -s, s, c]);
};

var phase_cancel_matrix = function (p, q) {
    p = Complex.from(p);
    q = Complex.from(q);
    return new Quop([p.unit().conjugate(), 0, 0, q.unit().conjugate()]);
};

var singular_value_decomposition_real_2x2 = function (m) {
    var a = real(m.m[0]);
    var b = real(m.m[1]);
    var c = real(m.m[2]);
    var d = real(m.m[3]);

    var t = a + d;
    var x = b + c;
    var y = b - c;
    var z = a - d;

    var theta_0 = Math.atan2(x, t) / 2.0;
    var theta_d = Math.atan2(y, z) / 2.0;

    var s_0 = Math.sqrt(t * t + x * x) / 2.0;
    var s_d = Math.sqrt(z * z + y * y) / 2.0;

    return [
        rotation_matrix(theta_0 - theta_d),
        new Quop([s_0 + s_d, 0, 0, s_0 - s_d]),
        rotation_matrix(theta_0 + theta_d)];
};

Quop.prototype.svd = function () {
    var m = this;
    var p = phase_cancel_matrix(m.m[0], m.m[1]);
    var m2 = m.times(p);

    // Cancel top-right value by rotation.
    // m3 = m p r = | ?+?i  0    |
    //              | ?+?i  ?+?i |
    var r = rotation_matrix(Math.atan2(m2.m[1].r, m2.m[0].r));
    var m3 = m2.times(r);

    // Make bottom row non-imaginary and non-negative by column phasing.
    // m4 = m p r q = | ?+?i  0 |
    //                | >     > |
    var q = phase_cancel_matrix(m3.m[2], m3.m[3]);
    var m4 = m3.times(q);

    // Cancel imaginary part of top left value by row phasing.
    // m5 = t m p r q = | > 0 |
    //                  | > > |
    var t = phase_cancel_matrix(m4.m[0], 1);
    var m5 = t.times(m4);

    // All values are now real (also the top-right is zero), so delegate to a
    // singular value decomposition that works for real matrices.
    // t m p r q = u s v
    var usv = singular_value_decomposition_real_2x2(m5);

    // m = (t* u) s (v q* r* p*)
    return [t.adjoint().times(usv[0]),
        usv[1],
        usv[2].times(q.adjoint()).times(r.adjoint()).times(p.adjoint())];
};

Quop.prototype.asStateAfterOperationOn1 = function(op) {
    return this.times(op.transpose());
};

Quop.prototype.asStateAfterOperationOn2 = function(op) {
    return op.times(this);
};

Quop.prototype.asStateAfterCNotOnto1 = function() {
    var m = this.m;
    return new Quop(
        m[0], m[1],
        m[3], m[2]);
};

Quop.prototype.asStateAfterCNotOnto2 = function() {
    var m = this.m;
    return new Quop(
        m[0], m[3],
        m[2], m[1]);
};

Quop.rotationMatrix = function(t) {
    var s = new Complex(Math.sin(t), 0);
    var c = new Complex(Math.cos(t), 0);
    return new Quop([c, s.times(-1), s, c]);
};

Quop.phaseMatrix = function(t) {
    var s = Math.sin(t);
    var c = Math.cos(t);
    return new Quop([new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(c, s)]);
};

var createWidget = function(canvas, s1, s2, title) {
};

createWidget(document.getElementById("drawCanvas1"), 1, 0, "Operate on Independent Qubits");
createWidget(document.getElementById("drawCanvas2"), Math.sqrt(0.5), Math.sqrt(0.5), "Operate on Entangled Qubits");

