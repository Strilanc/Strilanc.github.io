---
layout: post
title: "Post-selection is cheating"
date: 2016-09-27 12:10:10 pm EST
permalink: post/1623
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Recently, two demonstrations of quantum teleportation were published in Nature:

- ['Quantum teleportation with independent sources and prior entanglement distribution over a network' by Qi-Chao Sun et al](http://www.nature.com/nphoton/journal/v10/n10/full/nphoton.2016.179.html) ([arXiv preprint](http://arxiv.org/abs/1602.07081))
- ['Quantum teleportation across a metropolitan fibre network' by Valivarthi et al](http://www.nature.com/nphoton/journal/vaop/ncurrent/full/nphoton.2016.180.html) ([arXiv preprint](https://arxiv.org/abs/1605.08814))

I want to talk about a difference between the two.

In the Valivarthi et al paper, they describe the last steps of their teleportation like this:

> Bob [..] creates pairs of photons [..] in the maximally time-bin entangled state $\ket{\psi^+} = 2^{-1/2} (\ket{e,e} + \ket{l,l})$.
> He [sends the photons] to Charlie, where they are projected jointly with the photons from Alice onto the maximally entangled state $\ket{\psi^-} = 2^{-1/2} (\ket{e,l} - \ket{l,e})$.

Whereas here's how Qi-Chao Sun et al desribe the teleportation process in their paper:

> Charlie then sends the idler photon to Bob and holds the signal photon by propagating it in a 15 km coiled optical fibre.
> Bob holds the idler photon similarly after he receives it.
> The temporary storages allow us to perform [the Bell State Measurement] after entanglement distribution and implement the feed-forward operation in real time.

Notice that Valivarthi et al are talking about *projecting* while Qi-Chao et al are talking about *performing operations*.

Let me make the difference more concrete by focusing on some quantum circuits that are analogous to the two papers' respective protocols.
Here is a circuit animation corresponding to (a simplification of) what Qi-Chao Sun et al implemented:

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/teleportation-full.gif"/>

As you can see in the animation, the circuit moves the top qubit's state to the bottom qubit as you go from left to right.
The circuit creates a pre-shared EPR pair, uses an arbitrary gate to choose a qubit for Alice to send, does a Bell-basis measurement for Alice, then tells Bob the measurement result and applies some conditional fixup operations.
It's a typical quantum teleportation circuit.

Now here's the circuit corresponding to (a simplification of) what Valivarthi et al did:

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/teleportation-filter.gif"/>

The state still moves from top to bottom, but without Bob applying any fixup operations.
Instead, any runs where those fixup operations would have been applied are discarded and we focus our analysis on what's left.

Putting it blunlty (and **really** unfairly): Qi-Chao Sun et al performed quantum teleportation. Valivarthi et al skipped the hardest part of teleportation, cherry-picked the 25% of runs that weren't ruined as a result, and showed that if they *hadn't* skipped the hard part then they *would* have performed quantum teleportation.

I mean... Valivarthi et al didn't even have Bob hold his qubits long enough for Alice to do her measurement!

> We point out that the 795 nm photons are measured prior to the [Bell state measurement], thus realizing a scenario where teleportation is achieved a-posteriori

So it would be more accurate to describe their experiment as *Bob* predicting things about *Alice's* measurement results, not Alice heralding whether Bob received the qubit or not.
(Don't get me started on people who somehow forget about the cherry-picking and then say the information *actually* went into the past.)

Valivarthi et al's paper still represents an achievement.
If you're in some context where you can retry until the process works, their protocol would work fine.
For example, one of the recent 'loophole-free' Bell inequality experiments [used an analogous post-selected entanglement swapping process](http://www.scottaaronson.com/blog/?p=2464).

It's just that, to me, leaving off the hardest part of quantum teleportation but still calling it quantum teleportation, without any qualifiers, feels like cheating.
So I strongly preferred Qi-Chao Sun et al's paper.
