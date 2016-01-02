---
layout: post
title: "Delayed Choice Quantum Erasure"
date: 2015-11-29 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

If there was a prize for "most misunderstood experiment", the [delayed choice quantum eraser](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser) would be a strong contender.
Popular presentations of the DCQE tend to treat it as a grand world-view-shattering mystery, with implied powers ranging from sending messages backwards in time to demonstrating the existence of conscious knowledge.
My goal in this post is to explain why that is not the case.

Examples of misconceptions about the DCQE are all over the internet.
Case in point: I googled "delayed choice quantum eraser", and the third result was [a video](https://www.youtube.com/watch?v=U7Z_TIw9InA).
A video that's just a scene from the infamous [What the #$*! Do We (K)now!?](http://www.imdb.com/title/tt0399877/) pseudo-documentary followed by a scene from [a terrible episode of "The Universe"](http://www.imdb.com/title/tt2356685/).
Both clips incorrectly imply that collapse is caused by humans looking in the general direction of an experiment, except that by "imply" I mean [literally showing a graphic of person turning waves into particles by opening their eyes](https://youtu.be/vnN85i_75EI?t=18m15s).
(My eyes tried to roll right out of my skull.)

The DCQE may be counter-intuitive, it may be *interesting*, but it's not *mysterious* or *magical*.
Interpretations of quantum mechanics explain it just fine without any reference to consciousness or backwards-in-time effects.
In this post I will explain what you'd actually see if you ran a DCQE, and a simplified mathematical model of what's going on.

# The Experiment

One of the obstacles to understanding the DCQE is that... well, it's kind of complicated.
It builds on the classic double-slit experiment, then throws in entanglement and choosing and a bunch of philosophical baggage gets dragged along.

The core idea behind the experiment is to make an entangled copy of the which-slit-did-the-photon-go-through information.
This entangled copy can then be measured to reveal an interference pattern hiding in results that apparently had no interference pattern.

The most famous DCQE experiment was done by Kim et al. in the year 2000.
Taking a bit of insspiration from [one of the sites Wikipedia linked to](http://strangepaths.com/the-quantum-eraser-experiment/2007/03/20/en/), and as little inspiration as possible from [wikipedia's diagram](https://en.wikipedia.org/wiki/File:Kim_EtAl_Quantum_Eraser.svg), I made this diagram summarizing the setup:

<img src="/assets/{{ loc }}/dcqe-photon-diagram.png" title="Over-simplified experimental setup diagram"/>

I need to emphasize that this diagram is over-simplified.
For example, the actual experiment has various lenses and prisms to direct the photons.
It also doesn't use screens; it uses synchronized detectors all connected to an electronic counter.

Anyways, the process the diagram is intended to communicate is that the experiment works by having:

1.
**Entangled Superposition**:
A photon arrives, encounters the wall with two slits, and passes through the slits.
This puts the photon's position into a superposition.
Special crystals then [split the photon into two photons](https://en.wikipedia.org/wiki/Spontaneous_parametric_down-conversion).

2.
**Delayed**:
One of the resulting photons does the normal double-slit thing, building up an apparent lack-of-interference pattern on the interference screen.
The other photon embodies the which-way information, and its journey is represented by the right half of the diagram.

3.
**Choice**:
The "choice" to erase or not is performed by two beam splitters, one for the top slit and one for the bottom slit, acting on the which-way photon.
(I think this is the weakest part of the setup, since using beam splitters is a bit like making both choices, but whatever it works fine.)
If the which-way photon passes through the beam splitters without being reflected, its impact point at the top or bottom tells us which slit the original photon passed through.
But if the which-way photon is reflected by the splitters then, regardless of the starting slit, the photon will show up in each erased case half of the time.
This unconditional 50/50 split is how the which-way information is "erased".

4.
**Recovery**:
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

In my opinion, DCQE is a lot simpler if you think in terms of qubits.

In the optical experiment, a photon is placed into a superposition of going through the left slit or the right slit.
This can be represented by a qubit: we'll call it $A$, use $A = \ket{0}$ to mean "went through the left slit", and $A = \ket{1}$ to mean "went through the right slit".
After passing through the slits, but before the photon is down-converted into two photons, we're in the state $A = \frac{1}{\sqrt{2}} \ket{0} + \frac{1}{\sqrt{2}} \ket{1}$.
The two photons resulting from down-conversion are in the same place, and entangled.
They are in the state $AB = \frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$.
In other words, they form an EPR pair.

We also need to translate the outcomes of the experiment.
What does an interference pattern appearing on a screen mean, in terms of our qubits?
Basically, it has to do with how the qubit varies as it is rotated around the X axis.
If applying $X^t$ transformations to the qubit before measuring it changes how often we observe it to be ON or OFF, then it is "forming an interference pattern".
If the $X^t$ operations have no effects, and the qubit is always 50/50 ON/OFF, then that corresponds to a lack-of-interference pattern.

So our circuit will start by creating an EPR pair in the usual way (with a Hadamard gate and a controlled NOT gate).
Then it will rotate Alice's qubit around the X axis and measure it.
Then Bob chooses to either erase or reveal his information about Alice's qubit, by respectively applying or not applying a Hadamard gate before measuring.

Alice will always see a 50/50 frequency for her qubit being on and off.
But, if we use Bob's measurement result to group her outcomes, things change.

When Bob *erases* his which-way information about Alice's qubit, conditioning on his measurement result does nothing.
It's always 50/50 chances:

<img src="/assets/{{ loc }}/cycle-erased.gif" title="Erasing an EPR pair's entanglement"/>

But if Bob instead *reveals* the which-way information, conditioning on his measurement suddenly throws the outputs all over the place!
There's an interference pattern in the buckets:

<img src="/assets/{{ loc }}/cycle-revealed.gif" title="Revealing an EPR pair's value"/>

Actually, framed this way, the experiment seems kind of dumb.
It basically says that if Bob measures along the same axis as Alice, he learns something about the value she measured.
But if he measures along a perpendicular axis, he instead won't learn anything.
That's just basic facts about EPR pairs!

There's no need for retrocausal effects for the same reason we don't them to explain bell tests: other mechanisms work just fine.
You *could* use backwards-in-time shenanigans, or you could use instantaneous collapse. Or many worlds. Or shut up and calculate.

# Summary

1.
**You never *see* an interference pattern**.
The interference pattern only shows up when filtering after-the-fact, using the chooser's measurement results to group experimental runs.

2.
**Backwards-in-time effects aren't needed**.
In the Copenhagen interpretation, the which-way photon is collapsed by the test photon hitting the screen and this explains the observations.
In the Shut-Up-And-Calculate interpretation, you get the right answer by shutting your mouth and calculating.
In other interpretations, other explanatory mechanisms are used (e.g. many worlds).
You *could* use backwards-in-time effects, but you certainly don't *need* them.

3.
**Consciousness has nothing to do with this**.
The mathematical model simply makes no mention of anything besides the equipment.
The experiment will have the same outcome whether or not a human is present.

4.
**This experiment should have been called "The Optional Information Recovery Experiment"**.
Because that's ultimately all we're doing: either you measure the information needed to find the hidden interference patterns, or you don't.
If you don't measure the needed information, you can't find the hidden patterns (duh).

Unfortunately, people will continue to say stupid things about this experiment.
No doubt I've said something dumb about it in this very post.