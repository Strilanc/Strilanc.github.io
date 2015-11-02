---
layout: post
title: "Quantum vs NP #2: Zachary B. Walters 'A linear time quantum algorithm for 3SAT'"
date: 2015-11-01 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

At the end of September, Zachary B. Walters published a preprint to arXiv titled [A linear time quantum algorithm for 3SAT](http://arxiv.org/abs/1510.00409).

I enjoy looking through papers like this one, because they're an excellent source of subtle misconceptions worth explaining.
In the [last paper I covered](http://algorithmicassertions.com/quantum/2015/08/27/Simulating-a-Claimed-BQP-NP-Algorithm.html), the problem was that all the optimization came from post-selection.
This paper has a different mistake: using measurements to erase information.

*(Note: these posts are __not__ in a mocking tone.
I remember working through these same misconceptions; the only difference is I tried to explain them to a computer.)*

# The Algorithm

I have to admit I had some trouble understanding the details in the paper.
This is not the author's fault, for the most part.
They do a good job unambiguously defining their operations, but it's done in a way that I'm not used to (physics style, instead of quantum computing style).
For example, instead of saying "rotate qubit $t$ around the Y axis, conditioned on qubit $c$ along the $a$ axis", the paper defines:

$\text{CROT}^{c \rightarrow t}\_a(\theta) = R^t(\theta/2) \cdot R\_a^{c \rightarrow t}(\theta/2)$

$R\_{a}^{c \rightarrow t}(\theta) = \exp(\pm i \sigma\_a^c \sigma\_y^t \theta / 2)$

$R^t(\theta) = \exp(i \sigma_y^t \theta/2)$

That's a fine definition, and I wrote some [code computing the operation's matrix](https://gist.github.com/Strilanc/230c486dee03af917708) to be sure I was correctly understanding the intent, but I really would have preferred [quantum circuit diagrams](http://www2.warwick.ac.uk/fac/sci/physics/research/cfsa/people/pastmembers/charemzam/pastprojects/mcharemza_quant_circ.pdf).

Anyways, the algorithm described by the paper essentially comes down to this pseudo-code:

    initialize assignment qubits to a uniform superposition
    repeat enough times:
      foreach clause (m1,m2,m3):
        introduce a scratch qubit S initialized to be False
        toggle S from False to True if the clause is not satisfied
        perform small conditional rotations of qubits m1, m2, and m3, with S as the control
        erase S by measuring it along the X axis (perpendicular to the computational basis)

The underlying idea here is that amplitude in non-satisfying states keeps getting pushed around, and so hopefully we get some kind of efficient [quantum walk](https://en.wikipedia.org/wiki/Quantum_walk) towards the solution.

The huge red flag here is "erase S by measuring".
Typically, when it comes to quantum algorithms, measurement is not essential.
*Measurement is just an optimization*.
[You can always defer measurements](https://en.wikipedia.org/wiki/Deferred_Measurement_Principle) without changing the expected result, assuming you have enough quantum memory to hold all the unmeasured qubits.
In fact, with scratch bits, you can defer measurement past the point where you have the result of the algorithm!

(*Side note: a notable exception to this rule of thumb is [cluster state computing](https://en.wikipedia.org/wiki/One-way_quantum_computer).)*

Let's look closer at this "erasing with measurement" business.

# The Mistake

Walters thinks that you can erase a qubit's value along one axis by measuring it along a perpendicular axis.
For example:

> the state of bit $c$ is now encoded in the scratch bit’s projection onto the $\hat{x}$ axis – the “axis of truth” – measurement along an axis orthogonal to this, such as the $\hat{z}$ axis, makes the rotation irreversible without measuring any information about the state of bit $c$

There is [some truth](https://en.wikipedia.org/wiki/Observable#Incompatibility_of_observables_in_quantum_mechanics) here, but a subtle danger that I'll clarify with an example.

Suppose you have pair of qubits, $p$ and $q$, in the EPR state $\frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$.
You then introduce a scratch qubit $s$, initialized to be false, and perform a controlled-not of $q$ onto $s$.
This puts the $pqs$ system into a GHZ state $\frac{1}{\sqrt{2}} \ket{000} + \frac{1}{\sqrt{2}} \ket{111}$.

Now we try to erase $s$ out of the GHZ state by measuring it along the $X$ axis, perpendicular to the entanglement axis (i.e. $Z$).
What happens to $p$ and $q$?

I think that Walters thinks that $p$ and $q$ end up back in the $\frac{1}{\sqrt{2}} \ket{00} + \frac{1}{\sqrt{2}} \ket{11}$ state.
Unfortunately, what actually happens is that $p$ and $q$ end up decohered.
There's still a 50% chance they're both false and a 50% chance they're both true, but they're in a mixed state instead of a pure state.

More concretely, introducing and "erasing" $s$ causes the [density matrix](https://en.wikipedia.org/wiki/Density_matrix) describing $p$ and $q$'s state to transition from this:

$\rho\_{i} = \frac{1}{2} \begin{bmatrix} 1&0&0&1 \\\\ 0&0&0&0 \\\\ 0&0&0&0 \\\\ 1&0&0&1 \end{bmatrix}$.

To this:

$\rho\_{f} = \frac{1}{2} \begin{bmatrix} 1&0&0&0 \\\\ 0&0&0&0 \\\\ 0&0&0&0 \\\\ 0&0&0&1 \end{bmatrix}$.

The state $\rho\_{i}$ corresponds to an entangled quantum superposition, but $\rho\_{f}$ just corresponds to a classical probability distribution.
You could use $\rho\_{i}$ to pass Bell tests, but not $\rho\_{f}$.

$\rho\_{i}$ is the same state we'd have ended up in if we'd measured $s$ along the $Z$ axis, or just ignored $s$ by tracing over it.
Even though we didn't measure along the axis we cared about, *the system still decohered along it*.

Since the point of this post is to dig into a misconception and understand, let's investigate this decoherence thing by computing what happens step by step.

# The Work

We start in the EPR state $\rho_{i}$, defined above.
Then we introduce the scratch qubit $s$, and toggle $s$ to match the existing qubits.
That puts the three-qubit system into a GHZ state:

$\rho\_{2} = \frac{1}{2} \begin{bmatrix}
1&0&0&0&0&0&0&1 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
1&0&0&0&0&0&0&1 \end{bmatrix}$.

When we measure $s$ along the $X$ axis, we are projecting $\rho\_{2}$ onto the third-qubit-X-negative case and the third-qubit-X-positive case.
The projection matrices corresponding to those cases are:

$P\_{\text{3,X,false}} = \frac{1}{2} \begin{bmatrix}
1&0&0&0&1&0&0&0 \\\\
0&1&0&0&0&1&0&0 \\\\
0&0&1&0&0&0&1&0 \\\\
0&0&0&1&0&0&0&1 \\\\
1&0&0&0&1&0&0&0 \\\\
0&1&0&0&0&1&0&0 \\\\
0&0&1&0&0&0&1&0 \\\\
0&0&0&1&0&0&0&1 \end{bmatrix}$

and:

$P\_{\text{3,X,true}} = \frac{1}{2} \begin{bmatrix}
1&0&0&0&-1&0&0&0 \\\\
0&1&0&0&0&-1&0&0 \\\\
0&0&1&0&0&0&-1&0 \\\\
0&0&0&1&0&0&0&-1 \\\\
-1&0&0&0&1&0&0&0 \\\\
0&-1&0&0&0&1&0&0 \\\\
0&0&-1&0&0&0&1&0 \\\\
0&0&0&-1&0&0&0&1 \end{bmatrix}$.

We compute the two possible output states by left- and right-multiplying the projectors onto our state.
When the measurement returns false, the density state of the system is (before renormalizing):

$\rho\_{\text{false}} = (P\_{\text{3,X,false}}) \cdot \rho\_{2} \cdot (P\_{3,X,False}) = \frac{1}{4} \begin{bmatrix}
1&0&0&1&1&0&0&1 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
1&0&0&1&1&0&0&1 \\\\
1&0&0&1&1&0&0&1 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
1&0&0&1&1&0&0&1 \end{bmatrix}$

And when the measurement returns true, we're in this state (still not renormalized):

$\rho\_{\text{true}} = (P\_{\text{3,X,true}}) \cdot \rho\_{2} \cdot (P\_{3,X,True}) = \frac{1}{4} \begin{bmatrix}
1&0&0&-1&-1&0&0&1 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
-1&0&0&1&1&0&0&-1 \\\\
-1&0&0&1&1&0&0&-1 \\\\
0&0&0&0&0&0&0&0 \\\\
0&0&0&0&0&0&0&0 \\\\
1&0&0&-1&-1&0&0&1 \end{bmatrix}$

To get the density matrices for just $p$ and $q$, we trace over $s$.
That gives us these two equally likely outcome states (again, not normalized):

$\rho'\_{\text{false}} = \frac{1}{4} \begin{bmatrix}
1&0&0&1 \\\\
0&0&0&0 \\\\
0&0&0&0 \\\\
1&0&0&1 \end{bmatrix}$
and
$\rho'\_{\text{true}} = \frac{1}{4} \begin{bmatrix}
1&0&0&-1 \\\\
0&0&0&0 \\\\
0&0&0&0 \\\\
-1&0&0&1 \end{bmatrix}$

Because we're not actually using the measurement result anywhere (e.g. by [performing conditional phase corrections](/quantum/2015/09/02/Partially-Erasing-Entanglement-with-Measurement.html)), we don't need to consider the two outcome states separately; we can just add them together.
(They need to be scaled by how likely they are, but because we didn't normalize them they're already weighted correctly.)
That gives us the final state of the system, which agrees with what I claimed in the previous section:

$\rho\_{f} = \rho'\_{\text{false}} + \rho'\_{\text{true}} = \frac{1}{2} \begin{bmatrix} 1&0&0&0 \\\\ 0&0&0&0 \\\\ 0&0&0&0 \\\\ 0&0&0&1 \end{bmatrix}$

I hope that was clear.
Measuring along a perpendicular axis doesn't prevent decoherence.
Let's move on to how this mistake impacts the algorithm.

# The Consequences

Recall the paper's algorithm's inner loop:

    introduce a scratch qubit S initialized to be False
    toggle S from False to True if the clause is not satisfied
    perform conditional rotation of the clause bits, with S as the control
    erase S by measuring it along the X axis (perpendicular to the computational basis)

Also recall that the existence of $S$ decoheres the $S$-is-false case from the $S$-is-true case, even if we measure $S$ along a perpendicular axis.
In fact we can pretend $S$ is never measured at all, and the algorithm will have the same expected results.

Thus we can think of the core operation as implementing the following mapping, with the first three qubits corresponding to variable assignments, the fourth qubit corresponding to a fresh scratch qubit, and the associated clause being "any variable is true":

$\ket{0000} \rightarrow
\alpha^3 \ket{0001} +
\alpha^2 \beta \ket{1001} +
\alpha^2 \beta \ket{0101} +
\alpha^2 \beta \ket{0011} +
\alpha \beta^2 \ket{1101} +
\alpha \beta^2 \ket{1011} +
\alpha \beta^2  \ket{0111} +
\beta^3 \ket{1111}$

$\ket{abc0} \rightarrow \ket{abc0}$

$\ket{abc1} $ never occurs

Notice that none of the mapping's outputs will ever overlap when we run the algorithm.
States that end in 1 never occur as inputs, because the scratch bits are always initialized, so they contribute no outputs.
Seven of the eight remaining input states satisfy the clause, and so are unchanged by the operation.
They contribute non-overlapping outputs ending in 0.
The single remaining state does get operated on, but all its outputs end in 1, and so don't overlap with the outputs from the satisfying states.

Because new scratch bits are introduced for every operation, the outputs never overlap for any operation.
Because the outputs never overlap, there will never be any interference.
Because there's never any interference, we don't need to store the amplitudes; we can just track the probabilities.
Because we only need the probabilities, this algorithm is actually in BPP.

Bluntly stated, the paper describes a [simulated annealing](https://en.wikipedia.org/wiki/Simulated_annealing) algorithm with a trivial heuristic.
It is only pretending to be quantum.

Because the nature of the algorithm differs radically from what the author presumed, I'm not going to check whether the analysis of its runtime is correct.
Suffice it to say that it's not.

# Summary

A measurement that doesn't distinguish between two states can still decohere a superposition of those two states.
