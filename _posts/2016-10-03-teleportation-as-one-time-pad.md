---
layout: post
title: "The Quantum Version of the One-Time Pad is Teleportation"
date: 2016-10-03 12:10:10 pm EST
permalink: post/1624
---

For whatever reason, one of the topics I keep coming back to on this blog is "ways to think about quantum teleportation".
I've talked about how teleportation is [like storing bandwidth](/quantum/2014/05/11/Storing-Bandwidth-with-Quantum-Teleportation.html), how if it was any more efficient you could [send unbounded amounts of data without sending a single bit](/2016/05/29/ultra-dense-coding-allows-ftl.html), and how you can [split it into copy-sending and dis-entangling](/quantum/2015/12/28/Separating-Quantum-Teleportation.html).

Well, no reason to stop now!

In this post I'm going to describe Alice and Bob performing a one-time pad cipher, then I'm going to describe Alice and Bob performing a quantum teleportation.
See if you notice any similarities.

# One-Time Pad

Alice wants to send a bit $M$ to Bob.
This is a bit tricky, since Eve is listening in on the line and Alice doesn't want Eve to learn $M$.

Fortunately, Alice and Bob have a shared random bit S that Eve doesn't know.
Instead of talking directly about $M$, Alice and Bob can talk about how $M$ relates to $S$.

So Alice compares $M$ to $S$.
If they're different, she yells out "Hey Bob! $M$ is the opposite of $S$! Flip $S$ to get $M$!".
If they're the same, she instead yells out "Hey Bob! $M$ is the same as $S$! Just use $S$ as your copy of $M$!".

Bob hears Alice yelling, does or doesn't flip $S$ based on what Alice said, and now he has $M$.
With Eve none the wiser.

# Quantum Teleportation

Alice wants to send a qubit $M$ to Bob.
This is a bit tricky, since their communication channel is classical and would decohere $M$ if used.

Fortunately, Alice and Bob have a shared EPR pair $S$.
Instead of talking directly about $M$, Alice and Bob can talk about how $M$ relates to $S$.

(The EPR pair $S$ has even X-parity and even Z-parity.
If Alice and Bob were to both measure the X axis of their respective part of the pair, they'd get the same answer.
Ditto for the Z axis.)

Alice compares $M$ to $S\_A$ along the Z axis (she measures the Z-parity of $M$ vs $S\_A$).
If they're different, she yells out "Hey Bob! Along the Z axis, $M$ is the opposite of $S$! Flip $S\_B$ around the X axis to fix that!".
If they're the same, she instead yells out "Hey Bob! Along the Z axis, $M$ is the same as $S$! No need to do a flip yet!".

Alice also compares $M$ to $S$ along the X axis.
If they're different, she yells out "Hey Bob! Along the $X$ axis, $M$ is opposite to $S$! Fix $S\_B$ with a half turn around the Z axis!".
If they're the same, she instead yells out "Hey Bob! Along the $X$ axis, $M$ is the same as $S$! You're good to go!".

Bob hears Alice yelling, does or doesn't flip $S$ around the X and Z axes based on what Alice said, and now he has $M$.

# Similarities

As I'm sure you noticed from the writing getting a bit repetitive, the one-time pad scenario sounded almost identical to the quantum teleportation scenario.
The only real difference is that teleportation had to do two compare-and-flips instead of one.

I hope that makes it clear why I say quantum teleportation is basically just the quantum version of a one-time pad cipher.
(*Side note: and it's all thanks to [X-parity and Z-parity being compatible, unlike X-value and Z-value](/quantum/2016/01/19/unknown-but-equal.html).
Y-parity is also compatible with the other two, but there's no need to involve it in the protocol because the third axis' parity is implied by the other two.*)

One use for this strong analogy between quantum teleportation and one-time pads is seeing through some of the silly things people say about quantum teleportation. 
For example, sometimes people say that, at least when the quantum teleportation doesn't require Bob to flip his qubit at all, teleportation moves $M$ from Alice to Bob *instantaneously* (or even retrocausally).

Of course what they mean is that, when you focus on just the 25% of runs where no corrections were needed, Bob's analysis of his qubit will match up with the qubit Alice wanted to send.
Even if Bob does the analysis before Alice performs the parity measurements necessary to actually do the teleportation.

That might sound a bit mind-bending... but really it's just an effect of the post-selection we did by focusing on a special 25% of the runs.
The exact same thing happens with the one-time pad.
If you focus on the 50% of runs where no corrections were needed, i.e. where $S=M$, Bob's analysis of his copy of $S$ will match up with $M$ even if he does it before Alice compared $M$ to $S$.
For reasons that I hope are *incredibly obvious*.

(*Rant: This is __the__ reason I say post-selection is misleading, or even cheating.
Post-selection creates weirdness out of nothing, even in the classical world.
But it's an artefact of the analysis, not anything useful in the real world.
And it can be tricky to spot post-selection-weird hiding amongst proper quantum-weird.
Endless confusion results.*)

Another interesting, if less satisfying, example of taking a "weird" fact about teleportation and applying it to one-time pads is "moving infinite information".
Sometimes people say that, because quantum teleportation moves qubits and the state of a qubit is defined by continuous amplitudes, teleportation uses just 2 bits of communication to move a continuous infinity of detail.

The one-time pad also "moves infinite information".
But the "moved information" is in terms of (for example) Eve's beliefs about the various bits.
Alice yells out a single bit, and a continuous parameter that described Alice (Eve's inferred chance that Alice's bit is ON) suddenly applies to Bob.

... I'm not sure what to think about that particular correspondence.
It quickly leads into the territory of Bell inequalities and philosophy.

# Summary

Have a shared secret.
Compare the shared secret to a message you want to send.
Yell out the result of the comparison.
That's how both the one-time pad and quantum teleportation are done.
