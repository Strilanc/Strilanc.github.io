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

# Distinguishability

Before I can talk about how well a cloning process approximates a desired state, I need to explain how we even determine if two quantum states are similar.

There are plenty of useful [distance measures between states](https://quantiki.org/wiki/distance-measures-between-states), but for our purposes we care about *distinguishability*.
If we're given $A$ half of the time, and $B$ half of the time, how often are we able to correctly determine which one we were given?
Given the [density matrices](https://en.wikipedia.org/wiki/Density_matrix) representing $A$ and $B$, the maximum probability of correctly distinguishing $A$ from $B$ is related to the [trace distance](https://en.wikipedia.org/wiki/Trace_distance) between the two matrices:

$$p_{A,B} = \frac{1}{2} + \frac{1}{4} \text{Tr} \left| A - B \right|$$

You get a base-rate of 50% for free just by guessing, but the rest depends on how the eigendecomposition of the difference between the two states plays out (because the trace is adding up the magnitudes of all the eigenvalues).

When working with pure states, the distinguishability is much easier to compute. If $A = \ket{a}\bra{a}$ and $B = \ket{b}\bra{b}$, then all you need is their dot product's magnitude:

$$p_{\ket{a}\bra{a}, \ket{b}\bra{b}} = \frac{1}{2} + \frac{1}{2} \sqrt{1 - |\langle a | b \rangle|^2 }$$

Because the dot product of two unit vectors is the cosine of the angle between them, knowing the angle $\theta$ between two states gives a particularly easy computation:

$$p_\theta = \frac{1}{2} + \frac{1}{2} \sin \theta$$

Now let's consider how repetition affects these definitions.

# Distinguishing Repeated Qubits

Since we'll be making copies of qubits, it's worth asking: how hard is it to distinguish between two qubit states when we're given many independent copies of the state?
This will bound how accurate our cloning process can be, and also inform us of how easy it will be to distinguish bad clones from good clones.

So suppose we have a qubit that could be in one of two states, and that the two states differ by an angle of $\theta$.
The qubit is either in the state $a = \ket{0}$ or in the state $b = (\cos \theta) \ket{0} + (\sin \theta) \ket{1}$.

If we only have one copy of this qubit, we can distinguish between the two states with probability $p_{a, b} = \frac{1}{2} + \frac{1}{2} \sqrt{1 - \langle a \| b \rangle^2} = \frac{1}{2} + \frac{1}{2} \sin \theta$.
But if we have $n$ copies of the qubit we end up rausing the dot-product to the $n$'th power, and our distinguishability improves:

$$\begin{align}
  p_{a^{\otimes n}, b^{\otimes n}}
  &= \frac{1}{2} + \frac{1}{2} \sqrt{1 - \langle a^{\otimes n} \| b^{\otimes n} \rangle^2}
  \\&= \frac{1}{2} + \frac{1}{2} \sqrt{1 - \langle a \| b \rangle^{2n}}
  \\&= \frac{1}{2} + \frac{1}{2} \sqrt{1 - \cos^{2n} \theta}
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

$$R(t)^{\otimes m} = \sum_{k=0}^{m} \left| {m \atop k} \right\rangle (\cos^{m-k} t) \cdot (\sin^k t)$$

Here is our target state, expanded:.

$$\begin{align}
  \psi_{\text{target}}
  &= R(\theta)^{\otimes n+d}
  \\&= \sum_{i=0}^{n+d} \left| {n+d \atop i} \right\rangle (\cos^{n+d-i} \theta) \cdot (\sin^i \theta)
\end{align}$$

Our input state is similar, except we only get $n$ copies of $R(\theta)$, so the last $d$ qubits are in the state $\ket{0}$ instead of something useful:

$$\begin{align}
  \psi_{\text{input}}
  &= R(\theta)^{\otimes n} \otimes \ket{0}^{\otimes d}
  \\&= \sum_{k=0}^{n} \left| {n \atop k} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \otimes \ket{0}^{\otimes d}
\end{align}$$

The operations we apply to the $d$ qubits can be conditioned on the first $n$ qubits.
In particular, we can rotate each of the qubits by an amount that depends on the number of ON-qubits (i.e. that depends on the summation variable $k$).
Given that $k$ out of the $n$ qubits are ON, we would infer that the probability of the $\ket{1}$ state was roughly $\frac{k}{n}$.
Since our amplitude for that state is set to $\sin \theta$, and the probability is the square of the amplitude, we infer $\frac{k}{n} \approx \sin^2 \theta$ and therefore $\theta \approx \theta_k = \arcsin \sqrt{\frac{k}{n}}$.
Applying that approximation within each component of the sum gives our cloned state:

$$\begin{align}
  \psi_{\text{output}}
  &= \sum_{k=0}^{n} \left| {n \atop k} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \otimes R(\theta_k)^{\otimes d}
  \\&= \sum_{k=0}^{n} \sum_{j=0}^{d} \left| {n \atop k} \right\rangle \otimes \left| {d \atop j} \right\rangle (\cos^{n-k} \theta) \cdot (\sin^k \theta) \cdot (\cos^{d-j} \theta_k) \cdot (\sin^j \theta_k)
\end{align}$$

To determine the distinguishability of this state versus the target state, we compute their dot product:

$$\begin{align}
  \psi_{target}^* \cdot \psi_{output}
  &= \sum_{i=0}^{n+d} \sum_{k=0}^{n} \sum_{j=0}^d \left\langle {n+d \atop i} \right| \left( \left| {n \atop k} \right\rangle \otimes \left| {d \atop j} \right\rangle \right) \cdot (\cos \theta)^{2n+d-k-i} \cdot (\sin \theta)^{i+k} \cdot (\cos \theta_k)^{d-j} \cdot (\sin \theta_k)^j
  \\&= \sum_{k=0}^{n} \sum_{j=0}^d {n \choose k} {d \choose j} \cdot (\cos \theta)^{2n-2k+d-j} \cdot (\sin \theta)^{2k+j} \cdot (\cos \theta_k)^{d-j} \cdot (\sin \theta_k)^j
  \\&= \sum_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot \sum_{j=0}^d {d \choose j} (\sin \theta \sin \theta_k)^j \cdot (\cos \theta \cos \theta_k)^{d-j}
  \\&= \sum_{k=0}^{n} {n \choose k} (\cos \theta)^{2n-2k} \cdot (\sin \theta)^{2k} \cdot (\sin \theta \sin \theta_k + \cos \theta \cos \theta_k)^{d}
  \\&= \sum_{k=0}^{n} {n \choose k} (\cos^2 \theta)^{n-k} \cdot (\sin^2 \theta)^{k} \cdot \cos^d (\theta - \theta_k)
  \\&= \sum_{k=0}^{n} {n \choose k} (\cos^2 \theta)^{n-k} \cdot (\sin^2 \theta)^{k} \cdot \cos^d \left(\theta - \arcsin \sqrt{\frac{k}{n}}\right)
\end{align}$$

A summary of the tricks we just used: merging the product into a triple-sum, setting $i = k+j$ because otherwise $\left\langle {n+d \atop i} \right\| \left( \left\| {n \atop k} \right\rangle \otimes \left\| {d \atop j} \right\rangle \right)$ is $0$, grouping the terms based on $j$ and $d$, noticing a binomial distribution over $j$, applying a trignometric identity, and expanding $\theta_k$.

So the dot product of the target state and the naive-cloning-process' output state comes down to summing a binomial distribution... except each bucket of the distribution is suffering compounding losses related to the error of the inferred angle used for each clone.
The actual distinguishability is:

$$p_{\text{target}, \text{output}} = \frac{1}{2} + \frac{1}{2} \sqrt{1 - \left( \sum_{k=0}^{n} {n \choose k} (\cos^2 \theta)^{n-k} \cdot (\sin^2 \theta)^{k} \cdot \cos^d \left(\theta - \arcsin \sqrt{\frac{k}{n}}\right) \right)^2}$$

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

$\psi_{input} = \left(\ket{0} \bra{0}\right)^{\otimes n}$

Append the randomized qubits:

$\psi_{expanded} = \left(\ket{0} \bra{0}\right)^{\otimes n} \otimes \left(\frac{1}{2} \ket{0}\bra{0} + \frac{1}{2} \ket{1}\bra{1} \right)^{\otimes d}$

Rewrite the expression into a sum:

$
\psi_{expanded} =
 \sum_{x=0}^{2^d}
  \frac{1}{2^d}
  \left(
    \ket{0}^{\otimes n}
    \ket{x}
  \right)
  \left(
    \bra{0}^{\otimes n}
    \bra{x}
  \right)
$

Now we want to project our expanded vector down into the symmetric subspace.
To do that, we pre- and post- multiply by the projecter $P_{m} = \sum_{k=0}^m \ket{m \atop k} \bra{m \atop k}$:

$$
\begin{align}
\psi_{projected} &= P_{n+d} \cdot \psi_{expanded} \cdot P_{n+d}
\\
&=
\left[
  \sum_{k}^{n+d}
  \sum_{j}^{n+d \choose k}
   \ket{n+d \atop k}
   \bra{n+d \atop k}_j
\right]
\cdot
\left[
 \sum_{x}^{2^d}
  \frac{1}{2^d}
  \left(
    \ket{0}^{\otimes n}
    \ket{x}
  \right)
  \left(
    \bra{0}^{\otimes n}
    \bra{x}
  \right)
\right]
\cdot
\left[
  \sum_{k}^{n+d}
  \sum_{j}^{n+d \choose k}
   \ket{n+d \atop k}_j
   \bra{n+d \atop k}
\right]
\\
&=
\frac{1}{2^d}
\sum_{k_0, k_1}^{n+d}
\sum_{j_0}^{n+d \choose k_0}
\sum_{j_1}^{n+d \choose k_1}
\sum_{x}^{2^d}
  \ket{n+d \atop k_0}
  \bra{n+d \atop k_0}_{j_0}
  \left(
    \ket{0}^{\otimes n}
    \ket{x}
  \right)
  \left(
    \bra{0}^{\otimes n}
    \bra{x}
  \right)
  \ket{n+d \atop k_1}_{j_1}
  \bra{n+d \atop k_1}
\\
&=
\frac{1}{2^d}
\sum_{x}^{2^d}
\sum_{j_0,j_1}^{n+d \choose \text{ons}(x)}
  \ket{n+d \atop \text{ons}(x)}
  \bra{n+d \atop \text{ons}(x)}_{j_0}
  \left(
    \ket{0}^{\otimes n}
    \ket{x}
  \right)
  \left(
    \bra{0}^{\otimes n}
    \bra{x}
  \right)
  \ket{n+d \atop \text{ons}(x)}_{j_1}
  \bra{n+d \atop \text{ons}(x)}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
\sum_{z}^{d \choose y}
\sum_{j_0,j_1}^{n+d \choose \text{ons}(x)}
  \ket{n+d \atop \text{ons}(x)}
  \bra{n+d \atop \text{ons}(x)}_{j_0}
  \left(
    \ket{0}^{\otimes n}
    \ket{X(y, z)}
  \right)
  \left(
    \bra{0}^{\otimes n}
    \bra{X(y, z)}
  \right)
  \ket{n+d \atop \text{ons}(x)}_{j_1}
  \bra{n+d \atop \text{ons}(x)}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
\sum_{z}^{d \choose y}
\sum_{j_0,j_1}^{n+d \choose y}
  \ket{n+d \atop y}
  \bra{n+d \atop y}_{j_0, z}
  \ket{n+d \atop y}_{j_1, z}
  \bra{n+d \atop y}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
\sum_{z}^{d \choose y}
\sum_{j_0,j_1}^{n+d \choose y}
  \ket{n+d \atop y}
  {n+d \choose y}^{-1}
  e^{i \tau (j_0-j_1) f_{?}(z) {n+d \choose y}^{-1}}
  \bra{n+d \atop y}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
\sum_{z}^{d \choose y}
\sum_{j}^{n+d \choose y}
  \ket{n+d \atop y}
  {n+d \choose y}^{-1}
  e^{i \tau (j-j) f_{?}(z) {n+d \choose y}^{-1}}
  \bra{n+d \atop y}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
\sum_{z}^{d \choose y}
\sum_{j}^{n+d \choose y}
  \ket{n+d \atop y}
  {n+d \choose y}^{-1}
  \bra{n+d \atop y}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
  \ket{n+d \atop y}
  \bra{n+d \atop y}
  {n+d \choose y}^{-1}
  {n+d \choose y}
  {d \choose y}
\\
&=
\frac{1}{2^d}
\sum_{y}^{d}
  \ket{n+d \atop y}
  \bra{n+d \atop y}
  {d \choose y}
\end{align}$$

Ugggghhh... Okay, so the above used facts about roots of unity and whether or not sets overlap... Let's just pretend it's all very clear.

So there's a $\frac{1}{2^d} {d \choose y} {n+d \choose y}^{-1}$ this projection dropped us into a state with $y$ one bits set.
We want the state with no one bits set, and there's a $\frac{1}{2^d} \frac{d}{n+d}$ chance we ended up there.

The optimal distinguisher just measures the number of bits that are ON, so there's a $\frac{1}{2^d}$ chance we'll confuse them.

$\psi_{target} = \ket{0}^\{otimes n+d} \bra{0}^\{otimes n+d}$

$\text{Tr} \| \psi_{\text{projected}}  - \psi_{\text{target}} \|$

$= \text{Tr} \|
\frac{1}{2^d}
\sum_{y}^{d}
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














