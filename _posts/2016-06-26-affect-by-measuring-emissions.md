---
layout: post
title: "[Un]popular Qubits #4: Affecting Atoms by Looking at Emitted Light"
date: 2016-06-26 12:10:10 pm EST
permalink: post/1618
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

In April, ["Mapping quantum state dynamics in spontaneous emission" by M. Naghiloo1 et al](http://www.nature.com/ncomms/2016/160511/ncomms11527/full/ncomms11527.html) was published in Nature Communications.
The paper didn't get much [coverage](http://thescienceexplorer.com/universe/quantum-entanglement-could-be-used-control-atoms-emit-light), but the authors released a [YouTube video about the paper, titled "How we look at light can affect the atom that emits it"](https://www.youtube.com/watch?v=mTxbHiAPSlA):

<iframe width="560" height="315" src="https://www.youtube.com/embed/mTxbHiAPSlA" frameborder="0" allowfullscreen></iframe>

That sounds pretty mind-blowing, but by the end of this post you might have a different opinion.

# Two Circuits

My method for understanding papers basically amounts to translating the experiments they describe into analogous quantum logic circuits, then just thinking about those circuits.
So, instead of talking directly about the paper, I'm going to talk about a couple circuits.

In these circuits, we have a qubit $A$ that starts in the state $\ket 0 + \ket 1$.
Then we keep introducing fresh work qubits in the $\ket 0$ state, performing a small rotation controlled by $A$, and measuring the result:

<img style="max-width:100%; max-height: 275px;" src="/assets/{{ loc }}/rotate-repeat.png"/>

We use the measurement results to infer the state of $A$.

Surprisingly, this process plays out in qualitatively different ways depending on how you go about measuring.

**Z axis**

Let's start by just measuring in the computational basis, i.e. along the Z axis, as shown in the previous diagram.
For flavor, we also imagine our quantucm computer is setup so that any On measurement will produce an audible *CLICK!*.

We run the circuit.
What happens?

The qubit $A$ starts in a superposition of On and Off, and that continues to be true for as long as you wait without hearing a click.
But the conditional rotation creates an asymmetry between the $A$-is-Off case and the $A$-is-On case: if $A$ is Off, the conditional rotation doesn't happen.
Without any rotation, the work qubit would stay Off and so the measurement result would also have to be Off.
But if $A$ is On (or partially On) then, every once in awhile... *CLICK!* and now you know for sure that $A$ is guaranteed 100% On.

In other words, when our measurements keep happening along the Z axis, $A$ behaves like it has a half-life.
We can explore this behavior in Quirk by displaying some measurement chances and conditional states:

<a href="http://algorithmicassertions.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22Bloch%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%5E%E2%85%9F%E2%82%81%E2%82%86%22%5D%2C%5B1%2C%22Measure%22%5D%2C%5B1%2C%22Chance%22%5D%2C%5B%22Bloch%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C%22X%5E%E2%85%9F%E2%82%81%E2%82%86%22%5D%2C%5B1%2C1%2C%22Measure%22%5D%2C%5B1%2C1%2C%22Chance%22%5D%2C%5B%22Bloch%22%2C%22%E2%80%A2%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%80%A2%22%2C%22%E2%97%A6%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C%22X%5E%E2%85%9F%E2%82%81%E2%82%86%22%5D%2C%5B1%2C1%2C1%2C%22Measure%22%5D%2C%5B1%2C1%2C1%2C%22Chance%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%5D%2C%5B%22%E2%80%A6%22%2C%22%E2%80%A6%22%2C%22%E2%80%A6%22%2C%22%E2%80%A6%22%2C%22%E2%80%A6%22%5D%5D%7D">
  <img style="max-width:100%; max-height: 275px;" src="/assets/{{ loc }}/measure-Z.png"/>
</a>

Notice how anytime a state indicator has a black "is On" control, the state is straight up (i.e. $\ket 1$), whereas the only-white-control "all Off" cases are essentially identicaly to the starting state.
Also notice the chance-of-On staying pretty consistent.
This circuit's measurements really do imply that $A$ is behaving as if its state has a half-life.

**Other axis**

Now lets try measuring along a different axis, by rotating the qubit a bit before the computation-basis measurement.
When we do that, we see very different conditional states:

<a href="http://algorithmicassertions.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22Bloch%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%5E%E2%85%9B%22%5D%2C%5B1%2C%22Y%5E%E2%85%93%22%5D%2C%5B1%2C%22Measure%22%5D%2C%5B1%2C%22Chance%22%5D%2C%5B%22Bloch%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C%22X%5E%E2%85%9B%22%5D%2C%5B1%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B1%2C1%2C%22Measure%22%5D%2C%5B1%2C1%2C%22Chance%22%5D%2C%5B%22Bloch%22%2C%22%E2%80%A2%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%80%A2%22%2C%22%E2%97%A6%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C%22X%5E%E2%85%9B%22%5D%2C%5B1%2C1%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B1%2C1%2C1%2C%22Measure%22%5D%2C%5B1%2C1%2C1%2C%22Chance%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%2C%22%E2%80%A2%22%5D%2C%5B%22Bloch%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%2C%22%E2%97%A6%22%5D%2C%5B%22%E2%80%A6%22%2C%22%E2%80%A6%22%2C%22%E2%80%A6%22%2C%22%E2%80%A6%22%2C%22%E2%80%A6%22%5D%5D%7D">
  <img style="max-width:100%; max-height: 275px;" src="/assets/{{ loc }}/measure-diag.png"/>
</a>

Instead of jumping to 'all on all the time' as soon as any measurement returns On, $A$ is only being perturbed a little bit by each outcome.
(I had to make the conditional rotations a big stronger for it to be visible.)

If you analyze the behavior more closely, as I did in ['Eve's quantum clone computer'](/2016/04/24/eves-quantum-clone-computer.html), you find that the qubit is actually performing a random walk!
Instead of waiting for a solitary click that tells you everything, you'll be hearing a stream of *CLI-CLI-CLICK! CLI-CLICK! CLICK! ... CLICK! CLI-CLI-CLI-CLI-CLICK!* where each click, or pause, tells you the direction of a small step the qubit took.

# Interpretation

Clearly the measurement we choose to make changes the experience quite drastically.
In one case we're patiently waiting for a single click that reveals all.
In the other case, we're hearing a stream of clicks that together slowly build up to the full story.
But what does this all mean?
And is it useful?

The authors end their video with the following claim:

> "This gives us a way to control the atom by the way that we look at the light."

That's actually not quite right.

Up until now, I've been showing conditional states in the circuit diagrams.
But what does the qubit's *unconditional* state, i.e. what we can expect before even starting the experiment, look like?

Well, when measuring along the Z axis, the qubit kinda rotates slowly while decaying towards the center:

<a href="http://algorithmicassertions.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A6%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A6%22%5D%5D%7D">
  <img style="max-width:100%; max-height: 275px;" src="/assets/{{ loc }}/unconditional-decay-1.png"/>
</a>

And, when measuring along another axis, the qubit... kinda rotates slowly while decaying towards the center...:

<a href="http://algorithmicassertions.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C%22Y%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C%22X%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C1%2C1%2C%22Y%5E%E2%85%93%22%5D%2C%5B%22Bloch%22%2C1%2C1%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B%22%E2%80%A6%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A6%22%5D%5D%7D">
  <img style="max-width:100%; max-height: 275px;" src="/assets/{{ loc }}/unconditional-decay-2.png"/>
</a>

The above diagrams show that the qubit evolves in the same way, regardless of which measurements we plan to make.
This demonstrates that changing the axis doesn't give us any control.
(Though that was obvious from the start, since otherwise we could easily violate the no-communication theorem.)

What's actually happening during these experiments is that we're *learning different information about the qubit as we go*.
Although the unconditional expected-ahead-of-time states don't depend on the measurement choices, the conditional informed-by-measurement states differ by quite a lot.
We're not deciding what happens, but we are finding out what happened.

So the authors are wrong when they say we've found a way to control the atom by looking at the light differently.
A corrected quote would be... "This gives us a way to *find out if the atom is in the state we want* by the way that we look at the light".
Which... sounds quite a lot more mundane, doesn't it?

Still, it's very interesting that the experience changes so much when measuring different axes.

Ultimately, I think that the phenomena described by the paper is just an interesting example of how you learn different things by measuring different things.
There's no control, at least not in the literal sense of the word.

(*That being said, I feel uncomfortable bluntly leaving things at "there's no control".
It has the wrong connotations, and probably some people will disagree about the shades of meaning.
The thing we are doing would require control if this was a classical system.
This is yet another example of entanglement riding the line beween "I can predict that!" and "I can control that!" in a way that's hard to summarize.*)

# Summary

How you measure entangled information about a qubit qualitatively changes the feel of the inference process.
Sometimes it behaves like spontaneous decay, other times like a random walk.

Despite the surprisingly different behaviors, we're not actually controlling the qubit.
We're just revealing things about it at different rates.
