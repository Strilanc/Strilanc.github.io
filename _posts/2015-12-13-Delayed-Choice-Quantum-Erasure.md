---
layout: post
title: "Delayed Choice Quantum Erasure"
date: 2015-11-29 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

The [Delayed Choice Quantum Eraser](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser) is a widely misunderstood experiment.
*Apparently* it's a grand world-view-shattering mystery, with powers ranging from sending messages backwards in time ([example pop-science article](http://www.ibtimes.co.uk/quantum-weirdness-proved-again-measurement-changing-atoms-past-1504172)) to demonstrating the existence of conscious knowledge ([example woo thread](http://www.abovetopsecret.com/forum/thread1013362/pg1)).
Although there's continuous effort to correct these misconceptions (e.g. asked and answered [constantly](https://www.physicsforums.com/threads/explain-delayed-choice-quantum-eraser-without-consciousness.808688/) on physicsforums), I run into them all of the time.

Case in point: I googled for "delayed choice quantum eraser" videos and the top result is [this youtube video](https://www.youtube.com/watch?v=U7Z_TIw9InA).
It mashes a scene from the infamous [What the #$*! Do We (K)now!?](http://www.imdb.com/title/tt0399877/) film into a scene from [a terrible episode of "The Universe"](http://www.imdb.com/title/tt2356685/).
Both clips mention backwards-in-time effects and collapse being caused by humans looking in the general direction of the experiment.
The forehead-slapping hits climax as a graphic actually shows [a person turning waves into particles by opening their eyes](https://youtu.be/vnN85i_75EI?t=18m15s) (argh!).


Delayed choice erasure (hereafter DCQE) may be counter-intuitive, it may be *interesting*, but it's not *mysterious* or *magical*.
Interpretations of quantum mechanics explain it just fine without any reference to consciousness or backwards-in-time effects.
In this post, my goal is to explain what you'd actually see if you ran a DCQE and why the common misconceptions are in fact misconceptions.

# The Experiment

The DCQE experiment is like a typical [double-split experiment](https://en.wikipedia.org/wiki/Double-slit_experiment), except that an entangled copy of the which-slit-did-the-photon-go-through information is kept.
By later measuring the entangled copy of the information, you can find hidden interference patterns.
The idea is that, by choosing to recover or discard the relevant information, you choose whether there was "really" an interference pattern or not.

The best known DCQE experiment is [the one performed by Kim et al., in the year 2000](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser#The_experiment_of_Kim_et_al._.282000.29), so I will give a basic overview of their setup.
Wikipedia has a diagram of [the optical circuit they used](https://en.wikipedia.org/wiki/File:Kim_EtAl_Quantum_Eraser.svg), but the diagram is quite complicated.
Taking a bit of inspiration from [one of the sites Wikipedia linked to](http://strangepaths.com/the-quantum-eraser-experiment/2007/03/20/en/), I made this alternative diagram of their setup:

<img src="/assets/{{ loc }}/dcqe-photon-diagram.png" title="Over-simplified experimental setup diagram"/>

Be aware that this diagram is over-simplified.
For example, the actual experiment has various lenses and prisms to direct the photons.
Also, Kim et al. didn't use screens; they used detectors connected to an electronic counter.

Anyways, let's go over the process the diagram is intended to communicate in a bit more detail:

1. **Entangled Superposition**:
A photon arrives, encounters a wall with two slits, and passes through the slits.
This puts the photon's position into a superposition.
Special crystals then [split the photon into two photons](https://en.wikipedia.org/wiki/Spontaneous_parametric_down-conversion) (with entangled positions, without breaking the superposition).

    One of the resulting photons does the normal double-slit thing, building up an apparent lack-of-interference pattern on the interference screen.
The other photon embodies the which-way information.
Its journey is represented by the right half of the diagram, and can be delayed as long as desired.

2. **Choice**:
The "choice" to erase is performed by two beam splitters (the "choosers"), one for the top slit and one for the bottom slit.
If the which-way photon passes through the choosers without being reflected, its impact point at the top or bottom of the which-way screen tells us which slit the original photon passed through.
But if the which-way photon is reflected by the choosers then, regardless of the starting slit, the photon will show up in each erased case near the center of the screen half of the time.
This 50/50 split common to both slits is how the which-way information is "erased".

    *(Side note: I think using controllable mirrors instead of beam splitters would impove the experiment, because using a beam splitter is a bit like making both choices instead of one choice.)*

3. **Recovery**:
By grouping runs of the experiment by where the which-way photon hit the which-way screen, we find some interesting patterns.
When you look at what is built up on the screen by photons only from a single group, different patterns emerge.
The top and bottom case groups show nothing interesting happening, but the erased case groups filter the apparent lack-of-interference pattern into two complementary interference patterns!

Here is a diagram (tweaked from one on wikipedia) summarizing what you would see on the interference screen if you ran this experiment, and also the implied pattern within each group (which you can recover only by filtering afterwards):

<img src="/assets/{{ loc }}/dcqe-photon-graph.png" title="Resulting interference patterns"/>

The crucial thing to notice about the above diagram is you always *always* see no interference pattern.
The interference patterns are hidden, even in the erased cases.
We need the apparently-useless which-way information to find them.
This happens because the two sub interference patterns complement each other: when you add them together, the ripples disappear.

Now you know how to answer someone who thinks DCQE can perform FTL communication "because Bob only sees an interference pattern if Alice erases the which-way information".
The answer is that even when Alice erases the which-way information, Bob doesn't see an interference pattern.
It's only when Alice and Bob get back together and compare notes, grouping Bob's results based on Alice's erasure measurement outcomes, that the hidden interference patterns can be revealed.

That's all I really have to say about the optical experiment.
Let's try to simplify things a bit, and see that this isn't nearly as weird as it seems.

# A Simplified Model

Performing DCQE does not inherently require light, and in my opinion thinking about it optically drags many unnecessary details along as baggage.
DCQE is fundamentally not about photons, it is about quantum information and the odd things that happen when you try to copy it.
As such, we should really be thinking in terms of *qubits* instead of in terms of photons.
So let's translate this optical experiment into a quantum logic circuit operating on qubits.

In the optical experiment, a photon is placed into a superposition of going through the left slit or the right slit.
This can be represented by a qubit: we'll call the qubit $A$, use $A = \ket{0}$ to mean "went through the left slit", and $A = \ket{1}$ to mean "went through the right slit".
Easy.
Just after passing through the slits, the photon's position is in the state $A = \frac{1}{\sqrt{2}} \ket{0} + \frac{1}{\sqrt{2}} \ket{1}$.

Now the photon gets [SPDC](https://en.wikipedia.org/wiki/Spontaneous_parametric_down-conversion)'d into two photons with the same position.
Call the second photon $B$.
We're now in the state $AB = \frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$.
(In other words, the positions form an [EPR pair](https://en.wikipedia.org/wiki/Bell_state).)

Now we get to the interference pattern.
Different parts of the screen are different distances away from each slit, which causes constructive and destructive interference as the resulting relative phases vary.
With qubits we will emulate this effect by rotating various amounts around the X axis.
If doing so varies how often we measure the qubit to be ON, we'll call that an interference pattern.
If instead the chance-of-ON stays constant, we'll call that a lack-of-interference pattern.

After Alice does here X-rotation experiment on the $A$ qubit, Bob gets to perform the erasure (or not).
Actually, it makes a bit more sense to think of Bob as performing a *reveal* (or not).
Bob can either measure along the same axis that Alice measured, or along a perpendicular axis.
If he measures along the same axis, he learns information about what she measured.
We then group Alice's measurements based on Bob's results, and see if *now* the X-rotation varies.

Here's what happens when Bob measures along the same axis as Alice, revealing information:

<img src="/assets/{{ loc }}/cycle-revealed.gif" title="Revealing an EPR pair's value"/>

Our results correspond well with the optical experiment.
Initially Alice can't see an interference pattern (the chance stays at a constant 50%), but when we group her results based on Bob's measurements we see complementary interference patterns (the chance is going up and down).

What happens when Bob doesn't reveal the right information (i.e. "erases" the information)?
Exactly what you'd expect:

<img src="/assets/{{ loc }}/cycle-erased.gif" title="Erasing an EPR pair's entanglement"/>

Because Bob's results are no longer correlated with Alice's, grouping based on them doesn't give any predictive power.
The conditional probabilities stick to 50%, even as the qubit is rotated around the X axis.

Notice that at no point have I mentioned retrocausal effects or consciousnes in my explanation of what's happening.
Technically we don't even *need* quantum effects: it's not like we're being forced to pass Bell tests or anything.

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