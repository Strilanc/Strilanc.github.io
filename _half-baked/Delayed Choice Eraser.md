---
layout: post
title: "Erasing Entanglement with Delayed Choice"
date: 2015-08-30 11:30:00 EST
categories: quantum
comments: true
---

Recently, I've been trying to internalize what's happening during [delayed choice quantum eraser experiments](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser).
This unexpectedly led me to a better solution to the [quantum network flow puzzle](/quantum/2015/05/01/Quantum-Network-Flow-Puzzle.html) I posted months ago.

In this post: explaining and using quantum erasure.

# The Delayed Choice Eraser Experiment

The delayed choice quantum eraser experiment goes as follows:

1. Create two bell pairs, A and B.
2. Give one of the qubits in pair A to Alice, and one of the qubits in pair B to Bob.
3. Give the other qubit in each pair to Eve.
4. Alice and Bob do some bell tests on their qubits.
5. Later, Eve performs the inverse bell-pair-creation operation on her qubits and measures them.
6. Within each measurement outcome, Alice and Bob's bell tests indicate that there was entanglement between A and B.

It's very important not to confuse "each sub case acts entangled" with "Even caused Alice and Bob's qubits to become entangled", as many popular articles do.
If Eve was actually able to do that, you would have a (slightly noisy) faster-than-light-or-even-backwards-in-time communication mechanism from Eve to Alice and Bob.

Let's go over an actual circuit to perform this magic:

![](http://i.imgur.com/XOKyenD.png)

And here's the final state:

?

The important thing to notice about the final state is that each row *individually* has Alice's qubit entangled with Bob's qubit, but the type of entanglement *differs*.
There's both-qubits-agree entanglement, both-qubits-agree-but-opposite-phase entanglement, both-qubits-disagree entanglement, and both-qubits-disagree-but-opposite phase entanglement in play.
Because Alice and Bob will be seeing each type of entanglement a quarter of the time, and the different types of entanglement complement each other, they end up unable to distinguish this from not being entangled at all (so in effect they aren't).
But if Eve tells them what the measurement result was, then Alice and Bob can go back and look at their results and see that yes, in fact, Eve is telling them what type of correlations were appearing.

You can make make an unentangled state out of a superposition of entangled states. Weird!

# Erasing GHZ States

After I learned the above, I went looking for simpler or dual cases that were still interesting.
Could I make entangled states out of a superposition of unentangled states, so Eve's results allowed Alice and Bob to see normality?
Could I do something with 3 qubits instead of 4?

I found an interesting thing to do with 3 qubits.

A bell pair is two qubits in the state $\frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$.

A GHZ state is three qubits in the state $\frac{1}{\sqrt{2}} \ket{000} + \frac{1}{\sqrt{2}} \ket{111}$.

By many measure sof entanglement, bell pairs are "more entangled" than GHZ states.
Basically, the extra qubit is a bit of a third wheel.
If you try to ignore it, then it basically amounts to a measurement of the other two and you'll get no interesting effects.
So techniques for getting rid of that third wheel are useful, sometimes.

Previously, I thought the only way to get rid of the third wheel was to controlled-not it against one of the other qubits.
This has the downside of requiring two of the three qubits to be in the same place at the same time.

But it turns out you can also uantum-eraser the third qubit.
Hit it with a Hadamard gate, measure it, then phase-flip one of the other qubits if the measurement came out ON.
Now we don't need two qubits in the same place at the same time, we only need to move the measurement result around instead of the original qubit, and that's much easier because classical networks are easier than quantum networks.

Why does this work?

Well, start with the original solution of controlled-not-ing away.
After the controlled-not, we can do whatever we want to the now-uninvolved-and-useless qubit.
So let's hit it with a Hadamard then measure it, because I said so.
Now move the Hadamard over the controlled-not.
Moving an H over an X toggles it into a Z.
A Z gate only does things when its input is ON, so it is interchangeable with its controls, so swap it.
Controls commute with measurements, so move the controlled-Z after the measurement.
That's it!

# Improving the Old Puzzle

In the original puzzle post, my solution created extra entangled copies of qubits due to superdense-encoding them into other qubits.
This effectively created a GHZ state, so I had to forward the original qubits to meet their partner and be cleaned up by intermediate nodes.
Quantum erasure allows those forwarding links to be downgraded to classical links:

![Data Flow Diagram](/assets/2015-08-30-Erasing-Entanglement-with-Delayed-Choice/NetworkPuzzleSolution.png)

# Summary

The "weirdness" of the delayed choice quantum eraser experiment comes from the ability to create an unentangled state out of a superposition of entangled states.

You can use erasure in other situations, by turning a controlled-not into a Hadamard-then-measure-then-conditionally-phase-toggle.
