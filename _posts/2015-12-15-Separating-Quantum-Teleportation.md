---
layout: post
title: "Quantum Teleportation's Two Functions"
date: 2015-12-13 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Quantum teleportation, a technique for sending quantum information over a classical communication channel at the cost of some pre-existing entanglement, is usually presented as a monolithic primitive.
In this post, we discuss how it can be split into two useful sub-parts: "copy-sending" and "erasure".

If you're not already familiar with quantum teleportation, I previously explained how it worked in the post [Storing Bandwidth with Quantum Teleportation](/quantum/2014/05/11/Storing-Bandwidth-with-Quantum-Teleportation.html).
Alternatively, you can watch Michael Nielson, co-author of the de-facto standard textbook for quantum computing, [explain it in a Khan-academy style video](https://www.youtube.com/watch?v=3wZ35c3oYUE&list=PL1826E60FD05B44E4&index=18).

For reference, here is a circuit diagram of the quantum teleportation process:

<img src="/assets/{{ loc }}/quantum-teleportation-circuit.png" title="Quantum Teleportation Circuit" style="max-width: 100%;"/>

And a quick overview:


Given a pre-shared [EPR pair](https://en.wikipedia.org/wiki/Bell_state), perform a bell-basis measurement on the sender's EPR half as well as the message qubit.
Send that measurement result to the receiver, and use it to perform some corrective operations that recohere their EPR half into the message qubit.

Now let's move on to explaining each of the sub-tasks performed by quantum teleportation.

# Copy-sending

Define a "copy-sending" quantum channel to be one that leaves an entangled copy of the sent qubit at the sender.
Specifically, a copy-sending channel performs the operation $(\alpha \ket{0} + \beta \ket{1}) \ket{0} \rightarrow \alpha \ket{00} + \beta \ket{11}$.
Note that this is different from a typical quantum channel, which would *move* the qubit, i.e. would perform $\ket{\psi} \ket{0} \rightarrow \ket{0} \ket{\psi}$.

A copy-sending quantum channel acts a bit like a long-distance controlled-not.
The sender has the control qubit, the receiver has a target qubit in the OFF state, and the copy-send toggles the receiver's qubit when the sender's qubit is ON (without breaking superposition).
The main difference is that copy-sending is not its own inverse: copy-sending twice will create a second entangled copy at the receiver instead of cancelling out the first send.

Quantum teleportation normally performs a quantum move, but we can streamline it into performing only a quantum copy-send.
We get some benefit for our troubles: the copy-send only needs to send *one* classical bit, instead of two.

<img src="/assets/{{ loc }}/quantum-copy-teleportation-circuit.png" title="Quantum Teleportation Circuit" style="max-width: 100%;"/>

Basically, the above circuit is using the EPR pair as a [one-time pad](https://en.wikipedia.org/wiki/One-time_pad).
Alice and Bob have a shared "really-truly" random secret bit $s$.
Alice wants to transmit a message bit $a$ to Bob, but Eve (Nature) is listening in on the line.
So Alice sends $m = a \oplus s$, masking the message with the pad, and Bob receives the message by computing $m \oplus s = (a \oplus s) \oplus s = a$.

This gives insight into why we "use up" the EPR pair when performing teleportation.
If you re-use a one-time pad, the scheme is no longer secure. [Eve would learn how various messages relate to each other](https://en.wikipedia.org/wiki/Venona_project#Decryption).
And remember that in this analogy Eve literally corresponds to Nature; she will [*not*](https://en.wikiquote.org/wiki/Richard_Feynman#Rogers_Commission_Report_.281986.29) be fooled.
(For example, it's important that Bob overwrites his copy of $s$ in computing $a$.
The value $s \oplus a$ was sent classically, so any copy of $s$ will act as a de-facto entangled copy of $a$ as far as decoherence is concerned.)

Quantum copy-teleportation can be a useful primitive on its own.
For example, suppose that Bob shares an EPR pair $x$ with Alice and a separate EPR pair $y$ with Charlie, but only classical channels are available and the threesome wants to share a [GHZ state](https://en.wikipedia.org/wiki/Greenberger%E2%80%93Horne%E2%80%93Zeilinger_state) instead of two independent EPR pairs.
Bob can use quantum copy-teleportation, fueled by $y$, to copy-send $x$ to Charlie.
This leaves Alice, Bob, and Charlie each with an entangled copy of $x$; they are in the GHZ state $\ket{xxx} = \frac{1}{\sqrt{2}}\ket{000} + \frac{1}{\sqrt{2}}\ket{111}$.

Notice that the quantum copy-teleportation circuit is a proper subset of the quantum teleportation circuit.
The remaining subset forms our second sometimes-useful-on-its-own primitive.

# LOCC Erasure

"[LOCC](https://en.wikipedia.org/wiki/LOCC)" is a technical term, an acrynom short for "**L**ocal **O**perations, **C**lassical **C**ommunication".
It is a constraint under which some coordination tasks can be performed, and others can't.
Quantum teleporation is a LOCC process, but only if the EPR pair has already been distributed.

Given we've extracted copy-sending from quantum teleportation, the obvious missing piece is erasing one of the copies.
How is this done?
It turns out [I covered how in a previous post](http://localhost:4000/quantum/2015/09/02/Partially-Erasing-Entanglement-with-Measurement.html).
You measure the qubit-to-be-erased along the X axis, then transmit that measurement result to the receiver so they can perform a conditional phase correction:

<img src="/assets/{{ loc }}/locc-erasure-circuit.png" title="Quantum Teleportation Circuit" style="max-width: 100%;"/>

Erasure is useful for removing unwanted entanglement.

# Summary

Quantum teleportation can be split into two separate useful tasks: copy-sending a qubit (using one bit of classical bandwidth and one EPR pair), and then erasing the sender's copy of the qubit (using one bit of classical bandwidth).