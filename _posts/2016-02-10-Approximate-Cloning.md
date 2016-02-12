---
layout: post
title: "Approximate Cloning"
date: 2016-02-10 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Quantum mechanics is a fertile source of apparent paradoxes; that's one of the things I like about it.
There's something very satisfying about being confused, thinking a bit longer, then not being confused anymore despite ending up with more questions.
With that in mind, let's talk about cloning qubits.

The [no-cloning theorem](https://en.wikipedia.org/wiki/No-cloning_theorem) says it's impossible to make independent copies of an unknown qubit.
But, if that's true, why can we *write down* the state of a qubit?
Why can we figure out the description of qubits being produced by unknown processes, and then produce qubits matching that description?
*Why doesn't [tomography](https://en.wikipedia.org/wiki/Quantum_tomography) count as a cloning procedure*?

This particular paradox doesn't require any deep insights to resolve.
The no-cloning theorem only forbids *perfect* clones, and tomography is making *approximate* clones.
But now we have an interesting question: just how good can a cloning process be?
Given a limited number of copies of a state, how well can we approximate it?

Fair warning: this post is unusually math-heavy.

[Optimal Cloning of Pure States](http://arxiv.org/abs/quant-ph/9804001) by R. F. Werner.

# Distinguishability and Trace Distance

Before I can talk about how well a cloning process approximates a desired state, I need to explain how we even determine if two quantum states are similar.

There are plenty of useful [distance measures between states](https://quantiki.org/wiki/distance-measures-between-states), but for our purposes we care about *distinguishability*.
If we're given $A$ half of the time, and $B$ half of the time, how often are we able to correctly determine which one we were given?
This is related to the [trace distance](https://en.wikipedia.org/wiki/Trace_distance) between two states.
In particular, the maximum probability of correctly distinguishing $A$ from $B$ is $p_{A,B} = \frac{1}{2} + \frac{1}{4} \text{Tr} \left| A - B \right|$.

When working with pure states, the trace distance simplifies into just a dot product.
That's because a pure state $\ket{v}$'s density matrix is $\ket{v}\bra{v}$.
So the trace-distance between a pure state $\ket{a}$ and a pure state $\ket{b}$ is:

$D(\ket{a}, \ket{b})$

$= \frac{1}{2} \text{Tr} \sqrt{(\ket{a}\bra{a} - \ket{b}\bra{b})^2}$

To make any cross-talk between $a$ and $b$ more obvious, we'll decompose $\ket{b}$ into $x \ket{a} + y \ket{c}$ where $x = \langle a \| b \rangle$ and $y = \sqrt{1 - x \overline{x} }$ and $c$ is perpendicular to $a$:

$= \frac{1}{2} \text{Tr} \sqrt{(\ket{a}\bra{a} - (x \ket{a} + y \ket{c})(\overline{x} \bra{a} + \overline{y} \bra{c}))^2}$

Now separate the terms inside the square, but notice that $\ket{a}\bra{a}$ is being multiplied by $1-x\overline{x}$ (which happens to be $y \overline{y}$):

$= \frac{1}{2} \text{Tr} \sqrt{(
y \overline{y} \ket{a}\bra{a}
 - y \overline{y} \ket{c} \bra{c}
 - x \overline{y} \ket{a}\bra{c}
 - \overline{x} y \ket{c}\bra{a}
)^2}$

Time to actually perform the squaring, which creates a crazy large intermediate state but simplifies down to this:

$= \frac{1}{2} \text{Tr} (\sqrt{y \overline{y}} \sqrt{
(y \overline{y} + x \overline{x}) \ket{a}\bra{a}
 + (y \overline{y} + \overline{x} x) \ket{c}\bra{c}
 + (x \overline{y} - x \overline{y}) \ket{a}\bra{c}
 + (\overline{x} y  - \overline{x} y) \ket{c}\bra{a}
})$

We know that $y \overline{y} + x \overline{x} = 1$, and of course $x \overline{y} - x \overline{y} = 0$, so we're left with two projectors.
Also pull the magnitude of $y$ out:

$= \frac{\|y\|}{2} \text{Tr} \sqrt{\ket{a}\bra{a} + \ket{c}\bra{c}}$

The square root of a sum of perpendicular projectors is just the same sum.
And the trace of a sum of perpendicular projectors is just the number of projectors.
So... two:

$= \frac{\|y\|}{2} 2$

Finally, cancel the 2s and expand $y$:

$= \sqrt{1 - \|\langle a \| b \rangle\|^2 }$

That's the maximum probability of an optimal distinguishing process being able to separate $a$ from $b$.
As their dot product's magnitude slides from 0 (perpendicular) to 1 (parallel), the probability gets lower and lower.

# Distinguishing Repeated Qubit States

Since we'll be making copies of qubits, it's worth asking: how hard is it to distinguish between two qubit states when we have many copies?
This will bound how accurate our cloning process can be, and also inform us of how easy it will be to distinguish bad clones from good clones.

So suppose we have a qubit the could be in one of two states, that differ by angle angle $\theta$.
The qubit is either in the state $A = \ket{0}$ or in the state $B = (\cos \theta) \ket{0} + (\sin \theta) \ket{1}$.

If we only have one copy of this qubit, we can distinguish between the two states with probability $D(A, B) = \sqrt{1 - \langle A \| B \rangle^2} = \sqrt{1 - \cos^2 \theta} = \sin \theta$.
If we have $n$ copies of the qubit, it gets easier to distinguish between the two states because we end up rausing the dot-product to the $n$'th power.
$D(A^{\otimes n}, B^{\otimes n}) = \sqrt{1 - \langle A^{\otimes n} \| B^{\otimes n} \rangle^2} = \sqrt{1 - \langle A \| B \rangle^{2n}} = \sqrt{1 - \cos^{2n} \theta}$.

Here is a contour plot of $\sqrt{1 - \cos^{2n} \theta}$, to give a qualitative idea of how it behaves:

<img src="/assets/{{ loc }}/angle-versus-multiplicity.png"/>

Based on the above plot it looks like increasing $n$ gives a lot of benefit at first, but then there are diminishing returns.
The contour lines do look vaguely hyperbolic, though.
I wonder how $n$ relates to $\theta$ when holding the level distinguishability constant?

Suppose we'll be given $n$ copies of a qubit, and want to hit a distinguishability probability of $p$.
How close can the two states be, angle-wise?
That is to say, we want to solve for $f$ in $\sqrt{1 - \cos^{2 n} f(n)} \approx p$.

$\sqrt{1 - \cos^{2 n} f(n)} \approx p$

$1 - \cos^{2 n} f(n) \approx p^2$

$\cos^{2 n} f(n) \approx 1 - p^2$

If $f(n)$ is small, which it should be if $n$ is large enough, then we can approximate $\cos x$ with $1 - \frac{1}{2} x^2$:

$(1 - f(n)^2/2)^{2n} \approx 1 - p^2$

Also based on $f(n)$ being small, we can use the approximation $(1+x)^y \approx 1 + yx$ for small $x$:

$1 - 2n f(n)^2/2 \approx 1 - p^2$

Some terms cancel:

$n f(n)^2 \approx p^2$

And now we solve:

$f(n) \approx \frac{p}{\sqrt{n}}$

Meaning that holding the product $\theta \cdot \sqrt{n}$ constant should keep us *roughly* on the same contour curve, at least for large $n$.
Basically, our angular accuracy doubles when we quadruple $n$.

That makes sense: the state space of qubits is the surface of the Bloch sphere, and doubling our angle-accuracy quadruples our angle-area-accuracy.
Distinguishing between $m$ sections of the Bloch sphere at a fixed level of reliability requires $\Theta (m)$ copies.

(If we could distinguish *more* sections than that, we could use quantum compression to send $\log m$ bits of information with fewer than $\log m$ qubits.
That would violate the [Holevo bound](https://en.wikipedia.org/wiki/Holevo's_theorem).)

# Example Method

Here's an example of the most naive approximate cloning method possible.
Suppose we know the input qubits will be of the form $\psi(\theta) = (\cos \theta) \ket{0} + (\sin \theta) \ket{1}$, with $0 < \theta < \pi/2$.
Then the most obvious possible thing we could do is just condition on all the qubits in the computational basis, and infer the input angle based on that.

Our input state is $\psi(\theta)^{\otimes n}$.
Our target state is $\psi(\theta}^{\otimes n + d}$.

We rewrite the input state into a binomial sum $\psi(\theta)^{\otimes n} = \sum\_{k=0}^{n} \left| {n \atop k} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta)$.
We introduce the qubits we will initialize $\sum\_{k=0}^{n} \left| {n \atop k} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \ket{0}^{\otimes d}$.
And we initialize them by producing the estimated angle $\theta\_k = \arccos(k/n)$.

$\psi_{produced}$

$= \sum\_{k=0}^{n} \left\| {n \atop k} \right\rangle (\cos \theta)^{n-k} \cdot (\sin \theta)^k \cdot \psi(\theta\_k)^{\otimes d}$

$= \sum_{k=0}^{n} \sum_{j=0}^{n} \left\| {n \atop k} \right\rangle \left\| {n \atop j} \right\rangle (\cos \theta)^{n-k} \cdot (\sin \theta)^k \cdot (\cos \theta_k)^{d-j} \cdot (\sin \theta_k)^j$

Now we compute the dot product against the target.
This *could* get hairy, except we know that the first $n$ qubits will be perfect matches and the next $d$ qubits will be off by $\theta - \theta\_k$ degrees.
So we're computing:

$\psi_{target}^* \cdot \psi_{produced}$

$= \left[ \sum\_{i=0}^{n+d} \left\langle {n+d \atop i} \right\| (\cos^{n+d-i} \theta) \cdot (\sin^i \theta) \right] \cdot \left[ \sum_{k=0}^{n} \sum_{j=0}^d \left\| {n \atop k} \right\rangle\left\| {d \atop j} \right\rangle (\cos \theta)^{n-k} \cdot (\sin \theta)^k \cdot (\cos \theta_k)^{d-j} \cdot (\sin \theta_k)^j \right]$

$= \sum_{i=0}^{n+d} \sum_{k=0}^{n} \sum_{j=0}^d \left\langle {n+d \atop i} \right\| \left\| {n \atop k} \right\rangle\left\| {d \atop j} \right\rangle \cdot (\cos \theta)^{2n+d-k-i} \cdot (\sin \theta)^{i+k} \cdot (\cos \theta_k)^{d-j} \cdot (\sin \theta_k)^j$

We know that $i = k+j$ and that the bra-ket is ${n \choose k} {d \choose j}$:

$= \sum_{k=0}^{n} \sum_{j=0}^d {n \choose k} {d \choose j} \cdot (\cos \theta)^{2n-2k+d-j} \cdot (\sin \theta)^{2k+j} \cdot (\cos \theta_k)^{d-j} \cdot (\sin \theta_k)^j$

Make it a bit more obvious that the binomial theorem applies:

$= \sum_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot \sum_{j=0}^d {d \choose j} (\sin \theta \sin \theta_k)^j \cdot (\cos \theta \cos \theta_k)^{d-j}$

Apply it:

$= \sum\_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot (\sin \theta \sin \theta\_k + \cos \theta \cos \theta\_k)^{d}$

Apply angle identity:

$= \sum\_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot (\cos (\theta - \theta\_k))^d$

So basically we've ended up with *almost* a binomial distribution, but the buckets are being skewed by the angle-error factors:

$= \text{Binomial}_{\theta, n} \cdot \left( \|\_{k=0}^n \cos^d (\theta - \arccos \frac{k}{n}) \right)$



gives you information about it, and you can get more accurate by measuring more copies of the qubit.
can use that information to make copies.


This times it's the [no-cloning theorem](https://en.wikipedia.org/wiki/No-cloning_theorem) versus .



On the other hand, quantum state tomography lets you characterize an unknown quantum state (i.e. infer the coefficients that define it).
Once you know the coefficients that define the state, you can use those numbers to make as many new instances of the state as you want.

So making independent copies is impossible, but here's a method for making independent copies.
What's going on?

# Distinguishing and Cloning

The goal of a cloning operation is to take an unknown state $\psi = a \ket{0} + b \ket{1}$ and expand it into the state $\psi^{\otimes 2} = (a \ket{0} + b \ket{1}) \otimes (a \ket{0} + b \ket{1}) = a^2 \ket{00} + ab (\ket{01} + \ket{10}) + b^2 \ket{11}$.
It's impossible to do because the coefficients in the output state ($a^2$, $ab$, and $b^2$) are not linear combinations of the coefficients in the input state (just $a$ and $b$), and all quantum operations are linear.

The same reasoning applies if we start with $n$ copies of $\psi$ and want to create one more.
The state $\psi^{\otimes n + 1}$ has coefficients that aren't linear combinations of the coefficients in $\psi^{\otimes n}$.
Even with a million examples to work with, creating a perfect clone is impossible.

But let's approach this from a different perspective.

The ease of distinguishing between two quantum states depends on how perpendicular they are to each other.
$\ket{0}$ is totally distinguishable from $\ket{1}$, but lines up a bit with $\frac{1}{\sqrt{2}} (\ket{0} - \ket{1})$.
So any procedure for separating $\ket{0}$ states from $\frac{1}{\sqrt{2}} (\ket{0} - \ket{1})$ must fail sometimes, but distinguishing $\ket{0}$ from $\ket{1}$ can always succeed.

Suppose we're trying to distinguish the state $\psi^{\otimes n}$ from a nearby state.
How well can we do that, relative to $n$?
Define $R\_n(x) = (\ket{0} \cos x + \ket{1} \sin x)^{\otimes n}$.
How close is $R\_n(0)$ to $R\_n(\theta)$ for a small $\theta$?

The inner product is:

$R\_n(0)^* \cdot R\_n(\theta)$

$= \bra{0}^{\otimes n} \cdot (\ket{0} \cos \theta + \ket{1} \sin \theta)^{\otimes n}$

$= (\bra{0} \cdot (\ket{0} \cos \theta + \ket{1} \sin \theta))^n$

$= (\cos \theta)^n$

For small $\theta$, we can approximate $\cos(\theta)$ with the first few terms of its taylor series:

$\approx \left(1 - \frac{\theta^2}{2} \right)^n$

You might notice that this equation looks a lot like this definition of $e^c$'s value: $\lim\_{n \rightarrow \infty} \left(1 + \frac{c}{n} \right)^n = e^c$
So, if we want to approach a target level of distinguishability $t$, we should make $\frac{\theta^2}{2}$ match $\frac{-\ln t}{n}$ constant as $n$ increases.
We should set $\theta = \sqrt{2 \frac{-\ln t}{n}}$ to get:

$R\_n(0)^* \cdot R\_n \left( \sqrt{2 \frac{-\ln t}{n}} \right)$

$\approx (1 - \frac{\sqrt{2 \frac{-\ln t}{n}}^2}{2})^n$

$= (1 - \frac{-\ln t}{n})^n$

$\approx t$ for large $n$

What this all means is that, as $n$ increases, we can reliably (but not perfectly) distinguish between $\theta$s that are $O(n^{-0.5})$ apart.
For example, if we want to distinguish between states 99% of the time and $n$ is set to a million then we should probably stick to states at least $\sqrt{2 \frac{-\ln 0.99}{1000000}} \approx 0.0005$ radians ($0.03$ degrees) apart.
Since $\theta$ scales like $\Theta(n^-0.5)$, to double our accuracy in $\theta$ we need to quadruple $n$; though it should be noted that the space of single-qubit states is a 2d surface, so angle-area wise we're scaling like $\frac{1}{n}$ as might make more sense.

This is another reason perfect cloning is impossible: larger states allow for more accuracy, but if we're starting with a smaller state then we don't have it.
Given $n$ qubits we can distinguish between $c n$ angle-area patches, but if we have to expand to $4n$ qubits then a checker can distinguish between twice as many.
If the checker knows the original state more accurately than we did, we have at least a 50% chance of being caught.

On the other hand, this gives us a clear path forward to *approximate* cloning: use clever measurements to distinguish between the various possibilities and then feed that estimate into some fixed gates.

# A Highly Simplified CLoning Process

Recall that $\ket{n \atop k}$ is defined to be the sum of all n-bit states where exactly k states are set.

$\ket{n \atop 0} = \ket{0}^{\otimes n}$, $\ket{n \atop n} = \ket{1}^{\otimes n}$, $\ket{n \atop k} = \ket{n-1 \atop k} \otimes \ket{0} + \ket{n \atop k-1} \otimes \ket{1}$.

For example, $\ket{5 \atop 2} = \ket{00011} + \ket{00101} + \ket{01001} + \ket{10001} + \ket{00110} + \ket{01010} + \ket{10010} + \ket{01100} + \ket{10100} + \ket{11000}$.

Anyways,

$\psi\_{\text{target}} = \sum\_{l=0}^{n+d} \ket{n+d \atop l} \cos^{n+d-l} \theta \sin^l \theta$

$\psi\_{\text{made}} = \sum\_{k=0}^{n} \ket{n \atop k} \cos^{n-k} \theta \sin^k \theta \parens{\sum\_{j=0}^{d} \ket{d \atop j} \cos^{d-j} \frac{k \pi}{2 n} \sin^j \frac{k \pi}{2 n}}$

$\psi\_{\text{target}}^* \cdot \psi\_{\text{made}}$

$= \bracket{\sum\_{l=0}^{n+d} \bra{n+d \atop l} \cos^{n+d-l} \theta \sin^l \theta}
\cdot \bracket{\sum\_{k=0}^{n} \ket{n \atop k} \cos^{n-k} \theta \sin^k \theta \parens{\sum\_{j=0}^{d} \ket{d \atop j} \cos^{d-j} \frac{k \pi}{2 n} \sin^j \frac{k \pi}{2 n}}}$

Pull sums out and combine powers:

$= \sum\_{l=0}^{n+d} \sum\_{k=0}^{n} \sum\_{j=0}^{d} \bra{n+d \atop l} \ket{n \atop k} \ket{d \atop j} (\cos^{2n+d-l-k} \theta) (\sin^{k+l} \theta) (\cos^{d-j} \frac{k \pi}{2 n}) (\sin^j \frac{k \pi}{2 n})$

Note that $l$ must equal $k+j$ for the bra to match the kets:

$= \sum\_{k=0}^{n} \sum\_{j=0}^{d} \bra{n+d \atop k+j} \ket{n \atop k} \ket{d \atop j} (\cos^{2n+d-2k-j} \theta) (\sin^{2k+j} \theta) (\cos^{d-j} \frac{k \pi}{2 n}) (\sin^j \frac{k \pi}{2 n})$

The kets always match exactly one bra, and no more, so they exactly determine the count:

$= \sum\_{k=0}^{n} \sum\_{j=0}^{d} {n \choose k}{d \choose j} (\cos^{2n+d-2k-j} \theta) (\sin^{2k+j} \theta) (\cos^{d-j} \frac{k \pi}{2 n}) (\sin^j \frac{k \pi}{2 n})$

Push the $j$ sum and terms inward:

$= \sum\_{k=0}^{n} {n \choose k} (\cos^{2n-2k} \theta) (\sin^{2k} \theta)  \parens{\sum\_{j=0}^{d} {d \choose j} \bracket{(\cos \theta) (\cos \frac{k \pi}{2 n})}^{d-j} \bracket{(\sin \frac{k \pi}{2 n}) (\sin \theta)}^j }$

Undo binomial distribution over $d$ with $j$:

$= \sum\_{k=0}^{n} {n \choose k} (\cos^{2n-2k} \theta) (\sin^{2k} \theta)  \bracket{(\cos \theta) (\cos \frac{k \pi}{2 n}) + (\sin \frac{k \pi}{2 n}) (\sin \theta)}^d$

Trig identity:

$= \sum\_{k=0}^{n} {n \choose k} (\cos^{2n-2k} \theta) (\sin^{2k} \theta)  (\cos^d \parens{\theta - \frac{k \pi}{2 n}})$

We're summing a skewed binomial distribution:

$= \bracket{\text{Binom}(p = \sin^2 \theta, n)} \cdot \bracket{\cos^d \parens{\theta - \frac{k \pi}{2 n}}}\_k$

When $\frac{\pi k}{2 n}$ is far from $\theta$, we get almost no contribution. When it's close we can approximate with $1 - \parens{\theta - \frac{\pi k}{2 n}}^2$.

$\approx \bracket{\mathcal{N}(\mu = n \sin^2 \theta, \sigma = \sqrt{n} (\sin \theta) (\cos \theta))} \cdot \bracket{\cos^d \parens{\theta - \frac{k \pi}{2 n}}}\_k$

$= \bracket{\frac{1}{\sqrt{n \tau} (\sin \theta) (\cos \theta)} e^{-\frac{(k - n \sin^2 \theta)^2}{2 n (\sin^2 \theta) (\cos^2 \theta)}}}\_k \cdot \bracket{\cos^d \parens{\theta - \frac{k \pi}{2 n}}}\_k$



# Bler



and  if you give me a bunch of copies of the same state, I can [figure out which state you're giving me](https://en.wikipedia.org/wiki/Quantum_tomography) and then start making new instances of it for myself.
But shouldn't this be forbidden by the [no-cloning theorem](https://en.wikipedia.org/wiki/No-cloning_theorem)?
It's supposed to be impossible to create new instances of an unknown state!


given that it's impossible clone quantum states, tomography possible?

The [no cloning theorem](https://en.wikipedia.org/wiki/No-cloning_theorem) says you can't make independent copies of (unknown) quantum states.
There is no unitary operation $U$ such that $U \cdot \ket{\psi} \otimes \ket{0} = \ket{psi} \otimes \ket{psi}$.

On the other hand, [quantum state tomography](https://en.wikipedia.org/wiki/Quantum_tomography) is possible.
If someone keeps giving us copies of a state, we can gradually figure out what they're sending and start making our own copies.

Why aren't these two things in conclict?

In other words, you can't make independent copies of unknown quantum states. it is impossible to

The no cloning theorem guarantees that, given a qubit, you can't create a duplicate.
No operation performs A0 -> AA.

A proof is quite simple: the state AA has a parameter \alpha^2 and \beta^2, but the input doesn't.
They can't be made from linear combinations of \alpha and \beta and 1, therefore impossible.

Apparently you can also show that AA0 -> AAA is impossible?

If we know the state we can make copies.

Quantum state tomography lets us learn the state.

We need lots of copies. A0 -> AA is impossible, and AA0 -> AAA may be impossible, but A^n0 -> A^{n+1} must be somehow getting easier...?

However, quantum state tomography is a thing.
Given enough copies of a qubit, we can approximate the state and start making copies.
What's happening?
Is this a contradiction?

Consider that the transform from A^n0 -> A^{n+1}0 has all of the coefficients needed, except for \alpha^{n+1} and bla.
Furthermore, consider that \alpha^{n+1} is probably quite close to zero or to one.
So if we just ignore it, we'll be *quite close*. Our approximation can get better.

Another way to think about this is to consider how orthogonal the input states are to each other.
If they differ by theta degrees they're off by... cos(theta)^n...? And that goes to 0... square-root-ish-ly? as n increases.
Therefore we can distinguish smaller and smaller thetas more and more reliably.


How does this interact with error correction?
Is the encoded state copied more accurately by copying the outlying qubits at a fixed fidelity?

Does the super-exponential volume of the n-qubit hypersphere destroy any savings on larger states?

----

Now I want to point out an exception to this rule that more copies helps you approximate: entanglement.

Suppose you have an EPR half from the state {00} + {11}.

No matter what you do, you get a 50/50 result.

If the entanglement axis is unknown you can guess at it and then use cancellation... if all the results start coming out the same, you fucked up.

But if you know the entanglement it still doesn't work. You either measure something useless, or something that destroys the entanglement.

Maybe you can make copies under superposition?

What do copies even look like? We can't have independent copies of the other EPR pair half, that violates monogamy of entanglement.

Any procedure that actually worked LOCC-aly would open quantum bandwidth and be impossible.

You can know it's in an entangled state, but that doesn't help you make more entangled ones.
You can make more mixed ones, but they won't be usable as a fuel for teleportation.
















