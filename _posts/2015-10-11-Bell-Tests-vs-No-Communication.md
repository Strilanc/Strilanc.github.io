---
layout: post
title: "YOU versus Bell Tests and the No Commmunication Theorem"
date: 2015-10-11 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

<style scoped>
    table {
        margin: 0 auto;
        border-spacing: 0;
    }

    table, td, tr {
        padding: 0;
    }

    textarea {
        width: 370px;
        resize: vertical;
        overflow-x: auto;
        white-space: pre;
    }

    .codeBlock {
        background-color:#EEE;
        padding: 4px;
    }

    .hued {
        filter: hue-rotate(90deg);
        -webkit-filter: hue-rotate(90deg);
    }

    .resultTable {
        background-color: #EEE;
        padding: 3px 3px 0 3px;
        margin-top: 10px;
        border-spacing: 3px;
    }
</style>

In this post: I try to explain Bell Inequalities and the No-Communication Theorem, while you try to write short javascript strategies that violate them.

# An Apparent Paradox

Quantum mechanics is frustratingly hard to explain.
There are a lot of reasons for that.
One of the main reasons, and the one we'll be touching on throughout this post, is QM's complicated relationship with locality.
In particular, it seems to both *require and prohibit* faster-than-light transfer of information.

To make things worse, the requirements and prohibitions on quantum FTL signalling are *proven mathematical facts* known as [Bell's Theorem](https://en.wikipedia.org/wiki/Bell's_theorem) and the [No-Communication Theorem](https://en.wikipedia.org/wiki/No-communication_theorem) respectively.
They derive from the postulates we use to define quantum mechanics as a mathematical model.
If we found experiments that contradicted either theorem, they would still be correct.
Instead, our belief that reality is quantum mechanical would fall (or at least need some adjusting).

We have a paradox here, but it is a paradox in the well-founded-but-seemingly-absurd sense instead of in the leads-to-a-contradiction sense.
The need for FTL signalling and the ban on FTL signalling apply to subtly different cases.

# Signalling Required: Bell Tests and the CHSH Game

In the 1960s, [John Bell](https://en.wikipedia.org/wiki/John_Stewart_Bell) discovered that there are coordination games where quantum entanglement is a useful resource.
Games where you can *win more* by taking advantage of reality being quantum mechanical.
Classical players, without FTL signalling, simply can't win as much as quantum players at these games.

The smallest coordination game where quantum entanglement is useful is known as the ["CHSH" game](https://en.wikipedia.org/wiki/CHSH_inequality).
In this game, the goal is for two isolated players (Alice and Bob) to make moves that satisfy $(m\_a \text{ xor } m\_b) = (r\_a \text{ and } r\_b)$.
The $r\_a$ and $r\_b$ values are the outcomes of coin flips by referees.
$r\_a$ is only told to Alice, while $r\_b$ is only told to Bob.
The $m\_a$ and $m\_b$ values are Alice and Bob's respective moves.
In other words, Alice and Bob want to *make the same move unless the referees both flip heads*.
This is difficult because each player sees only one of the coin flips.

It is claimed that **no classical strategy can expect to win the CHSH game more than 75% of the time** (or less than 25% of the time), but **quantum strategies can win up to 85.3% of the time** (more specifically, $\cos^2 \frac{\pi}{8} = \frac{1 + \sqrt{2}}{2\sqrt{2}} \approx 85.35534...\%$ of the time).

(Another game where quantum entanglement is useful is the [Mermin-peres magic square game](https://users.wpi.edu/~paravind/Publications/MSQUARE5.pdf).
It's the simplest game where the quantum strategy is better and *always* wins.)

Checking that no deterministic strategy beats 75% is easy.
There's only four deterministic strategies each player can follow: "always false", "always true", "match referee", and "contradict referee".
That gives sixteen possible strategy combinations for two players; few enough that you can just check each one.
(They all win either 25% or 75% of the time.)

But what about probabilistic classical strategies?
Maybe something interesting happens if each player randomly switches between the deterministic strategies, possibly based on the referee's coin flip?
And what about that analogy people always give for entanglement, where you put the result of a coin flip into two boxes and opening one box instantly tells you what's in the other box?
Maybe the pervasiveness of that analogy means that shared random bits are useful here?

# Write Your Own Classical CHSH Strategy

Instead of trying to convince you with words that probabilistic classical strategies (including ones with pre-shared random bits) can't beat 75%, let's try something different.

Below this paragraph, there is an interactive widget with two text areas.
The text areas accept arbitrary javascript code, and the entered code is used in simulations of the CHSH game to determine the players' strategies.
All you have to do is assign true or false to the `move` variable.
You can base the value you assign on the `refChoice` variable (i.e. the referee's coin flip), on values in the `sharedBits` array (i.e. the pre-shared coin flips), or on whatever else you want (I dunno, the time?).

The goal is to win statistically-signicantly more than 75% of the time.
Your results are summarized in the table at the bottom of the widget, and will update automatically as you edit the code.
Go ahead, give it a try:

<!--
    Sandbox escape mechanisms that shouldn't work:
    - Code injection via mismatched braces. (JSON.stringify -> eval)
    - Assigning values to a global and reading them out on the other side. (Seperate web workers)
    - Re-assigning Math.random or other functions used by the surrounding glue code. (Their values are stashed into locals)

    Things that might work:
    - WebSockets
    - Cracking Math.random's seed
    - Browser-level exploits (Chrome does seem to crash if a bunch of web workers start...)
-->

<div style="width: 850px;">
    <table align="center" style="background-color: #EEE; padding: 2px;">
        <tr><td align="left">var sharedBits = [Math.random() &lt; 0.5, Math.random() &lt; 0.5, …]</td></tr>
    </table>

    <img src="/assets/{{ loc }}/bell_test_widget_split.png" style="margin: 0 auto; padding: 0; display: block;"/>

    <div class="codeBlock" style="margin-left: 4px; float:left;">
        <div>var refChoice = Math.random() &lt; 0.5;<br/>var move; //ALICE's move</div>
        <textarea id="srcTextArea1_a" rows="4"></textarea>
    </div>
    <div class="codeBlock" style="margin-right: 4px; float:right;">
        <div style="text-align: left;">var refChoice = Math.random() &lt; 0.5;<br/>var move; //BOB's move</div>
        <textarea id="srcTextArea2_a" rows="4"></textarea>
    </div>

    <table><tr style="vertical-align: top;">
        <td><img src="/assets/{{ loc }}/bell_test_widget_side_join.png"/></td>
        <td>
            <div style="text-align: center; max-width: 450px;">
                <label id="errorLabel_a" style="font: 16pt bold Helvetica; color: red">
                    ERROR: javascript disabled
                </label>
            </div>
            <table id="resultsTable_a" class="resultTable">
                <tr>
                    <td align="right">Estimated Win Rate:</td>
                    <td align="left"><label id="rateLabel_a" style="font-weight: bold;"></label></td>
                </tr>
                <tr>
                    <td align="right">Violated Bell Inequality:</td>
                    <td align="left"><label id="judgementLabel_a" style="font-weight: bold;"></label></td>
                </tr>
                <tr>
                    <td align="right">Measured Wins:</td>
                    <td align="left"><label id="countLabel_a"></label></td>
                </tr>
                <tr>
                    <td align="right">Outcome Breakdown:</td>
                    <td align="left"><canvas id="drawCanvas_a" width="281px" height="281px"></canvas></td>
                </tr>
            </table>
        </td>
        <td><img src="/assets/{{ loc }}/bell_test_widget_side_join.png" style="transform:scaleX(-1);"/></td>
    </tr></table>
</div>

So... assuming you actually tried, how did you do?
Did you beat 75%?

(Did you consider cheating? Maybe you can [win by escaping the sandbox](https://alexnisnevich.github.io/untrusted/).)

The basic intuition I get, from playing with the widget, is that each quadrant gets 25% of the "result fluid" filling up the individual case boxes.
When you try to shift fluid within a quadrant, you always end up causing an equivalent shift in an adjacent quadrant.
This is fine in the top-left, because score-increasing shifts there correspond to score-increasing shifts in the adjacent quadrants.
But in the bottom-right, score-increasing shifts correspond to score-*decreasing* shifts in the adjacant quadrants.
There's a wall at 75% because at that point every improvement in the bottom-right is countered by a loss in the top-right or bottom-left (or vice-versa).

An actual proof that 75% is classically optimal is left as an exercise for the reader.

# Quantum CHSH Strategies

The best quantum strategies for the CHSH game are actually quite simple, operationally speaking.
It's understanding the underlying model that's a bit complicated.

When given a qubit, you can do two things: turn it, and measure it.
When two qubits are entangled, their measurements will be correlated.
The amount of correlation depends on the relative angle between the measurements that were performed on each qubit.

Quantum mechanics says, and experiments confirm, that if one of the entangled qubits is measured along an axis $v$, the other is measured along an axis $w$, and the angle between $v$ and $w$ is $\theta$, then the proportion of agreeing outcomes is $\cos^2 \frac{\theta}{2}$.
(This only applies to the first measurement on each. After that they're not entangled.)

- Measurements along axes that differ by 0°, i.e. along the same axis, agree 100% of the time.
- Parallel-but-opposite-in-direction axes, i.e. ones that differ by 180°, agree 0% of the time.
- Perpencidular axes, which differ by 90°, agree 50% of the time and disagree 50% of the time (i.e. are uncorrelated).
- Axes that differ by -45° or +45° will agree ~85.3% of the time while axes that differ by 135° will *disagree* ~85.3% of the time.

(Actually, I'm simplifying a bit.
The correlations depend on which entangled state you start with.
Physicists' favorite entangled state is the "[singlet state](https://en.wikipedia.org/wiki/Singlet_state)" $\frac{1}{\sqrt{2}} \ket{01} - \frac{1}{\sqrt{2}} \ket{10}$ where the qubits have opposite phase and value, but we'll be using the state $\frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$ where the qubits simply agree.
The difference does matter, but you don't have to care about it here.)

The trick quantum strategies can use is that, if you start with the measurement axes separated -45°, rotating by 90° *once* gets you to +45° but rotating by 90° *twice* gets you to 135°.
This is useful in the CHSH game, because both the game and this 45-to-45-to-135 trick correspond to approximating an AND gate while using only local operations.
One player choosing to rotate their qubit has no effect on the rate of agreement (both 45° and -45° agree 85.3% of the time), but *both* players choosing to rotate swaps us into the disagreeing-85.3%-of-the-time case.

# Write Your Own Quantum CHSH Strategy

You can try out quantum strategies for the CHSH game using the widget in this section.
You enter javascript into each of the text areas, and it will be used into simulations of the CHSH game.
The difference compared to the last widget is that, here, you have access to two new functions: `turn` and `measure`.

The `measure` function measures the player's qubit's value in the computational basis (along the Z axis).
If you just use `move = measure()` for both strategies, the qubits act like a classical pre-shared random bit; to get other correlations, you need to `turn` them first.
The `turn` function takes an axis (`X`, `Y`, or `Z`), as well as an angle in degrees, and applies a rotation operation to the qubit.
For example, if you wanted to measure along the Y axis instead of the Z axis then you would `turn(X, 90)` before measuring.

(Unfortunately, explaining exactly what each rotation operation does to the state is outside of the scope of this post.
See [Converting Rotations into "Nice" Qubit Operations](/quantum/2014/11/24/Converting-Rotations-into-Nice-Qubit-Operations.html) and [Entangled States are Like Unitary Matrices](/quantum/2015/04/25/Entangled-States-are-like-Unitary-Matrices.html) if you're interested in that.)

I pre-populated an optimal strategy into the widget, but feel free to erase it without looking and try to find one yourself.
Or maybe see if you can find strategies that do *better* than 85.3%?

<!--
    It's a lot easier to escape the sandbox here because both snippets are run in the same web worker.
-->

<div style="width: 850px;">
    <table align="center" style="background-color: #EEE; padding: 2px;">
        <tr><td align="left">sharedQubits = √½·|00〉+ √½·|11〉</td></tr>
    </table>

    <img src="/assets/{{ loc }}/bell_test_widget_split.png" class="hued" style="margin: 0 auto; padding: 0; display: block;"/>

    <div class="codeBlock" style="margin-left: 4px; float:left;">
        <div>var refChoice = Math.random() &lt; 0.5;<br/>var move; //ALICE's move</div>
        <textarea id="srcTextArea1_b" rows="4"></textarea>
    </div>
    <div class="codeBlock" style="margin-right: 4px; float:right;">
        <div style="text-align: left;">var refChoice = Math.random() &lt; 0.5;<br/>var move; //BOB's move</div>
        <textarea id="srcTextArea2_b" rows="4"></textarea>
    </div>

    <table><tr style="vertical-align: top;">
        <td><img src="/assets/{{ loc }}/bell_test_widget_side_join.png" class="hued"/></td>
        <td>
            <div style="text-align: center; max-width: 450px;">
                <label id="errorLabel_b" style="font: 16pt bold Helvetica; color: red">
                    ERROR: javascript disabled
                </label>
            </div>
            <table id="resultsTable_b" class="resultTable">
                <tr>
                    <td align="right">Estimated Win Rate:</td>
                    <td align="left"><label id="rateLabel_b" style="font-weight: bold;"></label></td>
                </tr>
                <tr>
                    <td align="right">Violated Bell Inequality:</td>
                    <td align="left"><label id="judgementLabel_b" style="font-weight: bold;"></label></td>
                </tr>
                <tr>
                    <td align="right">Measured Wins:</td>
                    <td align="left"><label id="countLabel_b"></label></td>
                </tr>
                <tr>
                    <td align="right">Outcome Breakdown:</td>
                    <td align="left"><canvas id="drawCanvas_b" width="281px" height="281px"></canvas></td>
                </tr>
            </table>
        </td>
        <td><img src="/assets/{{ loc }}/bell_test_widget_side_join.png" class="hued" style="transform:scaleX(-1);"/></td>
    </tr></table>
</div>

So quantum strategies can demonstrably outperform local classical strategies at the CHSH game.
But before we move on to interpreting what this means, and jumping to conclusions about secret FTL signals, let's cover the No-Communication Theorem.

# Signalling Prohibited: No Communication Allowed

What does it mean for Alice to communicate information to Bob?
As with the Bell inequalities, we can think of this in terms of *winning a game*.

The game is much simpler this time: there's only one referee, and only one of the players makes a move.
The goal is to satisfy $m\_b = r\_a$.
Once again, $r\_a$ is the outcome of a coin flip performed by a referee and known to Alice.
Also, $m\_b$ is the yes-or-no move performed by Bob.
You win when the moves correlate with the flips.

The No-Communication Theorem states that Alice and Bob can't expect to win this game more than 50% of the time, even if they have access to pre-shared entangled qubits.

Oh hey, another bound on the rate a game can be won that should apply to any strategy.
That means it's time to-

# Write Your Own Quantum Communication Strategy

The third (and final) interactive widget is found below.
It works exactly like the quantum widget for the CHSH game explained earlier.
Only the game has changed.
Both players can still `turn` and `measure`, but this time only Alice cares about `refChoice` and only Bob needs to assign a value to `move`.
The goal is for Bob's move to correspond to the referee choice that was given to Alice.

People in the comment sections of pop science articles about entanglement are always suggesting strategies for this game.
Maybe whether or not Alice measured the system can be detected by Bob, so entropy can squeak through by having Alice only measure when `refChoice` is true?
Or maybe, since the axis that Alice measures will affect the states that the system can instaneously collapse into from across the universe, measuring along a different axis can be detected by Bob?

Can *you* come up with a way to win more than 50% of the time?

<!--
    How to win by cheating:
    Alice: "Date.xxx = refChoice"
    Bob: "move = Date.xxx"

    Preventing this kind of cheating is difficult because, well, you're running this on a classical computer (also, javascript doesn't support blocking).
    I could have split the strategies into two web workers and used async message passing, but that introduces dealing-with-async into the user code, and
      I wanted it to be as simple as possible (and async/await isn't well supported yet).
-->

<div style="width: 850px;">
    <table align="center" style="background-color: #EEE; padding: 2px;">
        <tr><td align="left">sharedQubits = √½·|00〉+ √½·|11〉</td></tr>
    </table>

    <img src="/assets/{{ loc }}/bell_test_widget_split.png" class="hued" style="margin: 0 auto; padding: 0; display: block;"/>

    <div class="codeBlock" style="margin-left: 4px; float:left; font-size: 11pt;">
        <div>var refChoice=Math.random()&lt;0.5 //ALICE's value to send</div>
        <textarea id="srcTextArea1_c" rows="4"></textarea>
    </div>
    <div class="codeBlock" style="margin-right: 4px; float:right;">
        <div style="text-align: left;">var move; //BOB's received value</div>
        <textarea id="srcTextArea2_c" rows="4"></textarea>
    </div>

    <table><tr style="vertical-align: top;">
        <td><img src="/assets/{{ loc }}/bell_test_widget_side_join.png" class="hued" style="margin: 0 auto; padding: 0; display: block;"/></td>
        <td>
            <div style="text-align: center; max-width: 450px;">
                <label id="errorLabel_c" style="font: 16pt bold Helvetica; color: red">
                    ERROR: javascript disabled
                </label>
            </div>
            <table id="resultsTable_c" class="resultTable" style="width: 450px;">
                <tr>
                    <td align="right">Estimated Hit Rate:</td>
                    <td align="left"><label id="rateLabel_c" style="font-weight: bold;"></label></td>
                </tr>
                <tr>
                    <td align="right">Communicating:</td>
                    <td align="left"><label id="judgementLabel_c" style="font-weight: bold;"></label></td>
                </tr>
                <tr>
                    <td align="right" style="width: 200px;">Measured Hits:</td>
                    <td align="left"><label id="countLabel_c"></label></td>
                </tr>
                <tr>
                    <td align="right">Outcome Breakdown:</td>
                    <td align="left"><canvas id="drawCanvas_c" width="171px" height="171px"></canvas></td>
                </tr>
            </table>
        </td>
        <td><img src="/assets/{{ loc }}/bell_test_widget_side_join.png" class="hued" style="transform:scaleX(-1);margin: 0 auto; padding: 0; display: block;"/></td>
    </tr></table>
</div>

Don't try *too* long.

My intuition for why this can't be done rests on the fact that quantum operations *commute when applied to separate qubits*.
If "Alice does X then Bob does Y" causes result Z, then result Z must also occur for "Bob does Y then Alice does X".
I'm not going to prove this, even though it's not hard, because it would require explaining in detail how quantum operations are represented mathematically and how to expand single-qubit operations into whole-system-operations.
Suffice it to say that $(A \otimes I) \cdot (I \otimes B) = (I \otimes B) \cdot (A \otimes I)$, or that [Alice's operations accumulate as left-products while Bob's accumulate as right-products](/quantum/2015/04/25/Entangled-States-are-like-Unitary-Matrices.html).

Because remote quantum operations commute, any strategy for sending quantum information instantaneously *could also send that information into the past*.
If Alice could send information to Bob by twiddly-fwaddling her qubit before he blorgamorped his qubit, the math would also allow for Bob to receive the message while Alice *waited as long as she wanted to before doing the twiddly-fwaddling*.
This is especially bad because it's not solved by giving the universe a preferred rest frame (i.e. we're not [bootstrapping the FTL signalling into time travel by using special relativity](https://en.wikibooks.org/wiki/Special_Relativity/Faster_than_light_signals,_causality_and_Special_Relativity); the time travel comes directly from the quantum mechanism we assumed).

You might not have a distaste for time paradoxes being allowed but I find it to be a compelling reductio, so I'll bluntly leave my explanation for no-communication at that.
If you want more not-in-depth discussion of the No-Communication Theorem, you can read [this](http://physics.stackexchange.com/questions/109861/why-cant-i-use-bells-theorem-for-faster-than-light-communication) or [this](http://lesswrong.com/lw/q2/spooky_action_at_a_distance_the_nocommunication/) or [this](https://www.physicsforums.com/threads/no-communication-theorem-question.317397/) or [this](http://forums.xkcd.com/viewtopic.php?f=18&t=15911&start=0&st=0&sk=t&sd=a).

(In the specific case of Bell tests, the reason the non-local correlations can't be bootstrapped into communication is that *you need to compare results*.
You can encode information into whether the CHSH game was won or lost, but the other party can't tell if they won or lost until you get back together and compare notes.
Comparing notes requires getting those notes to the same place and the same time, and doing that is bounded by the speed of light.)

# Intepretation

Alright, enough explanation and info-dumping.
Let's address the paradox.
We have two results:

1) Bell tests show that a classical system would need FTL communication to simulate a quantum system. There are useful non-local correlations.

2) FTL communication is impossible in quantum mechanics.

How can these *possibly* both be true at the same time?
I mean, they're not exact logical negations... but it still seems *kind of weird*.
Why doesn't beating Bell tests prove that we can communicate?

The answer is very simple, if unsatisfying: *reality ain't classical*.
If reality was classical, *if* it matched our preconceptions, Bell tests would in fact prove that reality needs FTL communication to do what it does.
But it's not, so it doesn't.

Different interpretations of quantum mechanics concretely resolve this issue in different ways.
Some interpretations have a notion of locality and use a different effect to explain the correlations (e.g. [Many-Worlds](https://en.wikipedia.org/wiki/Many-worlds_interpretation), [Retrocausal](https://en.wikipedia.org/wiki/Two-state_vector_formalism)).
Other interpretations just use blatantly non-local effects (e.g. [Collapse](https://en.wikipedia.org/wiki/Copenhagen_interpretation), [Pilot-Wave](https://en.wikipedia.org/wiki/Pilot_wave)).
Still other interpretations just don't give a damn (i.e. [SUAC](http://www.mtnmath.com/faq/meas-qm-6.html)).
But, ultimately, QM's postulates and the theorems we've discussed force every interpretation to have *some* amount of weird.
At best, you get to pick which brand of weird you find the least offensive.

Physicists are telling the truth when they say quantum mechanics is counter-intuitive.
Quantum mechanical systems have non-local correlations, but you can't use those correlations for communication.
You can prove both of those statements, for yourself, from QM's postulates.
You'll still be left with the blunt fact that that's *pretty weird*.
You can learn the math, and how it applies to reality, but you're never going to find out that the math secretly predicts what evolution operating in the many-many-particles regime has shaped us to expect a-priori about locality.
Those a-priori expectations are simply mistaken.
How unfortunate.

(Of course, calling reality weird is a bit funny.
If anything, reality should set the standard for normal.
We're the weird ones with our weird expectations, left pondering and bemused by reality's taste in regularity.)

# Summary

Quantum strategies using entanglement can win some coordination games more often than would be possible classically.
If the universe were classical, this would imply the players were secretly communicating.
But communication is not one of the coordination games quantum strategies are better at.
This is counter-intuitive.

<script src="/assets/{{ loc }}/bell_test_widget.js"></script>
