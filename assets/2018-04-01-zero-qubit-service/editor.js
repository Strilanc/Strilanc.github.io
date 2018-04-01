var gateSet = [
    {name: "Controlled Not Gate", symbol: "CNOT"},
    {name: "Hadamard Gate", symbol: "H"},
    {name: "T Gate", symbol: "T"},
    {name: "Measurement", symbol: "M"},
];

var makeRect = function(x, y, w, h) {
    return {x:x,y:y,w:w,h:h};
};
var evaluating = false;
var evaluated = false;
var canvas = document.getElementById("drawCanvas");
var btn = document.getElementById("btnEval");
var ctx = canvas.getContext("2d");
var gateRadius = 25;

var makeRectRadius = function(x,y,r) {
    return makeRect(x-r, y-r, 2*r, 2*r);
};

var latestMouseX = 0;
var latestMouseY = 0;
var heldOperation = null;
var isTapping = false;
var wasTapping = false;

var drawRect = function(rect, fill) {
    ctx.fillStyle = fill || "white";
    ctx.strokeStyle = "black";
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
};

var drawCenteredString = function(x,y,text,fill="black") {
    ctx.fillStyle = fill;
    var s = ctx.measureText(text);
    ctx.fillText(text,x-s.width/2,y+5);
};
var rectContainsMouse = function(b) {
    var x = latestMouseX;
    var y = latestMouseY;
    return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
};
var drawFloatingGate = function(x, y, g) {
    var b = makeRectRadius(x, y, gateRadius);
    drawRect(b, "orange");
    drawCenteredString(x, y, g.symbol);
};
var drawToolboxGate = function(x, y, g) {
    var b = makeRectRadius(x, y, gateRadius);
    if (rectContainsMouse(b)) {
        if (isTapping && !wasTapping) {
            heldOperation = {
                gate: g,
                controls: [],
                wire: 0
            };
        }
        if (heldOperation === null) {
            var r = gateRadius;
            ctx.globalAlpha=0.5;
            ctx.fillStyle = "white";
            ctx.fillRect(0, y+r+15, 800, 800);
            ctx.globalAlpha=1;

            drawRect(b, "orange");

            drawRect(makeRect(50, y+r+10, 200, 30), "#EEE");
            ctx.fillStyle = "black";
            ctx.fillText(g.name, 55, y + r + 25);
        } else {
            drawRect(b);
        }
    } else {
        drawRect(b);
    }
    drawCenteredString(x, y, g.symbol);
};

var redraw = function () {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font = "12px monospace";

    var r = makeRect(0, 0, gateSet.length*75+25, 100);
    drawRect(r, "lightgray");
    drawCenteredString(r.x + r.w/2, 15, "AZQQCS Toolbox");
    for (var i = 0; i < gateSet.length; i++) {
        drawToolboxGate(i*75 + 50, 65, gateSet[i]);
    }

    ctx.font = "16px monospace";
    drawCenteredString(drawCanvas.clientWidth/2, drawCanvas.clientHeight/2, "Circuit Area");
    if (heldOperation !== null && rectContainsMouse(makeRect(0, 100, canvas.clientWidth, canvas.clientHeight-100))) {
        drawCenteredString(
            drawCanvas.clientWidth/2,
            drawCanvas.clientHeight/2 + 50,
            "Gates must be dropped on a qubit", "red");
    }
    ctx.font = "20px monospace";
    if (evaluating) {
        drawCenteredString(drawCanvas.clientWidth/2, drawCanvas.clientHeight/2 + 100, "Processing...", "red");
    }
    if (evaluated) {
        drawCenteredString(drawCanvas.clientWidth/2, drawCanvas.clientHeight/2 + 100, "Result: |⟩", "#040");
        ctx.font = "12px monospace";
        drawCenteredString(drawCanvas.clientWidth/2, drawCanvas.clientHeight/2 + 125, "(the empty ket)", "#040");
        ctx.font = "20px monospace";
        drawCenteredString(drawCanvas.clientWidth/2, drawCanvas.clientHeight/2 + 150, "Fidelity: Infinity%", "#040");
    }

    ctx.font = "12px monospace";
    if (heldOperation !== null) {
        drawFloatingGate(latestMouseX, latestMouseY, heldOperation.gate);
    }
};

var mouseUpdate = function(p, pressed) {
    latestMouseX = p.pageX - $(canvas).position().left;
    latestMouseY = p.pageY - $(canvas).position().top;
    if (isTapping != pressed) {
        wasTapping = isTapping;
        isTapping = pressed;
    }
    redraw();

    if (!isTapping) {
        heldOperation = null;
    }
    if (isTapping != wasTapping) {
        wasTapping = isTapping;
        redraw();
    }
};
$(canvas).mousedown(function(p) {
    if (p.which != 1) return;
    mouseUpdate(p, true);
});
$(document).mouseup(function(p) {
    if (p.which != 1) return;
    mouseUpdate(p, false);
});
$(document).mousemove(function(p) {
    if (isTapping) {
        mouseUpdate(p, isTapping);
    }
});
$(canvas).mousemove(function(p) {
    if (!isTapping) {
        mouseUpdate(p, isTapping);
    }
});
$(canvas).mouseleave(function(p) {
    mouseUpdate({offsetX:-100, offsetY:-100}, isTapping);
});
var evaluateCounter = 0;
$(btn).click(function() {
    evaluateCounter += 1;
    var ticket = evaluateCounter;
    evaluating = true;
    evaluated = false;
    redraw();
    btn.disabled = true;
    setTimeout(function() {
        if (ticket === evaluateCounter) {
            btn.disabled = false;
            evaluating = false;
            evaluated = true;
            redraw();
        }
    }, 2000);
});

redraw();
