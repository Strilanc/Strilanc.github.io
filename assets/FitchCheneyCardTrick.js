// Fair warning: the following code is hacky.
// It has not been cleaned up, and there are blatant violations of DRY.

var txtDealtCards = $("#txtDealtCards");
var lblRevealedCards = $("#lblRevealedCards");
var txtRevealedCards = $("#txtRevealedCards");
var lblHiddenCard = $("#lblHiddenCard");

var parseCard = function(cardText) {
    cardText = cardText.trim();
    var facePatterns = ["[aA1]","2","3","4","5","6","7","8","9","(10|T|t)","[Jj]","[Qq]","[Kk]"];
    var val = null;
    for (var i = 0; i < facePatterns.length; i++) {
        if (cardText.match("^" + facePatterns[i]) !== null) {
            val = i;
        }
    }
    if (val === null) return "?value?";
    
    var suit = null;
    var suitPatterns = ["[♠♤Ss]", "[♥♡Hh]", "[♦♢Dd]", "[♣♧Cc]"];
    for (var i2 = 0; i2 < suitPatterns.length; i2++) {
        if (cardText.match(suitPatterns[i2] + "$") !== null) {
            suit = i2;
        }
    }
    if (suit === null) return "?suit?";
    
    if (cardText.match("^" + facePatterns[val] + suitPatterns[suit] + "$") === null) {
        return "??";
    }
    return suit*13 + val;
};
var parseHand = function(handText) {
    var cardTexts = handText.trim().split(",");
    var result = [];
    for (var i = 0; i < cardTexts.length; i++) {
        var card = parseCard(cardTexts[i]);
        if (card === null) return "?";
        result.push(card);
    }
    return result;
};
var parseCard124 = function(cardText) {
    var card = parseInt(cardText.trim(), 10);
    if (card === null) return "?";
    if (card !== card) return "?";
    if (card.toString() !== cardText.trim()) return "?";
    if (card < 1 || card >= numCards) return "?";
    return card-1;
};
var parseHand124 = function(handText) {
    var cardTexts = handText.trim().split(",");
    var result = [];
    for (var i = 0; i < cardTexts.length; i++) {
        result.push(parseCard124(cardTexts[i]));
    }
    return result;
};

var cardIndexToString = function(cardIndex) {
    if (typeof cardIndex !== "number") return cardIndex;
    var faces = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    var suits = ["♠", "♥", "♦", "♣"];
    return faces[cardIndex % 13] + suits[Math.floor(cardIndex / 13)];
};
var valueToPermutation = function(arr, v) {
    arr = arr.slice();
    var result = [];
    while (arr.length > 0) {
        var i = v % arr.length;
        v = Math.floor(v / arr.length);
        result.push(arr[i]);
        arr.splice(i, 1);
    }
    if (v !== 0) return null;
    return result;
};
var permutationToValue = function(arr) {
    // just brute force it instead of inverting the logic...
    var arr2 = arr.slice(0);
    arr2.sort(function(a,b) { return a-b; });
    for (var i = 0; ; i++) {
        var n = valueToPermutation(arr2, i);
        if (n === null) return null;
        if (n.toString() === arr.toString()) {
            return i;
        }
    }
};
var cycleDelta = function(start, end, n) {
    var d = end - start;
    d %= n;
    if (d*2 < n) d += n;
    if (d*2 >= n) d -= n;
    return d;
};

var handTextToRevealedText = function(handText) {
    var hand = parseHand(handText);
    var usedCards = {};
 
    for (var i0 = 0; i0 < hand.length; i0++) {
        if (typeof hand[i0] !== "number") {
            return "Bad parse: " + $.map(hand, cardIndexToString).toString();
        }
        if (usedCards[hand[i0]]) {
            return "Bad parse: Repeated card: " + cardIndexToString(hand[i0]);
        }
        usedCards[hand[i0]] = true;
    }
    if (hand.length !== 5) {
        return "Bad parse: Not five cards.";
    }
    hand.sort(function(a,b) { return a-b; });
 
    var cardsBySuit = [[],[],[],[]];
    var winningSuit = null;
    for (var i = 0; i < hand.length; i++) {
        var s = Math.floor(hand[i] / 13);
        var suit = cardsBySuit[s];
        suit.push(hand[i]);
        if (suit.length > 1) winningSuit = s;
    }
    
    var c1 = cardsBySuit[winningSuit][0];
    var c2 = cardsBySuit[winningSuit][1];
    var d = cycleDelta(c1, c2, 13);
    hand.splice(hand.indexOf(c1), 1);
    hand.splice(hand.indexOf(c2), 1);
    
    var shown = valueToPermutation(hand, Math.abs(d) - 1);
    shown.splice(0, 0, d > 0 ? c1 : c2);
    return $.map(shown, cardIndexToString).toString();
};
var revealedTextToHiddenText = function(handText) {
    var hand = parseHand(handText);
    var usedCards = {};
 
    for (var i0 = 0; i0 < hand.length; i0++) {
        if (typeof hand[i0] !== "number") {
            return "Bad parse: " + $.map(hand, cardIndexToString).toString();
        }
        if (usedCards[hand[i0]]) {
            return "Bad parse: Repeated card: " + cardIndexToString(hand[i0]);
        }
        usedCards[hand[i0]] = true;
    }
    if (hand.length !== 4) {
        return "Bad parse: Not four cards.";
    }
    
    var start = hand[0];
    hand = hand.slice(0);
    hand.splice(0, 1);
    var d = permutationToValue(hand);
    var startSuit = Math.floor(start / 13);
    var startFace = start % 13;
    
    return cardIndexToString(startSuit*13 + (startFace+d+1)%13);
};

var onDealtCardsChanged = function() {
    lblRevealedCards.text(handTextToRevealedText(txtDealtCards.val()));
};
txtDealtCards.val("A♠,2♦,3♥,4♣,J♠");
txtDealtCards.bind("change paste keyup", onDealtCardsChanged);
onDealtCardsChanged();

var onRevealedCardsChanged = function() {
    lblHiddenCard.text(revealedTextToHiddenText(txtRevealedCards.val()));
};
txtRevealedCards.val(lblRevealedCards.text());
txtRevealedCards.bind("change paste keyup", onRevealedCardsChanged);
onRevealedCardsChanged();

var txtDealtCards124 = $("#txtDealtCards124");
var lblRevealedCards124 = $("#lblRevealedCards124");
var txtRevealedCards124 = $("#txtRevealedCards124");
var lblHiddenCard124 = $("#lblHiddenCard124");
var canvas = document.getElementById("drawCanvas124");

var numCards = 124;
var cards = [0,1,2,3,4];
var tau = 3.14159*2;
var s = 200;
var ctx = canvas.getContext("2d");
ctx.font = "8px Arial";
var x = canvas.width/2;
var y = canvas.height/2;
var p = 5;

var drawCircle = function(ih) {
    ctx.fillStyle = "black";
    var da = tau/numCards;
    ctx.translate(x,y);
    for (var i = 0; i < numCards; i++) {
        var w = ctx.measureText(i).width;
        if (cards.indexOf(i) != -1) {
            ctx.beginPath();
            ctx.strokeStyle = "black";
            ctx.fillStyle = cards.indexOf(i) === ih ? "white" : "blue";
            ctx.rect(s-p-w-p, -4, w+2*p, 10);
            ctx.stroke();
            ctx.fill();
        }
        ctx.fillStyle = "black";
        ctx.fillText((i+1), s - w - p, 4);
        ctx.rotate(da);
    }
    ctx.translate(-x,-y);
};
var drawTrace = function(i) {
    ctx.save();
    var fuel = 0;
    var fuels = {};
    for (var n = 0; n < numCards || fuel > 0; n++) {
        var c = (i+n) % numCards;
        if (n % numCards !== 0 && cards.indexOf(c) !== -1) {
            fuel += 25;
        }
        fuels[c] = Math.max(fuel, fuels[c] || fuel);
        if (fuel > 0) fuel -= 1;
    }
    ctx.fillStyle = fuels[i] === 0 ? "blue" : "red";
    
    ctx.translate(x,y);
    var da = tau/numCards;
    for (n = 0; n < numCards; n++) {
        if (fuels[n] > 0) {
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.rect(s-fuels[n]-12-2*p, -5, fuels[n], 10);
            ctx.fill();
            ctx.globalAlpha = 1;
            fuel -= 1;
        }
        ctx.rotate(da);
    }
    ctx.restore();
};
var t = 0;
var redraw = function () {
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    var i = t % cards.length;
    drawCircle(i);
    drawTrace(cards[i]);
};

window.setInterval(function() {
    t += 1;
    redraw();
}, 3000);
redraw();

var handTextToRevealedText124 = function(handText) {
    var hand = parseHand124(handText);
    var usedCards = {};
 
    for (var i0 = 0; i0 < hand.length; i0++) {
        if (typeof hand[i0] !== "number") {
            return "Bad parse: " + hand.toString();
        }
        if (usedCards[hand[i0]]) {
            return "Bad parse: Repeated card: " + hand[i0];
        }
        usedCards[hand[i0]] = true;
    }
    if (hand.length !== 5) {
        return "Bad parse: Not five cards.";
    }
    hand.sort(function(a,b) { return a - b; });
    cards = hand.slice(0);
    
    var winner = 0;
    var eliminated = {};
    for (; winner < hand.length; winner++) {
        eliminated = {};
        for (var i = 1; i < hand.length; i++) {
            var pos = hand[(winner + i) % hand.length];
            for (var n = 25; n > 0;) {
                if (eliminated[pos]) {
                } else {
                    eliminated[pos] = true;
                    n -= 1;
                }
                pos += 1;
                if (pos >= numCards) pos -= numCards;
            }
        }
        if (eliminated[hand[winner]]) continue;
        break;
    }
    
    var w = hand[winner];
    hand.splice(winner, 1);
    var c = 0;
    for (var i2 = 0; i2 < numCards && i2 != w; i2++) {
        if (eliminated[i2]) {
        } else {
            c += 1;
        }
    }
    
    var shown = valueToPermutation(hand, c);
    return $.map(shown, function(x) { return x + 1; }).toString();
};
var revealedTextToHiddenText124 = function(handText) {
    var hand = parseHand124(handText);
    var usedCards = {};
 
    for (var i0 = 0; i0 < hand.length; i0++) {
        if (typeof hand[i0] !== "number") {
            return "Bad parse: " + $.map(hand, cardIndexToString).toString();
        }
        if (usedCards[hand[i0]]) {
            return "Bad parse: Repeated card: " + cardIndexToString(hand[i0]);
        }
        usedCards[hand[i0]] = true;
    }
    if (hand.length !== 4) {
        return "Bad parse: Not four cards.";
    }
    
    var eliminated = {};
    for (var i = 0; i < hand.length; i++) {
        var pos = hand[i];
        for (var n = 25; n > 0;) {
            if (eliminated[pos]) {
            } else {
                eliminated[pos] = true;
                n -= 1;
            }
            pos += 1;
            if (pos >= numCards) pos -= numCards;
        }
    }

    var d = permutationToValue(hand);
    var c = 0;
    for (; c < numCards; c++) {
        if (eliminated[c]) {
        } else {
            if (d === 0) break;
            d -= 1;
        }
    }
    
    return (c + 1).toString();
};

var onDealtCardsChanged124 = function() {
    lblRevealedCards124.text(handTextToRevealedText124(txtDealtCards124.val()));
    redraw();
};
txtDealtCards124.val("1,3,9,27,81");
txtDealtCards124.bind("change paste keyup", onDealtCardsChanged124);
onDealtCardsChanged124();

var onRevealedCardsChanged124 = function() {
    lblHiddenCard124.text(revealedTextToHiddenText124(txtRevealedCards124.val()));
};
txtRevealedCards124.val(lblRevealedCards124.text());
txtRevealedCards124.bind("change paste keyup", onRevealedCardsChanged124);
onRevealedCardsChanged124();

