---
layout: post
title: "Approximate Cloning"
date: 2016-04-08 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove\_first: '\_posts/' | remove: '.md' %}

Quantum mechanics is a fertile source of apparent paradoxes; that's one of the things I like about it.
There's something very satisfying about being confused, thinking a bit longer, then not being confused anymore despite ending up with more questions.
With that in mind, let's talk about cloning qubits.

The [no-cloning theorem](https://en.wikipedia.org/wiki/No-cloning\_theorem) says it's impossible to make independent copies of an unknown qubit.
But, if that's true, why can we *write down* the state of a qubit?
Why can we figure out the description of qubits being produced by unknown processes, and then produce qubits matching that description?
*Why doesn't [tomography](https://en.wikipedia.org/wiki/Quantum\_tomography) count as a cloning procedure*?

This particular paradox doesn't require any deep insights to resolve.
The no-cloning theorem only forbids *perfect* clones, and tomography is making *approximate* clones.
But now we have an interesting question: just how good can a cloning process be?
Given a limited number of copies of a state, how well can we approximate it?

Fair warning: this post is unusually math-heavy.

# Distinguishability

Before I can talk about how well a cloning process approximates a desired state, I need to explain how we even determine if two quantum states are similar.

There are plenty of useful [distance measures between states](https://quantiki.org/wiki/distance-measures-between-states), but for our purposes we care about *distinguishability*.
If we're given $A$ half of the time, and $B$ half of the time, how often are we able to correctly determine which one we were given?
Given the [density matrices](https://en.wikipedia.org/wiki/Density\_matrix) representing $A$ and $B$, the maximum probability of correctly distinguishing $A$ from $B$ is related to the [trace distance](https://en.wikipedia.org/wiki/Trace\_distance) between the two matrices:

$$p\_{A,B} = \frac{1}{2} + \frac{1}{4} \text{Tr} \left| A - B \right|$$

You get a base-rate of 50% for free just by guessing, but the rest depends on how the eigendecomposition of the difference between the two states plays out (because the trace is adding up the magnitudes of all the eigenvalues).

When working with pure states, the distinguishability is much easier to compute. If $A = \ket{a}\bra{a}$ and $B = \ket{b}\bra{b}$, then all you need is their dot product's magnitude:

$$p\_{\ket{a}\bra{a}, \ket{b}\bra{b}} = \frac{1}{2} + \frac{1}{2} \sqrt{1 - |\langle a | b \rangle|^2 }$$

Because the dot product of two unit vectors is the cosine of the angle between them, knowing the angle $\theta$ between two states gives a particularly easy computation:

$$p\_\theta = \frac{1}{2} + \frac{1}{2} \sin \theta$$

Now let's consider how repetition affects these definitions.

# Distinguishing Repeated Qubits

Since we'll be making copies of qubits, it's worth asking: how hard is it to distinguish between two qubit states when we're given many independent copies of the state?
This will bound how accurate our cloning process can be, and also inform us of how easy it will be to distinguish bad clones from good clones.

So suppose we have a qubit that could be in one of two states, and that the two states differ by an angle of $\theta$.
The qubit is either in the state $a = \ket{0}$ or in the state $b = (\cos \theta) \ket{0} + (\sin \theta) \ket{1}$.

If we only have one copy of this qubit, we can distinguish between the two states with probability $p\_{a, b} = \frac{1}{2} + \frac{1}{2} \sqrt{1 - \langle a \| b \rangle^2} = \frac{1}{2} + \frac{1}{2} \sin \theta$.
But if we have $n$ copies of the qubit we end up rausing the dot-product to the $n$'th power, and our distinguishability improves:

$$\begin{align}
  p\_{a^{\otimes n}, b^{\otimes n}}
  &= \frac{1}{2} + \frac{1}{2} \sqrt{1 - \langle a^{\otimes n} \| b^{\otimes n} \rangle^2}
  \\\\&= \frac{1}{2} + \frac{1}{2} \sqrt{1 - \langle a \| b \rangle^{2n}}
  \\\\&= \frac{1}{2} + \frac{1}{2} \sqrt{1 - \cos^{2n} \theta}
\end{align}$$

To give a qualitative idea of how the distinguishability of repeated qubit states behaves, here's a contour plot of $\frac{1}{2} + \frac{1}{2} \sqrt{1 - \cos^{2n} \theta}$:

<img src="/assets/{{ loc }}/distinguishability-repeated.png"/>

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

Okay, ignoring the fact that this result completely destroys the justification for the $(1+x)^y \approx 1 + yx$ approximation, it looks like holding the product $\theta \cdot \sqrt{n}$ constant should keep the distinguishability *roughly* constant.
But since we used some suspect arguments to get this relationship, let's check it by transforming the axes of our contour plot and see if straight lines pop out:

<img src="/assets/{{ loc }}/distinguishability-repeated-transformed.png"/>

Looks pretty straight to me!

If we want to double our angular accuracy without sacrificing distinguishability, we need to quadruple the number of copies.
That means the number of Bloch sphere area-patches we can reliably distinguish between is proportional to the number of copies we have, since doubling angle-accuracy will quadruple angle-area-accuracy.

(If we could distinguish asymptotically more area-patches than the number of qubits we were given, we could use quantum compression to send $\log m$ bits of information with fewer than $\log m$ qubits.
That would violate the [Holevo bound](https://en.wikipedia.org/wiki/Holevo's_theorem).)

The relationship between $n$ and $\theta^2$ suggests that any cloning method that doubles the number of qubits will be working at half of the area-accuracy that a tester can bring to bear.
Not a good sign.

# Naive Cloning Method

Here's an example of the most naive approximate cloning method possible.
Suppose we know the input qubits will be of the form $R(\theta) = (\cos \theta) \ket{0} + (\sin \theta) \ket{1}$, with $0 < \theta < \pi/2$.
Then the most obvious possible thing we could do is count the number of qubits that are ON, infer the input angle based on that, then produce a bunch of qubits at that angle.

Note that we can expand states like $R(t)^{\otimes m}$ by rewriting them as a sum of the states with each possible number of ON bits from $0$ to $m$, weighted appropriately:

$$R(t)^{\otimes m} = \sum\_{k=0}^{m} \left| {m \atop k} \right\rangle (\cos^{m-k} t) \cdot (\sin^k t)$$

Here is our target state, expanded:.

$$\begin{align}
  \psi\_{\text{target}}
  &= R(\theta)^{\otimes n+d}
  \\\\&= \sum\_{i=0}^{n+d} \left| {n+d \atop i} \right\rangle (\cos^{n+d-i} \theta) \cdot (\sin^i \theta)
\end{align}$$

Our input state is similar, except we only get $n$ copies of $R(\theta)$, so the last $d$ qubits are in the state $\ket{0}$ instead of something useful:

$$\begin{align}
  \psi\_{\text{input}}
  &= R(\theta)^{\otimes n} \otimes \ket{0}^{\otimes d}
  \\\\&= \sum\_{k=0}^{n} \left| {n \atop k} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \otimes \ket{0}^{\otimes d}
\end{align}$$

The operations we apply to the $d$ qubits can be conditioned on the first $n$ qubits.
In particular, we can rotate each of the qubits by an amount that depends on the number of ON-qubits (i.e. that depends on the summation variable $k$).
Given that $k$ out of the $n$ qubits are ON, we would infer that the probability of the $\ket{1}$ state was roughly $\frac{k}{n}$.
Since our amplitude for that state is set to $\sin \theta$, and the probability is the square of the amplitude, we infer $\frac{k}{n} \approx \sin^2 \theta$ and therefore $\theta \approx \theta\_k = \arcsin \sqrt{\frac{k}{n}}$.
Applying that approximation within each component of the sum gives our cloned state:

$$\begin{align}
  \psi\_{\text{output}}
  &= \sum\_{k=0}^{n} \left| {n \atop k} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \otimes R(\theta\_k)^{\otimes d}
  \\\\&= \sum\_{k=0}^{n} \sum\_{j=0}^{d} \left| {n \atop k} \right\rangle \otimes \left| {d \atop j} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \cdot (\cos^{d-j} \theta\_k) \cdot (\sin^j \theta\_k)
\end{align}$$

To determine the distinguishability of this state versus the target state, we compute their dot product:

$$\begin{align}
  \psi\_{target}^* \cdot \psi\_{output}
  &= \sum\_{i=0}^{n+d} \sum\_{k=0}^{n} \sum\_{j=0}^d \left\langle {n+d \atop i} \right| \left( \left| {n \atop k} \right\rangle \otimes \left| {d \atop j} \right\rangle \right) \cdot (\cos \theta)^{2n+d-k-i} \cdot (\sin \theta)^{i+k} \cdot (\cos \theta\_k)^{d-j} \cdot (\sin \theta\_k)^j
  \\\\&= \sum\_{k=0}^{n} \sum\_{j=0}^d {n \choose k} {d \choose j} \cdot (\cos \theta)^{2n-2k+d-j} \cdot (\sin \theta)^{2k+j} \cdot (\cos \theta\_k)^{d-j} \cdot (\sin \theta\_k)^j
  \\\\&= \sum\_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot \sum\_{j=0}^d {d \choose j} (\sin \theta \sin \theta\_k)^j \cdot (\cos \theta \cos \theta\_k)^{d-j}
  \\\\&= \sum\_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot (\sin \theta \sin \theta\_k + \cos \theta \cos \theta\_k)^{d}
  \\\\&= \sum\_{k=0}^{n} {n \choose k} (\cos^2 \theta)^{n-k} \cdot (\sin^2 \theta)^{k} \cdot \cos^d (\theta - \theta\_k)
  \\\\&= \sum\_{k=0}^{n} {n \choose k} (\cos^2 \theta)^{n-k} \cdot (\sin^2 \theta)^{k} \cdot \cos^d \left(\theta - \arcsin \sqrt{\frac{k}{n}}\right)
\end{align}$$

A summary of the tricks we just used: merging the product into a triple-sum, setting $i = k+j$ because otherwise $\left\langle {n+d \atop i} \right\| \left( \left\| {n \atop k} \right\rangle \otimes \left\| {d \atop j} \right\rangle \right)$ is $0$, grouping the terms based on $j$ and $d$, noticing a binomial distribution over $j$, applying a trignometric identity, and expanding $\theta\_k$.

So the dot product of the target state and the naive-cloning-process' output state comes down to summing a binomial distribution... except each bucket of the distribution is suffering compounding losses related to the error of the inferred angle used for each clone.
The actual distinguishability is:

$$p\_{\text{target}, \text{output}} = \frac{1}{2} + \frac{1}{2} \sqrt{1 - \left( \sum\_{k=0}^{n} {n \choose k} (\cos^2 \theta)^{n-k} \cdot (\sin^2 \theta)^{k} \cdot \cos^d \left(\theta - \arcsin \sqrt{\frac{k}{n}}\right) \right)^2}$$

Which is... kind of complicated.
It doesn't help that we have four values in play: $p$, $n$, $\theta$, and $d$.
That makes it hard to graph the results.
But if we aggregate $\theta$ away by focusing on the worst case, we can get a decent contour plot for $p$ against $n$ and $d$ by writing a naive python program and letting it run for two hours:

<img src="/assets/{{ loc }}/indistinguishability-naive-method.png"/>

Since we're plotting the given count against the cloned count, and the contour lines are radial, we see that what really matters is the ratio between them.
The indistinguishability seems to decay somewhat exponentially as the ratio increases.

p = c^(d/n)
lg(p) = lg(c) d/n
d = n lg(p)/lg(c)

It looks like, as long as there's enough starting qubits to get out of the zone of terrible-ness at the bottom, the accuracy is related mostly to the ratio of clones to givens.

So what's the optimal method?

# Optimal

After I'd become interested in this approximate cloning problem and worked out the things I've discussed so far, I figured I should probably find out if anyone had done it before.

I asked about the problem on the physics stackexchange, and within an hour I had my answer: the paper [Optimal Cloning of Pure States](http://arxiv.org/abs/quant-ph/9804001) by R. F. Werner.
Turns out the problem was solved in 1997, at least for the case where the repeated state is a pure 2-level quantum system.

So what's the optimal cloning method? Well, basically you append $d$ randomized qubits to the input qubits then project them into the Hoff space of the system.
Operationally, that means you:

1. Append $d$ qubits. Flip a coin for whether each is in the $\ket{0}$ state or the $\ket{1}$ state.
2. Apply quantum compression to the full $n+d$ qubit system.
3. Reset the qubits not involved in the uniform space.
4. Undo quantum compression.

It's very interesting that the optimal cloner involves a randomization step!
If we picked a deterministic cloning strategy, the distinguisher could special-case us.
By using a bunch of different possible strategies, the distinguisher has to be more general.

Unfortunately, this forces us to use the full trace definition in order to understand how distinguishable this state is with respect to a true clone.

However, we can cheat a little bit.
Because this cloning machine is totally symmetric over the space of qubits, we don't need to consider an arbitrary state $\alpha \ket{0} + \beta \ket{1}$.
We can consider any specific state, and the accuracy should match.
So we'll just use $\ket{0}$.

We start with our "unknown" input state:

$\psi\_{\text{input}} = (\ket{0} \bra{0})^{\otimes n}$

and our ancilla:

$\psi\_{\text{ancilla}}
= \left(\frac{1}{2} \ket{0}\bra{0} + \frac{1}{2} \ket{1}\bra{1} \right)^{\otimes d}
= \frac{1}{2^d} \sum\_{s}^d \sum\_{c}^{d \choose s} \ket{d \atop s}\_c \bra{d \atop s}\_c$

Concatenate them:

$\psi\_{\text{expanded}} = \psi\_{\text{input}} \otimes \psi\_{\text{ancilla}}$

$= \frac{1}{2^d} \sum\_{s}^d \sum\_{c}^{d \choose s} \left(\ket{0}^{\otimes n} \ket{d \atop s}\_c\right) \left(\bra{0}^{\otimes n} \bra{d \atop s}\_c \right)$

Now we want to project our expanded vector down into the symmetric subspace.
To do that, we pre- and post- multiply by the projector $P\_{m} = \sum\_{k=0}^m \hat{\ket{m \atop k}} \hat{\bra{m \atop k}}$.

Keep in mind that $\ket{m \atop k} = \sum\_{j=0}^{m \choose k} \ket{m \atop k}\_j$.

$\psi\_{\text{projected}} = P\_{n+d} \cdot \psi\_{\text{expanded}} \cdot P\_{n+d}$

$=
\left[
  \sum\_{k}^{n+d}
   \hat{\ket{n+d \atop k}}
   \hat{\bra{n+d \atop k}}
\right]
\cdot
\left[
  \frac{1}{2^d}
  \sum\_{s}^d
  \sum\_{c}^{d \choose s}
    \left(\ket{0}^{\otimes n} \ket{d \atop s}\_c\right)
    \left(\bra{0}^{\otimes n} \bra{d \atop s}\_c \right)
\right]
\cdot
\left[
  \sum\_{k}^{n+d}
   \hat{\ket{n+d \atop k}}
   \hat{\bra{n+d \atop k}}
\right]
$

Pull all the sums to the left:

$=
\frac{1}{2^d}
\sum\_{k\_0, k\_1}^{n+d}
\sum\_{s}^d
\sum\_{c}^{d \choose s}
  \hat{\ket{n+d \atop k\_0}}
  \hat{\bra{n+d \atop k\_0}}
  \left(\ket{0}^{\otimes n} \ket{d \atop s}\_c\right)
  \left(\bra{0}^{\otimes n} \bra{d \atop s}\_c \right)
  \hat{\ket{n+d \atop k\_1}}
  \hat{\bra{n+d \atop k\_1}}
$

Realize that $k\_0 = k\_1 = s$:

$=
\frac{1}{2^d}
\sum\_{s}^d
\sum\_{c}^{d \choose s}
  \hat{\ket{n+d \atop s}}
  \hat{\bra{n+d \atop s}}
  \left(\ket{0}^{\otimes n} \ket{d \atop s}\_c\right)
  \left(\bra{0}^{\otimes n} \bra{d \atop s}\_c \right)
  \hat{\ket{n+d \atop s}}
  \hat{\bra{n+d \atop s}}
$

Realize that $\hat{\bra{n+d \atop s}} \left(\ket{0}^{\otimes n} \ket{d \atop s}\_c\right) = {n+d \choose s}^{-0.5}$:

$=
\frac{1}{2^d}
\sum\_{s}^d
\sum\_{c}^{d \choose s}
  \hat{\ket{n+d \atop s}}
  \hat{\bra{n+d \atop s}}
  /{n+d \choose s}
$

Constant sum into factor:

$=
\frac{1}{2^d}
\sum\_{s}^d
  {d \choose s}/{n+d \choose s}
  \hat{\ket{n+d \atop s}}
  \hat{\bra{n+d \atop s}}
$

Renormalize:

$=
\frac{n+1}{n+d+1}
\sum\_{s}^d
  {d \choose s}/{n+d \choose s}
  \hat{\ket{n+d \atop s}}
  \hat{\bra{n+d \atop s}}
$

Now compute trace distance:

$=
\left(1 - \frac{n+1}{d+n+1} \right)
+
\frac{n+1}{n+d+1}
\sum\_{s=1}^d
  {d \choose s}/{n+d \choose s}
$

$= 1 - \frac{n+1}{d+n+1} + \frac{n+1}{d+n+1} \frac{d}{n+1}$

$= 1 - \frac{n+1}{d+n+1} + \frac{d}{d+n+1}$

$= 1 + \frac{d-n-1}{d+n+1}$

$= \frac{d-n-1+d+n+1}{d+n+1}$

$= \frac{2d}{d+n+1}$

$\rightarrow \frac{d}{d+n+1}$

Trace out all of the qubits except the first one:

$\text{Tr}_{*}
\frac{n+1}{n+d+1}
\sum\_{s}^d
  {d \choose s}/{n+d \choose s}
  \ket{n+d \atop s}
  \bra{n+d \atop s}
$

$
\frac{1}{2^d}
\sum\_{s}^d
  {d \choose s}/{n+d \choose s}
  \text{Tr}_{*}
  \ket{n+d \atop s}
  \bra{n+d \atop s}
$

$=
\frac{n+1}{n+d+1}
\sum\_{s}^d
  {d \choose s}/{n+d \choose s}
  \text{Tr}_{*}
  \left( \ket{0}\ket{n+d-1 \atop s} + \ket{1}\ket{n+d-1 \atop s-1} \right)
  \left( \bra{0}\bra{n+d-1 \atop s} + \bra{1}\bra{n+d-1 \atop s-1} \right)
$

$=
\frac{n+1}{n+d+1}
\sum\_{s}^d
  {d \choose s}/{n+d \choose s}
  \ket{0}\bra{0} \text{Tr} \ket{n+d-1 \atop s} \bra{n+d-1 \atop s}
  +
  \ket{1}\bra{1} \text{Tr} \ket{n+d-1 \atop s-1} \bra{n+d-1 \atop s-1}
$

$
= \frac{n+1}{n+d+1} \ket{0}\bra{0} \sum\_{s=0}^d {d \choose s}/{n+d \choose s}
+ \frac{n+1}{n+d+1} \ket{1}\bra{1} \sum\_{s=1}^d {d \choose s}/{n+d \choose s}
$

$=
\ket{0}\bra{0} + \frac{d}{n+d+1} \ket{1}\bra{1}
$

$=
\frac{n+1}{n+d+1} \ket{0}\bra{0} + \frac{d}{n+d+1} I
$


Ugggghhh... Okay, so the above used facts about roots of unity and whether or not sets overlap... Let's just pretend it's all very clear.

So there's a $\frac{1}{2^d} {d \choose y} {n+d \choose y}^{-1}$ this projection dropped us into a state with $y$ one bits set.
We want the state with no one bits set, and there's a $\frac{1}{2^d} \frac{d}{n+d}$ chance we ended up there.

The optimal distinguisher just measures the number of bits that are ON, so there's a $\frac{1}{2^d}$ chance we'll confuse them.

$\psi\_{target} = \ket{0}^\{otimes n+d} \bra{0}^\{otimes n+d}$

$\text{Tr} \| \psi\_{\text{projected}}  - \psi\_{\text{target}} \|$

$= \text{Tr} \|
\frac{1}{2^d}
\sum\_{y}^{d}
  \ket{n+d \atop y}
  \bra{n+d \atop y}
  {d \choose y}
-
\ket{0}^\{otimes n+d} \bra{0}^\{otimes n+d}
$

...

...


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

# Caveat: Entanglement

Approximate cloning only works if you're given an entire quantum state.

What would cloning of an entangled qubit even mean?
The math makes no sense.














