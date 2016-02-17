---
layout: post
title: "The Entanglement Chooser"
date: 2015-11-29 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

<!--
<img src="/assets/{{ loc }}/markov_diagram.png"/>
-->

People already have enough trouble understanding the delayed choice quantum eraser.
Why not add another wrinkle?

# Entangled Xor Entangled

There are many interesting scenarios where entanglement can be created, transferred, or restored using only clever measurements and classical communication.
A simple example is [kicking a qubit out of a GHZ state]() with a measurement and a phase correction, thus upgrading to a maximally-entangled EPR pair.
A wilder example is [entanglment swapping](), where you can entangle two qubits $A$ and $B$, that have never interacted, by measuring qubits $A\_2$ and $B\_2$ entangled with each respectively.

The delayed choice quantum eraser is also a scenario of this type, though for some reason people see it as deciding whether two qubits were entangled or not instead of discovering (or not) how they were entangled.

Anyways, at one point a question occurred to me: is it possible to create a situation where entanglement can be restored to system A, or to system B, but not to both?

The first thing that came to mind was a 4-qubit GHZ state $\ket{0000} + \ket{1111}$, where an Alice has two of the qubits and Bob has the other two.
Alice (or Bob) can then use the kick-qubit-out-GHZ-state technique I mentioned to leave Bob (Alice) with a proper EPR pair.

But that situation is kind of... trivial.
There's really only one system, and we're making it smaller, instead of having two systems that get decohered and recohered.
And the decision for who gets to keep the EPR pair is shared between Alice and Bob, instead of isolated to one party.

I decided that what I really wanted was a third party, Eve, with sole discretion over who gets to keep their EPR pair.
And Eve's decision would be backed up by force of natural law instead of by convention.
So I have these criteria:

1. Alice and Bob, acting without Eve, should not have access to any entanglement. (Though they may have correlation.)
2. Eve should be the sole decider of which state is recoherable.
3. It should be possible to recohere Alice's EPR pair, or Bob's EPR pair, but not both.
4. Some recovery should be possible after-the-fact.

And I started playing around with my toy quantum circuit simulator, trying to meet them.
Satisfying criterias (1) and (2) is quite easy, because almost any correlated information about Alice's state or Bob's state held by Eve acts like a measurement if Eve doesn't participate (and measured entanglement is just correlation).

The tricky part is criteria (3).
If we give Eve too much information about Alice and Bob's state, she can easily recover both.
But if we don't give Eve enough information, one of the states will stay coherent.
The solution I settled on was to expand Alice's EPR state to a GHZ state, but conditionally negate the qubit's phase based on Bob's EPR state.
Eve is then given that Alice-X'd and Bob-Z'd qubit.

A -H.--
A --X--
E --XZ-
B ---X-
B -H-.-

More concretely, the state of the system is $\frac{1}{2} \parens{\ket{00 0 00} + \ket{00 0 11} + \ket{11 1 00} - \ket{11 1 11}}$, with the third qubit belonging to Eve.

We can confirm that Alice and Bob have no entanglement by expanding the system into a density matrix and then tracing over Eve's qubit.
When Eve's qubit is Off, the system is in the state $\frac{1}{\sqrt{2}} \parens{\ket{00 0 00} + \ket{00 0 11}}$ which separates into $\frac{1}{\sqrt{2}} \ket{000} \parens{\ket{00} + \ket{11}}$.
When Eve's qubit is On, the system is in the state $\frac{1}{\sqrt{2}} \parens{\ket{11 1 00} - \ket{11 1 11}}$ which separates into $\frac{1}{\sqrt{2}} \ket{111} \parens{\ket{00} - \ket{11}}$.
The state of Bob's qubits, by themselves, is thus a mix of 50% $\ket{00} - \ket{11}$ and 50% $\ket{00} + \ket{11}$, given the density matrix:

$\rho\_{Bob} = \frac{1}{4} \begin{bmatrix}
1&0&0&1
0&0&0&0
0&0&0&0
1&0&0&1
\end{bmatrix} + \frac{1}{4} \begin{bmatrix}
1&0&0&-1
0&0&0&0
0&0&0&0
-1&0&0&1
\end{bmatrix} = \frac{1}{2} \begin{bmatrix}
1&0&0&0
0&0&0&0
0&0&0&0
0&0&0&1
\end{bmatrix}$

Which is the state you get for an unknown coin flip, instead of the state for an EPR pair in entangled superposition.
Alice's qubits also have this reduced state, on their own.

However, Alice and Bob's qubits *together* are not quite so bleak.
Alice can measure her qubits to determine whether Bob is in the + case or the - case, allowing him to perform a phase correction even if Eve doesn't get involved.

Either Alice or Eve can help Bob recover his state.
Only Eve can help Alice recover her state, and only if neither of them help Bob.

*Together*

$\rho\_{3=On} = \begin{bmatrix}
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&1&0&0&-1
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&0&0&0&0
0&0&0&0&0&0&0&0&0&0&0&0&-1&0&0&1
\end{bmatrix}$

Criteria (2) would be easy, if it weren't for the "but not both" restriction.
We want to store a bit of information about Alice's EPR pair and a bit of information about Bob's EPR pair, so two bits total.
But if we actually store both bits, nothing will stop us from recovering both.
So we actually only want to store a single bit (or maybe a trit?).
But then the issue is that what we're doing is very similar to perfect [quantum oblivious transfer](), and that's known to be impossible.

To make things work, we have to make a bit of a sacrifice.
Instead of Alice and Bob only needing information from Eve in order to recohere their EPR pair, recohering Alice's qubit will require information from Bob.



# The Setup

Here are the components of the solution I came up with:

Setup circuit:


After the setup, all quantum communication channels are shut down and only classical interactions between the qubits are possible.
You can still hold each individual qubit in superposition, rotate it, and measure it, but no compound operations are allowed.
If you want one qubit to affect another, you need to measure it and then conditionally perform an operation based on the announced result of the measurement.

Alice recoherence circuit:

A ----
A --Z-
E --+-
B -M.-
B ----

Bob recoherence circuit:

A ------
A ---M.-
E ---ZZ-
B -HM.--
B ------

To create the situation, have Alice create a GHZ triplet and Bob create an EPR pair.
Then have Alice send one of the qubits in her triplet to Bob, so he can hit it with a Z controlled by one of his qubits.
Then forward that qubit onward to Eve.
Then have Alice send one of her qubits to Alice2, and Bob send one of his qubits to Bob2.

So the state of the system is this:

$\frac{1}{2} \parens{\ket{00 0 00} + \ket{00 0 11} + \ket{11 1 00} - \ket{11 1 11}}$

We can confirm that Alice and Bob need Eve in order to recohere their EPR pairs by computing the mixed state that results when tracing over Eve's qubit:

$/rightarrow\_E 50% [0] \frac{1}{\sqrt{2}} \parens{\ket{00 00} + \ket{00 11}} + 50% [1] \frac{1}{\sqrt{2}} \parens{\ket{11 00} + - \ket{11 11}}$

Which factors into:

$= (50% [000]) \parens{\ket{00} + \ket{11}} + 50% [111] \ket{11} \frac{1}{\sqrt{2}} \parens{\ket{00} + - \ket{11}}$

And combines into:

$= 50% [0] \frac{1}{\sqrt{2}} \ket{00} \parens{\ket{00} + \ket{11}} + 50% [1] \ket{11} \frac{1}{\sqrt{2}} \parens{\ket{00} + - \ket{11}}$

Alice would like the first two qubits to be an EPR pair, but the third qubit is acting like a measurement of the pair.
It decoheres the two possibilities, giving us a correlated coin flip instead of an entangled pair.

$\frac{1}{2} \parens{\ket{00000} + \ket{00011} + \ket{11100} - \ket{11111}}$

$\rightarrow 25% \ket{0\\_\\_} + 25% \ket{1\\_\\_} + 25% \ket{0\\_\\_} + 25% \ket{1\\_\\_}$

$= 50% \ket{0\\_\\_} + 50% \ket{1\\_\\_}$

Or the second qubit:

$\frac{1}{2} \parens{\ket{000} + \ket{100} + \ket{011} - \ket{111}}$

$\rightarrow 25% \ket{\\_0\\_} + 25% \ket{\\_0\\_} + 25% \ket{\\_1\\_} + 25% \ket{\\_1\\_}$

$= 50% \ket{\\_0\\_} + 50% \ket{\\_1\\_}$

Or both:

$50% (\ket{0} + \ket{1})\ket{0} + 50% (\ket{0} - \ket{1})\ket{1}$

$= 50% (H\ket{0})\ket{0} + 50% (H \ket{1}) \ket{1}$

This is a correlated coin flip, instead of an entangled pair.

---

So unless we have the third qubit interact, there's no entanglement here.

# Recohering

We can recohere the top qubit by correcting the phase error it introduced:

Going from:

$50% (\ket{0} + \ket{1})\ket{0} + 50% (\ket{0} - \ket{1})\ket{1}$

to

$50% (\ket{0} + \ket{1})\ket{0} + 50% (\ket{0} + \ket{1})\ket{1}$

$= (\ket{0} + \ket{1}) (50% \ket{0} + 50% \ket{1})$

Recohering the second qubit is more complicated, needing a phase correction from the first qubit and also from the transformed third qubit:

$\frac{1}{2} \parens{\ket{000} + \ket{100} + \ket{011} - \ket{111}}$

$\frac{1}{\sqrt{8}} \parens{\ket{000} + \ket{001} + \ket{100} + \ket{101} + \ket{010} - \ket{011} - \ket{110} + \ket{111}}$

measure:

$(\ket{00} + \ket{10} + \ket{01} - \ket{11})(50% zero) + (\ket{00} + \ket{10} - \ket{01} + \ket{11}) (50% one)$

phase correction from bottom:

$(\ket{00} + \ket{10} + \ket{01} - \ket{11})(50% zero) + (\ket{00} + \ket{10} + \ket{01} - \ket{11}) (50% one)$

$(\ket{00} + \ket{10} + \ket{01} - \ket{11})(50% zero + 50% one)$

measure top:

$((50% zero)(\ket{0} + \ket{1}) + (50% one)(\ket{0} - \ket{1}))(50% zero + 50% one)$

phase correct top:

$((50% zero)(\ket{0} + \ket{1}) + (50% one)(\ket{0} + \ket{1}))(50% zero + 50% one)$

$= R \otimes (H \cdot \ket{0}) \otimes R$

# Scenario

There are three parties: Alice, Bob, and Eve.
Each has one of the qubits

# Interpretation




