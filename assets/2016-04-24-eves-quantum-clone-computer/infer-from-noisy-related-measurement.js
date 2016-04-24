let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let possibles = [];
let epsilon = 0.02;
let vals = [];
for (let r = -1; r < +1; r += epsilon) {
  vals.push(r);
}

for (let u = 0; u < 1; u += epsilon) {
  for (let v = 0; v < 1; v += epsilon) {
    let u2 = u + (Math.random()-0.5)*epsilon;
    let v2 = v + (Math.random()-0.5)*epsilon;
    let theta = 2*Math.PI*u2;
    let phi = 2*Math.PI*v2;
    let r1 = Math.cos(theta);
    let r2 = Math.sin(theta)*Math.cos(phi);
    let i2 = Math.sin(theta)*Math.sin(phi);
    possibles.push({
      OffOff: {r:0, i:0},
      OffOn: {r:r1, i:0},
      OnOff: {r:0, i:0},
      OnOn: {r:r2,i:i2}
    });
  }
}
if (true) {
  // Pick random state as the 'true' state.
  let actualIndex = Math.floor(Math.random() * possibles.length)
  let t = possibles[0];
  possibles[0] = possibles[actualIndex]
  possibles[actualIndex] = t;
}

const rot = 75;
let redraw = () => {
  ctx.fillStyle = 'white';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 0, 150, 150);
  ctx.globalAlpha = 1;
  let pts = [];
  for (let e of possibles) {
    // density matrix coefficients
    let mulConj = (u, v) => ({
      r: u.r*v.r + u.i*v.i,
      i: u.i*v.r - u.r*v.i
    });
    let plus = (u, v) => ({
      r: u.r +v.r,
      i: u.i + v.i
    });
    let [off1, on1] = [e.OffOn, e.OnOn];
    let [off2, on2] = [e.OffOff, e.OnOff];
    let [a, b, c, d] = [
      plus(mulConj(off1, off1), mulConj(off2, off2)),
      plus(mulConj(on1, off1), mulConj(on2, off2)),
      plus(mulConj(off1, on1), mulConj(off2, on2)),
      plus(mulConj(on1, on1), mulConj(on2, on2))
    ];
    // bloch vector coordinates
    let [x, y, z] = [c.r+b.r, c.i- b.i, a.r-d.r];
    pts.push({x, y, z});
  }
  pts.sort((e1, e2) => e1.y - e2.y);
  for (let {x, y, z} of pts) {
    ctx.beginPath();
    let f = 10/(5-y);
    
    ctx.arc(x*30*f+75, -z*30*f+75, f, 0, 7);
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'black';
    ctx.globalAlpha = 1;
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.beginPath();
  ctx.arc(75, 75, 60, 0, 7);
  ctx.strokeStyle = 'black';
  ctx.stroke();
};

let operate = () => {
  let t = rot * Math.PI/180;
  let [c, s] = [Math.cos(t/2), Math.sin(t/2)];
  let measurementResult = undefined;
  for (let e of possibles) {
    let {OffOff, OffOn, OnOff, OnOn} = e;

    // CNOT
    [OnOff, OnOn] = [OnOn, OnOff];
    
    // Rotate around X
    [OnOff, OnOn] = [{
      r: OnOff.r*c - OnOn.r*s,
      i: OnOff.i*c - OnOn.i*s
    }, {
      r: OnOff.r*s + OnOn.r*c,
      i: OnOff.i*s + OnOn.i*c
    }];
    [OffOff, OffOn] = [{
      r: OffOff.r*c - OffOn.r*s,
      i: OffOff.i*c - OffOn.i*s
    }, {
      r: OffOff.r*s + OffOn.r*c,
      i: OffOff.i*s + OffOn.i*c
    }];
    
    // Measure with result ON and post-select
    if (measurementResult === undefined) {
      let onNess = 
          OnOn.r*OnOn.r +
          OnOn.i*OnOn.i +
          OffOn.r*OffOn.r +
          OffOn.i*OffOn.i;
      measurementResult = Math.random() < onNess;
    }
    if (measurementResult) {
      OnOff.r = 0;
      OnOff.i = 0;
      OffOff.r = 0;
      OffOff.i = 0;
    } else {
      OnOn.r = 0;
      OnOn.i = 0;
      OffOn.r = 0;
      OffOn.i = 0;
    }
    let unity = Math.sqrt(
        OnOn.r*OnOn.r +
        OnOn.i*OnOn.i +
        OffOn.r*OffOn.r +
        OffOn.i*OffOn.i +
        OnOff.r*OnOff.r +
        OnOff.i*OnOff.i +
        OffOff.r*OffOff.r +
        OffOff.i*OffOff.i);
    OnOn.r /= unity;
    OnOn.i /= unity;
    OffOn.r /= unity;
    OffOn.i /= unity;
    OnOff.r /= unity;
    OnOff.i /= unity;
    OffOff.r /= unity;
    OffOff.i /= unity;
    
    e.OffOn = OffOn;
    e.OnOff = OnOff;
    e.OffOff = OffOff;
    e.OnOn = OnOn;
  }
};

window.setInterval(() => {
  operate();
  redraw();
}, 25);
