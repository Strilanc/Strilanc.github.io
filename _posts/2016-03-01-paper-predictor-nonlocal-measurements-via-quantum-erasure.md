---
layout: post
title: "Paper Predictor: 'Non-local measurements via quantum erasure'"
date: 2016-02-29 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

(*In "paper predictor" posts, I treat a paper's abstract as a problem statement.
"We discovered a way to X" becomes "Figure out how to do X".
The goal is to solve the problem before reading the body of the paper; to predict the paper's solution from the abstract.*)

Two weeks ago, the paper "Nonlocal Measurements via Quantum Erasure" by Aharon Brodutch and Eliahu Cohen [was published in Physical Review Letters](http://journals.aps.org/prl/abstract/10.1103/PhysRevLett.116.070404).
A [pre-print is available on arXiv](http://arxiv.org/abs/1409.1575).

The paper is about measuring non-local observables:

> Nonlocal observables play an important role in quantum theory [...].
> [...]
> We present a scheme for effectively generating the von Neumann Hamiltonian for nonlocal observables without the need to communicate and adapt.
> [...]

In other words: how can parties cooperate to measure an observable that involves qubits belonging to more than one of them, assuming they can't just send the qubits to each other?

# The Problem

A non-local observable is a measurement that involves multiple separated qubits.
For example, suppose you want to know whether two qubits agree or disagree along the Z axis.
You could measure each qubit's $Z$ observable and compare the results... or you could just measure the Z-parity observable $Z \otimes Z$.

The advantage of measuring $Z \otimes Z$, instead of measuring both $Z\_1$ and $Z\_2$, is that we disturb the system less.
For example, suppose you stored a bit $x$ into the X-parity observable $X \otimes X$ and a bit $z$ into the Z-parity observable (which is the trick behind [superdense coding](https://en.wikipedia.org/wiki/Superdense_coding)).
Because $X \otimes X$ [doesn't commute](/quantum/2016/01/19/unknown-but-equal.html) with $Z\_1$ or $Z\_2$, measuring either of the individual Z-values in the process of recovering the $z$ bit will destroy the $x$ bit.
To recover both $x$ and $z$, we need to measure *only* $Z \otimes Z$ and *only* $X \otimes X$.
Not $Z\_1$ or $Z\_2$ or $X\_1$ or $X\_2$.

When both qubits are in the same quantum computer, it's easy to measure $Z \otimes Z$ .
Just CNOT one of the qubits onto the other, and measure that.
But in the paper's problem, the qubits are on separate quantum computers.

# My Solution

After thinking for a minute, it occurred to me that quantum teleportation would directly solve this problem.
If we had access to pre-shared entanglement, we could burn it to teleport Alice's qubit to Bob, have Bob perform the measurement, then teleport the qubit back.
So we could perform a non-local measurement at the cost of 2 Bell pairs and four classical bits of communication.

I then realized I could cut the cost in half by copy-teleporting from Alice to Bob, then erasing Bob's copy (basically: throw away the [second half](/quantum/2015/12/28/Separating-Quantum-Teleportation.html) of the first teleport, and the [first half](/quantum/2015/12/28/Separating-Quantum-Teleportation.html) of the second teleport).

So here's my guessed solution to the paper's problem, assuming pre-shared entanglement is allowed:

<img src="/assets/{{ loc }}/measuring-parity-under-locc.png" alt="Measuring parity under locc via entanglement" style="max-width: 100%;"/>

Note that the parity measurement can be replaced by any measurement (or combination of measurements) of the two qubits.

At first I was worried about needing pre-shared entanglement.
Was the paper going to come up with some clever way of avoiding it?

No.
Definitely not.

[Recall](/quantum/2016/01/30/quantum-pigeonhole.html) that a parity measurement can create entanglement.
Just initialize two qubits into the state $\ket{0} + \ket{1}$, and measure their parity.
If the parity was even, the qubits are now in the state $\ket{00} + \ket{11}$; otherwise they're in the state $\ket{01} + \ket{10}$.
By hitting one of the qubits with a NOT when the parity measurement was odd, the qubits end up unconditionally entangled into the state $\ket{00} + \ket{11}$.

Because we can create one EPR pair per non-local parity measurement, it must cost at least one EPR pair to perform a non-local parity measurement.
Otherwise we could generate unlimited entanglement for free, using only classical channels, 
That's impossible, for a bunch of reasons (e.g. it would allow us to clone qubits, not to mention turning all classical channels into quantum channels for free).

Based on achieving the lower bound for entanglement consumption, I predict that the paper's solution to the problem is basically my circuit above.

# The Paper's Solution

*Reads Paper*

Urgh, I overlooked an important part of the problem statement: "without the need to communicate and adapt".
We're not working in the regime of local-operations-with-classical-communication, we're working in the regime of local-operations-with-after-the-fact-note-comparing.
My guess was on the right track, but ultimately wrong.

Why can we only compare notes after the fact, instead of communicating during the protocol?
Because communicating during the protocol is hard, experiementally speaking.

All I needed to do was post-select on communication not being necessary, instead of bothering with communication.
Just assert that the communicated value was 0, then compare notes after the fact and throw away any experiments that failed to meet the assertion.

That's exactly what the paper does:

> The entanglement and communication resources for our scheme are at most equivalent to a single round of teleportation.
> This can be compared to the naive strategy of teleporting, measuring and teleporting back.
> [...]
> However, the motivation for the protocol is the fact that it can be implemented without communication or adaptive components.
> [...]
> From a practical perspective we can easily imagine other situations such as linear optics, where the resources necessary for an adaptive scheme that requires communication outweigh the advantage of a deterministic protocol.

Here's the paper's diagram of the non-local measurement process:

<img src="/assets/{{ loc }}/paper-diagram.png" alt="Measuring parity under locc via entanglement" style="max-width: 100%;"/>

And here's the same thing again, but in my diagrammatic style:

<img src="/assets/{{ loc }}/measuring-parity-under-locc-using-post-selection.png" alt="Measuring parity under locc via entanglement, using post-selection instead of communication" style="max-width: 100%;"/>

Note the similarities between the above diagram and the diagram for my initial solution.
They're exactly the same, except operations controlled by remote values have been replaced with post-selection that the operation was unnecessary (due to the control not being satisfied).
This avoids communication during the protocol, though of course it still requires some after-the-fact coordination where Alice and Bob tell each other which runs they ruined.
In the end, we'll lose three quarters of the runs to measure a two-qubit non-local observable (and the losses get exponentially worse as the number of involved qubits increases).

One thing that does confuse me is that the paper uses a doubly-controlled operation to do its parity (or other) measurement.
That's simply not good enough.

The paper also discusses how to weaken the measurement, etc.

# Summary

You can measure non-local observables, without otherwise disturbing a distributed state, by using pre-existing entanglement and post-selection to perform teleportations.
