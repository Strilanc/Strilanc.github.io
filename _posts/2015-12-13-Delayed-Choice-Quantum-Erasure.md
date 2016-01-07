---
layout: post
title: "Delayed Choice Quantum Erasure"
date: 2015-11-29 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

The [Delayed Choice Quantum Eraser](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser) is a widely misunderstood experiment.
Apparently the common belief is that it's some kind of grand world-view-shattering mystery, with powers ranging from sending messages backwards in time ([example pop-science article](http://www.ibtimes.co.uk/quantum-weirdness-proved-again-measurement-changing-atoms-past-1504172)) to demonstrating the existence of conscious knowledge ([example woo thread](http://www.abovetopsecret.com/forum/thread1013362/pg1)).
Although there's [continuous](http://jamesowenweatherall.com/SCPPRG/EllermanDavid2012Man_QuantumEraser2.pdf) [effort](http://van.physics.illinois.edu/qa/listing.php?id=25872) [to](http://www.scientificamerican.com/article/quantum-eraser-delayed-choice-experiments/) [correct](https://www.physicsforums.com/threads/explain-delayed-choice-quantum-eraser-without-consciousness.808688/) these misconceptions, it's easy to run into them.

Case in point: I googled for "delayed choice quantum eraser" videos.
The top result?
[This youtube video](https://www.youtube.com/watch?v=U7Z_TIw9InA).
It mashes a scene from the infamous [What the #$*! Do We (K)now!?](http://www.imdb.com/title/tt0399877/) film into a scene from [a terrible episode of "The Universe"](http://www.imdb.com/title/tt2356685/).
Both clips mention backwards-in-time effects, and imply collapse is caused by humans looking in the general direction of an experiment.
The forehead-slapping climaxes when a graphic *literally* shows [a person turning waves into particles by opening their eyes](https://youtu.be/vnN85i_75EI?t=18m16s) (argh!).


Delayed choice erasure (hereafter DCQE) may be counter-intuitive, it may be *interesting*, but it's not *mysterious* or *magical*.
We understand the math behind how it works.
Interpretations of quantum mechanics explain it without any reference to consciousness or backwards-in-time effects.

In this post, my goal is to add to the pile of "DCQE is not magical" effort in some small way.
I'll explain what you'd actually see if you ran a DCQE, show the same effects in a simplified model using qubits instead of photons, and hopefully convince that the common misconceptions are in fact misconceptions.

# The Experiment

The DCQE experiment is like a typical [double-split experiment](https://en.wikipedia.org/wiki/Double-slit_experiment), except that an entangled copy of the which-slit-did-the-photon-go-through information is made.
By later measuring the entangled copy of the information, you can find some hidden interference patterns.
The framing is that, by choosing to recover or discard the relevant information, you choose whether there was "really" an interference pattern or not.

[**Non**-delayed quantum eraser experiments](https://en.wikipedia.org/wiki/Quantum_eraser_experiment) have a convenient place to store the which-sli information: in the photon's own polarization.
That works great, except that a photon's polarization tends to be measured or unrecoverable when the photon is absorbed.
Allowing the which-way information to be measured *later*, long after the photon was absorbed, requires a different storage location.

The best known DCQE experiment is [the one performed by Kim et al in 2000](https://en.wikipedia.org/wiki/Delayed_choice_quantum_eraser#The_experiment_of_Kim_et_al._.282000.29).
They store the which-way information into the position a second photon (by using a [special crystal that splits photons into two photons](https://en.wikipedia.org/wiki/Spontaneous_parametric_down-conversion)).
Wikipedia has a complicated diagram of [the optical circuit they used](https://en.wikipedia.org/wiki/File:Kim_EtAl_Quantum_Eraser.svg), but I won't subject you to that.
Instead, taking a a few liberties and some inspiration from [one of the sites Wikipedia linked to](http://strangepaths.com/the-quantum-eraser-experiment/2007/03/20/en/), I made this alternative diagram of Kim et al's setup:

<img src="/assets/{{ loc }}/dcqe-photon-diagram.png" title="Over-simplified experimental setup diagram"/>

Be aware that the diagram is over-simplified.
For example, the actual experiment has various lenses and prisms to direct the photons.
Also, Kim et al didn't use screens; they used detectors connected to an electronic counter.

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

    Because both the top slit and bottom slit create a 50/50 split between the two erased cases (when erased), the which-way information is lost.
    It cannot be recovered.

    *(Side note: I think using controllable mirrors instead of beam splitters would impove the experiment, because using a beam splitter is a bit like making both choices instead of one choice.)*

3. **Recovery**:
Grouping runs of the experiment into "where the which-way photon hit" buckets reveals some interesting patterns.
Within the bucket of test photons whose which-way photon went to the top case, no interference pattern is revealed.
The same happens for the bottom case bucket.
But the erased-case buckets filter the apparent lack-of-interference pattern we saw into two complementary interference patterns!

Here is a diagram (tweaked from one on wikipedia) summarizing what you would see on the interference screen if you ran this experiment, and also the implied pattern within each group (which you can recover only by filtering afterwards):

<img src="/assets/{{ loc }}/dcqe-photon-graph.png" title="Resulting interference patterns"/>

One crucial thing to notice about the above diagram is that you always see the same thing: a lack-of-interference pattern.
You never *directly* see an interference pattern.
The interference patterns are hidden, even in the erased cases.
To find the missing interference patterns, you need the apparently-useless which-way erased-case information.
This happens because the two erased cases have complementary interference patterns: when you fail to separate them they get added together, and the ripples disappear.

*(Side note: Technically,  in Kim et al's setup, finding the "erased" or "revealed" subsets as shown in the diagram's 'What you see' column would also require filtering.
That's because Kim et al use beam splitters instead of controllable mirrors to do the choosing.
They can't control which choice was made; they have to deduce which choice happened based on where the which-way photon landed.
However, because the erased and revealed plots look exactly the same as the total plot, you're not missing out on much.)*

The 'What you can see' column of the diagram is my answer to anyone who thinks DCQE can perform FTL communication "because Bob sees an interference pattern as soon as Alice erases the which-way information".
Even when Alice erases the which-way information, Bob doesn't see an interference pattern.
It's only when Alice and Bob get back together and compare notes, grouping Bob's results based on Alice's erasure measurement outcomes, that the hidden interference patterns can be revealed.

That's all I really have to say about the optical experiment.
Let's try to simplify things a bit.

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
The SPDC puts us into the state $AB = \frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$.
In other words, the positions of the two photons form an [EPR pair](https://en.wikipedia.org/wiki/Bell_state).

The appearance of an interference pattern (or lack thereof) can also be translated from photons to qubits.
The relevant common property is [coherence](https://en.wikipedia.org/wiki/Coherence_%28physics%29#Quantum_coherence).
When a photon is coherent, it can interfere with itself.
A decohered photon won't interfere with itself.
So we can think of DCQE as playing with whether or not a photon was coherent.

When a qubit is coherent, it has a "preferred direction" corresponding to a point on the surface of the [Bloch sphere](https://en.wikipedia.org/wiki/Bloch_sphere).
An experiment where you prepare a coherent qubit, then measure along the preferred direction, will give the same answer every time.
A fully decohered qubit has no preferred direction; its state corresponds to the center of the Bloch sphere.
No matter which axis you measure a fully decohered qubit along, your results will look like coin flips.

It so happens that, because entanglement is *suspiciously similarly* to measurement, qubits in an EPR pair appear to be fully decohered.
It's only when you later compare results that you see they were coherent as a pair, instead of individually.
We'll use this as our analogue for DCQE.

More concretely, we're translating "is there an interference pattern?" into "does measuring the position qubit along different axes give different probabilities?".
We will run the qubit experiment many times, rotate Alice's qubit ($A$) by various amounts around the X axis, and see if the chance of getting ON when measuring $A$ in the computational basis stays at 50% or not.
Because $A$ is part of an EPR pair, it will in fact stay at 50% and we will "conclude" that it is decohered.

After "confirming" that $A$ is decohered, we will measure Bob's qubit ($B$).
We'll group our measurements of $A$ into a $B$-was-OFF bucket and a $B$-was-ON bucket, and see if we can find some hidden coherence.
Two cases will be considered: one where Bob measures along the same axis as Alice, and one where Bob measures along a perpendicular axis.

Here's what happens when Bob measures along the same axis as Alice:

<img src="/assets/{{ loc }}/cycle-revealed.gif" title="Revealing an EPR pair's value"/>

As you can see above, initially Alice concludes that the qubit is decohered (i.e. she "doesn't see an interference pattern") because the measurement acts like a 50/50 coin flip.
However, because Bob is measuring along the same axis as Alice and $A$ and $B$ form an EPR pair, his results are correlated with hers.
So, when we group $A$ based on Bob's results, we don't see a 50/50 split anymore.
So Alice concludes her qubit was secretly coherent (i.e. she "sees the hidden interference pattern").

Now for the "erased" case, where Bob measures along a perpendicular axis:

<img src="/assets/{{ loc }}/cycle-erased.gif" title="Erasing an EPR pair's entanglement"/>

Bob's results are no longer correlated with Alice's, so grouping based on them doesn't give any predictive power.
Alice concludes that her qubit was "really truly decohered".

You might have noticed I used a lot of "air-quotes" in this section.
That's because basically all of the conclusions are misleading.
They're a result of trying to force "$A$ and $B$ are entangled" into a false dichotomy between "$A$ was secretly coherent" and "$A$ was truly decohered".
That's simply the *wrong way to think about it*.

Misconception-causing explanations of DCQE have the exact same problem, except instead of talking about coherent-vs-decoherent dicohotomy they talk about a took-one-path vs took-both-paths dicohotomy.
They play framing games with conditional prbability, and end with technically-correct-but-misleading statements like "IF you think the photon must have either taking one path or else taken both paths, THEN you need backwards in time effects.".
The actual explanation is to drop the false dichotomy, to learn how entanglement works instead of using wrong analogies.

# Summary

1.
**You never *see* an interference pattern**.
The interference pattern only shows up when filtering after-the-fact, using the chooser's measurement results to group experimental runs.

2.
**Backwards-in-time effects aren't needed**.
Unless you try to enforce a false dichotomy about how the photon propagated.
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