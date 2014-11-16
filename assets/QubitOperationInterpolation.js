function complex(r, i) {
    this.r = r;
    this.i = i;
}

var real = function (c) {
    if (c instanceof complex) {
        return c.r;
    }
    return float(c);
};

complex.from = function (c) {
    if (c instanceof complex) {
        return c;
    }
    return new complex(c, 0);
};

complex.prototype.toString = function () {
    return this.r + " + " + this.i + "i";
};

complex.prototype.plus = function (c) {
    c = complex.from(c);
    return new complex(this.r + c.r, this.i + c.i);
};

complex.prototype.minus = function (c) {
    c = complex.from(c);
    return new complex(this.r - c.r, this.i - c.i);
};

complex.prototype.times = function (c) {
    c = complex.from(c);
    return new complex(this.r * c.r - this.i * c.i, this.r * c.i + this.i * c.r);
};

complex.prototype.phase = function () {
    return Math.atan2(this.i, this.r);
};

complex.prototype.dividedBy = function (c) {
    c = complex.from(c);
    var d = c.norm2();
    if (d === 0) throw "Division by Zero";

    var n = this.times(c.conjugate());
    return new complex(n.r / d, n.i / d);
};

complex.prototype.norm2 = function () {
    return this.r * this.r + this.i * this.i;
};

complex.prototype.conjugate = function () {
    return new complex(this.r, -this.i);
};

complex.prototype.unit = function () {
    var m = Math.sqrt(this.norm2());
    if (m < 0.00001) {
        var theta = Math.atan2(this.i, this.r);
        return new complex(Math.cos(theta), -Math.sin(theta));
    }
    return this.dividedBy(m);
};

function quop(v) {
    this.m = [complex.from(v[0]), complex.from(v[1]), complex.from(v[2]), complex.from(v[3])];
}

quop.prototype.toString = function () {
    return "[[" + this.m[0] + ", " + this.m[1] + "], [" + this.m[2] + ", " + this.m[3] + "]]";
};

quop.prototype.adjoint = function () {
    return new quop([this.m[0].conjugate(), this.m[2].conjugate(),
    this.m[1].conjugate(), this.m[3].conjugate()]);
};

quop.prototype.scaledBy = function (s) {
    s = complex.from(s);
    return new quop([this.m[0].times(s), this.m[1].times(s),
    this.m[2].times(s), this.m[3].times(s)]);
};

quop.prototype.plus = function (other) {
    return new quop([this.m[0].plus(other.m[0]), this.m[1].plus(other.m[1]),
    this.m[2].plus(other.m[2]), this.m[3].plus(other.m[3])]);
};

quop.prototype.times = function (other) {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];

    var e = other.m[0];
    var f = other.m[1];
    var g = other.m[2];
    var h = other.m[3];

    return new quop([
    a.times(e).plus(b.times(g)), a.times(f).plus(b.times(h)),
    c.times(e).plus(d.times(g)), c.times(f).plus(d.times(h))]);
};

quop.prototype.draw = function (ctx, x, y, d) {
    ctx.fillStyle = "yellow";
    var w = d / 2;
    var r = w / 2;

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

    // Arrows
    for (i = 0; i < 4; i++) {
        var dx = i % 2;
        var dy = (i - dx) / 2;
        var cx = x + dx * w + r;
        var cy = y + dy * w + r;
        var v = this.m[i];

        ctx.beginPath();
        ctx.arc(cx, cy, Math.sqrt(v.norm2()) * r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "gray";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + v.r * r, cy - v.i * r);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
};

var maxBy = function (items, projection) {
    var hasBest = false;
    var bestValue = null;
    var bestWeight = null;
    for (var i in items) {
        var v = items[i];
        var w = projection(v);
        if (!hasBest || w > bestWeight) {
            hasBest = true;
            bestValue = v;
            bestWeight = w;
        }
    }
    return bestValue;
};

var squaredSum = function (items) {
    var total = 0;
    for (var i in items) {
        var v = items[i];
        total += v * v;
    }
    return total;
};

quop.prototype.ubreakdown = function () {
    var a = this.m[0];
    var b = this.m[1];
    var c = this.m[2];
    var d = this.m[3];

    var t = a.plus(d).dividedBy(new complex(0, 2));
    var x = b.plus(c).dividedBy(new complex(2, 0));
    var y = b.minus(c).dividedBy(new complex(0, -2));
    var z = a.minus(d).dividedBy(new complex(2, 0));

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
    return new quop([c, -s, s, c]);
};

var phase_cancel_matrix = function (p, q) {
    p = complex.from(p);
    q = complex.from(q);
    return new quop([p.unit().conjugate(), 0, 0, q.unit().conjugate()]);
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
    new quop([s_0 + s_d, 0, 0, s_0 - s_d]),
    rotation_matrix(theta_0 + theta_d)];
};

quop.prototype.svd = function () {
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

quop.prototype.repair_by_svd = function (syndrome_label) {
    var svd = this.svd();
    var u = svd[0];
    var s = svd[1];
    var v = svd[2];

    var s1 = real(s.m[0]);
    var s2 = real(s.m[3]);
    if (Math.abs(s1 - 1) < 0.03 && Math.abs(s2 - 1) < 0.03) {
        syndrome_label.html("");
    } else if (Math.abs(s1 - s2) < 0.01) {
        syndrome_label.html("(fixed by scaling)");
    } else {
        syndrome_label.html("(fixed by svd)");
    }

    return u.times(v);
};

quop.prototype.ulerp = function (other, t) {
    var u1 = this;
    var u2 = other;
    var b1 = u1.ubreakdown();
    var b2 = u2.ubreakdown();

    var t1 = b1[0];
    var x1 = b1[1];
    var y1 = b1[2];
    var z1 = b1[3];
    var p1 = b1[4];

    var t2 = b2[0];
    var x2 = b2[1];
    var y2 = b2[2];
    var z2 = b2[3];
    var p2 = b2[4];

    var dot = t1 * t2 + x1 * x2 + y1 * y2 + z1 * z2;
    if (dot < -0.0000001) {
        p2 = p2.times(-1);
        dot *= -1;
    }
    if (dot > +1) {
        dot = 1;
    }
    var n1 = u1.scaledBy(p1.conjugate());
    var n2 = u2.scaledBy(p2.conjugate());
    var theta = Math.acos(dot);

    var c1 = sin_scale_ratio(theta, 1 - t);
    var c2 = sin_scale_ratio(theta, t);
    var n3 = n1.scaledBy(c1).plus(n2.scaledBy(c2));

    var phase_angle_1 = p1.phase();
    var phase_angle_2 = p2.phase();
    var phase_drift = (phase_angle_2 - phase_angle_1 + Math.PI) % (Math.PI * 2) - Math.PI;
    var phase_angle_3 = phase_angle_1 + phase_drift * t;
    var p3 = new complex(Math.cos(phase_angle_3), Math.sin(phase_angle_3));
    return n3.scaledBy(p3);
};

var parseComplexPart = function (text, syndrome_label) {
    var t = text.trim();
    if (t === "i") {
        return new complex(0, 1);
    }
    var isImaginary = /i$/.exec(t) !== null;
    if (isImaginary) {
        t = t.substring(0, t.length - 1);
    }
    t = t.trim();
    value = parseFloat(t);
    if (isNaN(value)) {
        syndrome_label.html("(err: NaN)");
        return null;
    }
    if (isImaginary) {
        return new complex(0, value);
    }
    return new complex(value, 0);
};

var parseComplexFormula = function (text, syndrome_label) {
    if (text.trim() === "") {
        syndrome_label.html("(err: empty entry)");
        return null;
    }

    var total = complex.from(0);
    var sums = text.split("+");
    for (var i = 0; i < sums.length; i++) {
        var sum = sums[i];
        var difs = sum.split("-");
        for (var j = 0; j < difs.length; j++) {
            var dif = difs[j];
            if (j === 0 && dif.trim().length === 0) {
                continue;
            }
            var v = parseComplexPart(dif, syndrome_label);
            if (v === null) {
                return null;
            }
            if (j === 0) {
                total = total.plus(v);
            } else {
                total = total.minus(v);
            }
        }
    }
    return total;
};

var parseComplexMatrix = function (text, syndrome_label) {
    if (text.trim().toLowerCase() === "i") {
        return new quop([1, 0, 0, 1]);
    }
    if (text.trim().toLowerCase() === "x") {
        return new quop([0, 1, 1, 0]);
    }
    if (text.trim().toLowerCase() === "y") {
        return new quop([0, new complex(0, -1), new complex(0, 1), 0]);
    }
    if (text.trim().toLowerCase() === "z") {
        return new quop([1, 0, 0, -1]);
    }
    if (text.trim().toLowerCase() === "h") {
        return new quop([Math.sqrt(0.5), Math.sqrt(0.5), Math.sqrt(0.5), -Math.sqrt(0.5)]);
    }
    var vals = /^([^,]+),([^,]+),([^,]+),([^,]+)$/.exec(text);
    if (vals === null || vals.length != 5) {
        syndrome_label.html("(err: need 4 vals)");
        return null;
    }

    entries = [];
    for (var i = 1; i <= 4; i++) {
        var c = parseComplexFormula(vals[i], syndrome_label);
        if (c === null) {
            return null;
        }
        entries.push(c);
    }

    return new quop(entries);
};

// Track entered matrices
var entered_matrix_1 = null;
var entered_matrix_2 = null;
var parseInput = function () {
    var syndrome_label_1 = $("#matrix_fixes_1");
    var syndrome_label_2 = $("#matrix_fixes_2");
    
    entered_matrix_1 = parseComplexMatrix($('#matrix1').val(), syndrome_label_1);
    if (entered_matrix_1 !== null) {
        entered_matrix_1 = entered_matrix_1.repair_by_svd(syndrome_label_1);
    }

    entered_matrix_2 = parseComplexMatrix($('#matrix2').val(), syndrome_label_2);
    if (entered_matrix_2 !== null) {
        entered_matrix_2 = entered_matrix_2.repair_by_svd(syndrome_label_2);
    }
};
$('#matrix1').on('input', parseInput);
$('#matrix2').on('input', parseInput);
parseInput();

// Periodically draw entered matrices, and interpolations between them
var canvas = document.getElementById("drawCanvas");
t = 0;
setInterval(function () {
    t %= Math.PI * 2;
    var ctx = canvas.getContext("2d");
    canvas.width = canvas.width; // Clears things drawn on the canvas.

    if (entered_matrix_1 !== null) {
        entered_matrix_1.draw(ctx, 2, 2, 150);
    }
    if (entered_matrix_2 !== null) {
        entered_matrix_2.draw(ctx, 500 - 150 - 2, 2, 150);
    }

    if (entered_matrix_1 !== null && entered_matrix_2 !== null) {
        var p = Math.sin(t) / 2 + 0.5;
        var lerped = entered_matrix_1.ulerp(entered_matrix_2, p);
        lerped.draw(ctx, 250 - 150 / 2, 2, 150);

        ctx.beginPath();
        ctx.rect(250, 160, (150 * (p - 0.5)), 10);
        ctx.fillStyle = "green";
        ctx.strokeStyle = "black";
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(250 - 150 / 2, 160, 150, 10);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    t += 0.1;
}, 50);
