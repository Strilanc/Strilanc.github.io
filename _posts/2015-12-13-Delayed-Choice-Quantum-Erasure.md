---
layout: post
title: "Delayed Choice Quantum Erasure"
date: 2015-11-29 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

If there was a prize for "most misunderstood experiment", I would award it to the [delayed choice quantum eraser](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser).
Popular presentations of the delayed choice quantum eraser experiment (hereafter just called the DCQE) treat it as a grand world-view-shattering mystery, with implied powers ranging from sending messages backwards in time to demonstrating the existence of conscious knowledge.
My goal in this post is to explain why that is not the case.

Examples of these misconceptions are all over Q&A sites and forums, not to mention pop science articles.
A particularly eggregious example is that a top result I get when googling "delayed choice quantum eraser" is [a video](https://www.youtube.com/watch?v=U7Z_TIw9InA) that mashes scenes from [What the #$*! Do We (K)now!?](http://www.imdb.com/title/tt0399877/) and the ["Microscopic Universe" episode of The Universe](http://www.imdb.com/title/tt2356685/).
Both clips heavily imply that it's a person looking at the experiment that causes collapse, and by "heavily imply" I mean [literally showing a graphic of person turning waves into particles by opening their eyes](https://youtu.be/vnN85i_75EI?t=18m15s).
The "Microscopic Universe" episode then goes on to talk about how we're only starting to grasp what this means for changing the past, and that reality is a figment of our imagination.
(My eyes tried to roll right out of my skull.)

In this post I will explain what you'd actually see if you ran a DCQE, and the underlying mathematical model.
The DCQE may be counter-intuitive, it may be *interesting*, but it's not *mysterious* or *magical*.
Interpretations of quantum mechanics explain it just fine without any reference to consciousness or backwards-in-time effects.

# The Experiment

One of the obstacles to understanding the DCQE is that... well, it's kind of complicated.
It builds on the classic double-slit experiment, then throws in entanglement and choosing and a bunch of philosophical baggage gets dragged along.

The core idea behind the experiment is to make an entangled copy of the which-slit-did-the-photon-go-through information.
This entangled copy can then be measured to reveal an interference pattern hiding in results that apparently had no interference pattern.

The most well known DCQE experiment is the one done by Kim et al. in 2000.
Taking a bit of insspiration from [one of the sites Wikipedia linked to](http://strangepaths.com/the-quantum-eraser-experiment/2007/03/20/en/), and as little inspiration as possible from [wikipedia's diagram](https://en.wikipedia.org/wiki/File:Kim_EtAl_Quantum_Eraser.svg), I made this diagram summarizing the setup:

<img src="/assets/{{ loc }}/dcqe-photon-diagram.png" title="Over-simplified experimental setup diagram"/>

I need to emphasize that this diagram is over-simplified.
For example, the actual experiment has various lenses and prisms to direct the photons.
It also uses detectors feeding to an electronic counter instead of screens.

Anyways, the process the diagram is intended to communicate is:

1. **Entangled Superposition**:
A photon arrives, encounters the wall with two slits, and passes through the slits.
This puts the photon's position into a superposition.
Special crystals then [split the photon into two photons](https://en.wikipedia.org/wiki/Spontaneous_parametric_down-conversion).
2. **Delayed**:
One of the resulting photons does the normal double-slit thing, building up an apparent lack-of-interference pattern on the interference screen.
The other photon embodies the which-way information, and its journey is represented by the right half of the diagram.
3. **Choice**:
The "choice" to erase or not is performed by two beam splitters, one for the top slit and one for the bottom slit, acting on the which-way photon.
(I think this is the weakest part of the setup, since using beam splitters is a bit like making both choices, but whatever it works fine.)
If the which-way photon passes through the beam splitters without being reflected, its impact point at the top or bottom tells us which slit the original photon passed through.
But if the which-way photon is reflected by the splitters then, regardless of the starting slit, the photon will show up in each erased case half of the time.
This unconditional 50/50 split is how the which-way information is "erased".
4. **Recovery**:
By grouping runs of the experiment into buckets based on where the which-way photon hit the which-way screen, and looking at the pattern on the interference screen built up by photons from each bucket individually, we find some interesting patterns.
The top and bottom case buckets show nothing interesting happening, but the erased case buckets filter the apparent lack-of-interference pattern into sub interference patterns!

In case that was confusing, I've put together a diagram summarizing what you see on the interference screen and also the implied pattern within each bucket (which you can recover only by filtering afterwards):

<img src="/assets/{{ loc }}/dcqe-photon-graph.png" title="Resulting interference patterns"/>

The crucial thing to notice about the above diagram is you always *always* see no interference pattern.
It's only by filtering after the fact that we can recover anything interfering with itself.
There are interference patterns present, but without the which-way information they complement each other in a way that makes it impossible to tell.

If you ever seen someone suggest using the DCQE experiment to perform FTL communication, because "Bob only sees an interference pattern if Alice erases the which-way information", you now know why it won't work: even when Alice erases the which-way information, Bob doesn't see an interference pattern.
It's only when Alice and Bob get back together and compare notes, grouping Bob's results based on Alice's erasure measurement outcomes, that the interference patterns can be noticed.

# A Simplified Model

This experiment is a lot clearer if you think in terms of qubits, instead of self-interfering photon paths.

In the optical experiment, we have a photon in a superposition of going through the top slit and the bottom slit.
It is the state $\frac{1}{\sqrt{2}} \ket{\text{top}} + \frac{1}{\sqrt{2}} \ket{\text{bottom}}$.
We then create an entangled partner photon at the same slit, so we end up in this situation:
$\frac{1}{\sqrt{2}} \ket{\text{top}\_1}\ket{\text{top}\_2} + \frac{1}{\sqrt{2}} \ket{\text{bottom}\_1}\ket{\text{bottom}\_2}$.

In an optical experiment this requires crazy non-linear crystals and there's frequency changes and... bleh.
In a quantum circuit it's simpler, though more abstract.
We'll represent the path information as qubits, with bottom corresponding to 0 while top corresponds to 1.
So what we've done is create an EPR pair $\frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$

If we measure the second qubit in the computational basis we will reveal the value of the first qubit.
But if we rotate the second qubit first, so we end up measuring it along a different axis, then we reveal something different about the first qubit.
Instead of finding out if it's in the state $\ket{0}$ or $\ket{1}$, we find out if it's in the state $\ket{0}+\ket{1}$ or $\ket{0}-\ket{1}$.

# Misconceptions Clarified

1. **You never *see* an interference pattern**.
You will see the same thing on the test screen whether or not your partner chooses to erase or reveal the which-way information.
Recovering the hidden interference pattern requires post-hoc splitting of the test-photon impacts into groups based on the outcome of a measurement (but that measurement can only be performed in the erasure case).

2. **Backwards-in-time effects aren't needed**.
My explanation of how the system's state was changing never involved rewriting previous states of the system.
The assertions of retro-causality always come down to assuming the complementarity principle.
The complementarity principle is simply wrong; quantum things simply aren't classical particles or classical waves.

3. **Consciousness has nothing to do with it**.
The experiment does the same stuff whether or not someone is in the room flirting with it.










Alice creates an entangled pair of photons and performs tests on them that detect entanglement. All the tests come up negative.

Bob measure his qubit along the right axis. There is a qubit for every one of Alice's experiments.

Based on Bob's measurement, we group Alice's results into two groups.

Within each group, entanglement is detected!

-------

More specific:

Entanglement really comes down to correlation along more than one axis at a time.

Physicists love the singlet state because it disagrees along all 3 at the same time.

There are three other distinct ways to be entangled, where you disagree along one axis but agree along the other two.

Also you can be in a combination of the four.

Now suppose you're in one of the four entangled states, but you don't know which one. Suppose it's X half the time or singlet half the time.

When it's X we get agree,agree,disagree.
When it's S we get dis, dis, dis.
Together we get half-agree + dis/2, dis/2+agree/2, dis/2 + dis/2.
Half dis and half agree is just random.
So we see random, random, disagree.

That's just normal correlation, not entanglement.

The same thing will happen with all other pairs: one agree or disagree combined with two randoms. And if all four are equally likely then you only see random. *Probabilistic mixes of entangled states look unentangled.* This is the heart.

But suppose someone else knows which state was actually sent. They know if you received X or S. Then after you do your experiments they can come over and tell you "these ones were X, those ones were S" and *within each group* you will see that confirmed by the detection of the corresponding entanglement.

The delayed choice experiment adds just one more wrinkle.
The which-one-is-it information is not measured, it's encoded along the Z axis of a qubit.
But if you measure one of the other axies, you *can't* measure the Z axies.
Whether or not the information is truly gone depends on the interpretation you're using (Copenhagen yes, Everett no), but it is certainly *intractable to access*.
Basically you can think of measuring along the wrong axis as burning the information.
No one will ever know which cases were X and which were S, and that will make detecting the mutually-hiding entanglements impossible.

---------

The math and the circuits.

I covered some of this previously in 'erasing a GHZ state'.

You can apply the phase correction to restore the state, but you can also do that after the fact to the measurements... sortof.

# Summary

