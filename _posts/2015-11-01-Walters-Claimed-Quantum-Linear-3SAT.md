---
layout: post
title: "Quantum vs NP #2: Zachary B. Walters 'A linear time quantum algorithm for 3SAT'"
date: 2015-11-01 11:30:00 EST
categories: quantum
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


# Comments

<div style="background-color: #EEE; border: 1px solid black; padding: 5px; font-size: 12px;">

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Nov 11, 2015
    <br/>

    Your analysis is fine as far as it goes, but you skip to the end and miss an important point -- the algorithm operates by incoherent population transfer, not by interfering amplitudes -- it is meant to map a mixed state to a mixed state. The off diagonal terms of the density matrix don't actually enter into the population transfer. You mention this in your analysis -- we don't need to track amplitudes, only the probabilities. The convergence of the algorithm occurs when the probabilities are concentrated in the set of solution states, provided any exist.
    <br/>
    <br/>

    As you say, it is not necessary to measure the state of the scratch bits -- simply tracing over their states is sufficient. The goal in both cases is to operate on the reduced density matrix describing the state of the variable bits -- specifically the diagonal terms describing the probabilities of the various states.
    <br/>
    <br/>

    Best wishes,
    <br/>
    Zach (the author)
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Craig Gidney</strong> - Nov 11, 2015
    <br/>

    Thanks for your comment. (Also thanks for updating the paper to include circuit diagrams!)
    <br/>
    <br/>

    I'm surprised that you agree that the algorithm only needs to track the probabilities. To me that indicates this is not a quantum algorithm, because purely probabilistic computations can be run efficiently on classical computers.
    <br/>
    <br/>

    So the obvious next question is: do you agree that the algorithm can be run on a classical computer (after replacing the incoherent quantum operations with probabilistic equivalents, of course)?
    <br/>
    <br/>

    Assuming you don't agree... why not? What is the crucial operation that can't be translated from quantum to classical?
    <br/>
    <br/>

    Assuming you choose the decimation operation (DEC) as the can't-be-emulated-probabilistically operation, please provide the 8x8 density matrices of the output states to which DEC maps the input states 000, 010, and 111 (assuming the relevant clause is that at least one of the bits must be true, and that cos(theta) and sin(theta) return something convenient like 3/5 and 4/5).
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Nov 11, 2015
    <br/>

    Note that your analysis gives the same population transfer terms T_{s -> s'} as those used in the paper. 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Nov 11, 2015
    <br/>

    You're welcome for the circuit diagrams. (I'm a physicist, I think in terms of operators.)
    <br/>
    <br/>

    As to the distinction between this algorithm and a probabilistic classical algorithm, I think the distinction is that this algorithm operates on all 2^N states in the probability distribution at once, while a classical algorithm is restricted to occupying a single state at a time. So if we start with all probability in state s0, a classical algorithm can be in state s1 after doing whatever we do for clause 1, state s2 after doing whatever we do for clause 2, etc. We're basically taking a random walk through state space. If the Hamming distance between s0 and some solution state s* is large, it will take a long time before the random walk brings us to s*. I don't think there's any classical analogue to my decaying eigenvector argument.
    <br/>
    <br/>

    When we operate on the entire probability distribution at once, we're effectively trying every path through state space at the same time (bearing in mind that probabilities are adding incoherently rather than coherently -- like flow through a network). And because states which fail more clauses lose population faster, there's an exponential preference for states which fail few clauses over states which fail many. (That's part of the reason I assume a small angle for the decimation operator.)
    <br/>
    <br/>

    In both cases, the average population distribution after infinitely many iterations is for all probability to be concentrated in the solution states. But I don't think that tells us anything about how long it takes to reach a solution state. 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Craig Gidney</strong> - Nov 11, 2015
    <br/>

    For probabilities, it doesn't matter if you're operating on all 2^N states or probabilistically choosing a winner after each step; the expected distribution of final states ends up the same (note that this is not the case for coherent amplitudes, because of destructive interference). That's why it's so difficult to distinguish lack-of-knowledge from not-decided-yet in classical physics: they are mathematically equivalent.
    <br/>
    <br/>

    So a classical computer with a random number generator can efficiently simulate a hypothetical actually-stores-all-the-probabilities-and-operates-on-them computer, assuming the stochastic matrices corresponding to the operations are not extremely complicated (requiring iterating over the output states).
    <br/>
    <br/>

    In the case of your algorithm, a classical implementation is:
    <br/>
    <br/>

    <pre>
let V = random variable assignments
repeat enough times:
for M in clauses:
if V doesn't satisfy M:
for variable v in M:
toggle v in V with probability p</pre>
    <br/>

    To get a decent intuition for how the algorithm will behave, consider the following analysis. Suppose we have a million variables, and that the only satisfying assignment is all-variables-on. To make things simpler to analyze, we won't use a fixed set of clauses and will change the transition strategy a bit. The behavior should be similar. Our transition strategy will be to pick a triplet of bits at random, until we find one with an unsatisfied bit, and then toggle one of the three bits in the triplet (choosing at random). This strategy will bias our otherwise random walk so that it tends to move towards the all-on state... but can it make it all the way there?
    <br/>
    <br/>

    Suppose we are very close to the solution, with 99.9% of the million bits set to True. What is the probability that we move towards the solution? Well, when we find a triplet the usual case here, because so many more bits are On than Off, is that we'll have a triplet with one Off bit and two On bits. The contributions from the two-Off and three-Off cases are negligible. So when we pick a bit to flip, there's a roughly 1/3 chance we pick the correct one. We will move one step towards the solution with probability 1/3, and away from it with probability 2/3. This approximation breaks down once we're further away from the solution and triplets with multiple Off bits become more likely, but we can suppose it holds over the last 0.1% of the distance; the last 1000 steps when there's a million variables.
    <br/>
    <br/>

    Now consider a random walk, starting at position 0 and prevented from moving into the negatives, with a 2:1 bias against moving rightward. What is the expected time before the walk makes it to position 1000 for the first time? (Note: if you write a program to compute this, you need to use arbitrary precision arithmetic; you will exceed the precision of doubles.) Well, if we ignored the termination condition at 1000 then the eventual steady state for a 2:1 walk is a geometric distribution where each position k is half as likely as position k-1. Clearly if we change a step to mean "let the system evolve to the steady state then scrape off whatever's past 1000" that will be faster single-stepping. But then it becomes clear that each of our steps must be adding less than 2^(-1000) to the total! It will take us at least 2^999 super-steady-state steps to have even a fifty/fifty chance of succeeding.
    <br/>
    <br/>

    ... and that's the long explanation of why I think the classical algorithm doesn't work, as well as why I think the quantum algorithm is equivalent. There's probably some silly mistakes in there, and quite a lot of approximating and analogizing, but I think the gist is correct.
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Nov 12, 2015
    <br/>

    Yes, I said that -- the expected final distribution is that all probability is concentrated in solution states. But that doesn't tell us about time for convergence. (Incidentally, your algorithm is not that different from existing classical SAT solvers. I believe they keep a record of which branches have already been checked, though.)
    <br/>
    <br/>

    I certainly don't expect the classical algorithm to work, but I don't think it's equivalent to the quantum algorithm, either.
    <br/>
    <br/>

    In your example, the probability which is transferred from the state with one false variable to states with two false variables will be transferred again on the next iteration, while the probability which is transferred to the solution state stays there forever. The correct way to think about this is in terms of eigenstates of the transfer matrix.
    <br/>
    <br/>

    In general, this transfer matrix will have one slowly decaying eigenstate and the rest will be rapidly decaying. You construct a slowly decaying eigenstate -- but it is very different from your initial condition! Your initial condition had position 1 occupied with probability 1, the slowly decaying eigenstate has it occupied with 2^(-1000). If you write your initial condition as the sum of eigenvectors of the transfer matrix, almost all of it will be rapidly decaying eigenvectors.
    <br/>
    <br/>

    In the 3SAT setup, all of the rapidly decaying eigenvectors decay by transferring their entire nonsolution probability to the set of solution states, which act as population sinks. (This doesn't apply to your toy problem -- you've got a second probability sink corresponding to having more than 1000 False variables). If there is no solution state, the condition that decaying eigenvectors must be traceless means that the sum of all probabilities for the decaying eigenvectors is zero, and the system rapidly settles into equilibrium. So everything that isn't in the slowly decaying eigenvector -- nearly everything in your toy problem-- gets transferred to a probability sink right away.
    <br/>
    <br/>

    The idea behind changing the SATDEC parameters with each iteration over the problem is to get rid of the tiny residual probability that is contained in the slowly decaying eigenvectors by reexpanding in a new set of eigenvectors. In your toy problem, this might equate to changing the transfer matrix to be 1/4 left and 3/4 right. So now the slowly decaying state has state N occupied with 3 times the probability of state N-1 rather than 2 times. Once again, our initial condition looks nothing like the slowly decaying eigenvector, and the difference consists of rapidly decaying eigenvectors. (Again, in this toy problem a lot of the probability will be transferred to the second sink where N>1000). 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Craig Gidney</strong> - Nov 12, 2015
    <br/>

    So at this moment I think we disagree on two important points:
    <br/>
    <br/>

    1) Whether or not your quantum version of DEC, where the outcome of a clause-satisfied-vs-not-satisfied measurement determines if the involved qubits are rotated by an angle θ, is equivalent to my claimed classical version of DEC, where the outcome of a clause-satisfied-vs-not-satisfied check determines if the involved bits are toggled with probability sin²(θ). You don't think they're equivalent in some relevant way, whereas I do consider them equivalent (as far as computational complexity goes).
    <br/>
    <br/>

    2) Whether or not DEC's action will move probability mass to the solution state fast enough. Your paper claims it only needs to be performed a linear number of times, whereas I think it needs to be performed an exponential number of times.
    <br/>
    <br/>

    For (1), I'm not sure how to proceed other than to keep prompting you to give a relevant observational difference. A simple case where the quantum DEC is expected to get to the answer faster than the probabilistic DEC.
    <br/>
    <br/>

    For (2), I think I just need to be clearer. Although it's possible that you becoming convinced of (1) would make this point moot, because you already think the existing classical solvers are better than just iteratively applying the probabilistic DEC to each clause and yet understand that those solvers still take exponential time. So I'll spend the rest of this response talking about that, though really (1) is probably most important.
    <br/>
    <br/>

    First, I think that putting all the probability in position 0 is representative of the actual random walk that occurs, in that it gives a useful lower bound on the true process. Recall that the biased random walk from position 0 to position 1000 represents the last 0.1% of the journey towards the solution state of a million bit variable assignment, where our states are actually groups of variable assignments with the grouping being done by the number of true bits in an assignment. So when we choose a random assignment at the start (or, equivalently, distribute the probability mass evenly over all assignments), the initial mass in group k is (k choose n)/2^n. This puts almost all of the mass in groups further than 1000 steps away from the solution; to the point where I actually can't get wolfram alpha to compute enough digits to distinguish CDF[BinomialDistribution[1000000, 0.5], 999000] from 1 (not too surprising, since the normal approximation gives mean=n/2=500 000 and standard deviation=sqrt(n/4)=500, so we're 998 standard deviations away from the mean!).
    <br/>
    <br/>

    Because groups that were further from group 1000000 than group 999000 must pass through group 999000 on their way to the solution, their expected-time-to-solution is lower bounded by group 999000's expected-time-to-solution. Groups past 999000 may get to the solution faster, but their starting probability mass is so insignificant that their contribution to the total expected time of all groups is negligible. We are helping far far far *far* *far* *FAR* more than we are hindering.
    <br/>
    <br/>

    You mentioned in your reply that step 0 is a second sink. That's not the case; I intended to communicate that it is a wall. We are clamping the biased random walk at or above group 999000, pushing assignments in the right direction so they leak towards the solution more quickly. This loosens the lower bound we'll compute, but simplifies the calculation.
    <br/>
    <br/>

    Does that make sense? Have I managed to explain why the 1000-step biased random walk from group 999000 to group 1000000 is a good approximate lower bound on the actual situation where we start off with a binomial distribution over all the groups?
    <br/>
    <br/>

    Since you want me to do the analysis in terms of eigenvectors, I'll also do a lower bound on the 1000-step biased random walk in those terms. The transition matrix for the 1000-step 2:1 biased random walk is:
    <br/>
    <br/>

    <pre>
│2 2 0 0 0 … 0 0 0│
│1 0 2 0 0 … 0 0 0│
│0 1 0 2 0 … 0 0 0│
│0 0 1 0 2 … 0 0 0│
⋮⋮ ⋮ ⋮ ⋮ ⋮ ⋱ ⋮ ⋮ ⋮⋮
│0 0 0 0 0 … 2 0 0│
│0 0 0 0 0 … 0 2 0│
│0 0 0 0 0 … 1 0 0│
│0 0 0 0 0 … 0 1 3│ / 3</pre>
    <br/>

    There are two eigenvalues we really care about here. The sink vector s=[0,0,0,...,1] with eigenvalue 1, and the next closest eigenvalue will be approximately 1 - (2^-n)/3 with n=1000 and an eigenvector approximately equal to d=[1, 1/2, 1/4, 1/8, ..., 1/2^998,1/2^999, 1/2^1000, -1]. You can already see <a href="https://www.wolframalpha.com/input/?i=eigenvectors+%7B%7B2%2C2%2C0%2C0%2C0%2C0%2C0%2C0%7D%2C%7B1%2C0%2C2%2C0%2C0%2C0%2C0%2C0%7D%2C%7B0%2C1%2C0%2C2%2C0%2C0%2C0%2C0%7D%2C%7B0%2C0%2C1%2C0%2C2%2C0%2C0%2C0%7D%2C%7B0%2C0%2C0%2C1%2C0%2C2%2C0%2C0%7D%2C%7B0%2C0%2C0%2C0%2C1%2C0%2C2%2C0%7D%2C%7B0%2C0%2C0%2C0%2C0%2C1%2C0%2C0%7D%2C%7B0%2C0%2C0%2C0%2C0%2C0%2C1%2C3%7D%7D%2F3">this approximation taking hold for n=8</a>. 
    <br/>
    <br/>

    Breaking down the state [1,0,0,0,...,0] in the eigenbasis would require considering the other eigenvectors. But we can still get a simple lower bound on the expected time by helpfully pushing some of the initial state towards the solution, and starting in the state ~[1/2, 1/4, 1/8, ..., 1/2^-1000, 0] instead. Then our initial state is ~ v+d, the evolution is approximated by v + d*(1 - (2^-1000)/3)^t, and it's clear that d's half-life is a LONG TIME so it will be a long time until we expect to be in the solution state. Exponential amounts of time, in fact.
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Nov 13, 2015
    <br/>

    Yes, I think that's a good summation.
    <br/>
    <br/>

    For #2, the paper's argument is not that the slowly decaying eigenvector decays at a particular rate, but rather that we can transfer population out of the slowly decaying eigenvector onto quickly decaying eigenvectors by changing the transfer matrix. (Which we can do, because we have lots of free parameters -- the number of times a particular clause is decimated, the decimation angle for a particular clause, etc.) So if V1 is the slowly decaying eigenvector for transfer matrix T1 and V2 is the slowly decaying eigenvector for transfer matrix T2, so that
    <br/>
    <br/>

    T1 V1 = V1 (V1 doesn't decay at all due to transfer matrix T1)
    T2 V2 = V2 (same goes for V2 and T2), and
    <br/>
    <br/>

    T2 V1 = A2 V2 + sum_{n} An W_n, (changing the transfer matrix transfers population out of V1 and populates the set of rapidly decaying eigenstates W_n, plus some population of the new slowly decaying state V2)
    <br/>
    <br/>

    It's a Sisyphus argument (there's an analogy to Sisyphus cooling). As soon as the system approaches the quasi equilibrium state of having only V1 populated (let's just go ahead and say that V1 doesn't decay at all), we change the system such that V1 is far from the new equilibrium, and the difference between V1 and V2 consists of rapidly decaying eigenvectors. So the population that we've nonadiabatically projected onto rapidly decaying eigenstates is transferred quickly to the solution states, and the population that was projected onto V2 sticks around decaying slowly.
    <br/>
    <br/>

    I think at this point it's clear that I need to make this argument better in the text of the paper, so I'll thank you for a good discussion and focus on doing that. Until next time!
    <br/>
    <br/>

    Zach 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Craig Gidney</strong> - Nov 16, 2015
    <br/>

    Hmm, I can see the intuitive draw of that; why it feels like it should work. And yet it seems to fail for biased random walks.
    <br/>
    <br/>

    I argued that a random walk with 2:1 backtracking-vs-advancing odds will take exponentially long expected time to reach the end state. We can cause a change in eigenvectors by varying the bias of the random walk from 2:1 against moving forward to 100:1 against moving forward. But periodically alternating between 2:1 and 100:1, rather than sticking with 2:1, isn't going to allow us to reach the end state more quickly: the 100:1 bias pulls even harder to the left than the 2:1 bias!
    <br/>
    <br/>

    I think that varying the decimation angle and how often a clause is decimated will have an effect on your solve time that's analogous to the effect that varying a random walk's leftward bias between 2:1 and 100:1 has on the reached-n'th-state time. There will be portions of the vector space that decay exponentially slowly across the whole parameter space. 
    <br/>
    <br/>
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Nov 14, 2015
    <br/>

    Ok, I figured out what's wrong in your toy model. You give a rate of population transfer for one random walker moving from the set of states with N Falses to the solution state with 0 Falses. But to get the transfer of population from our original state to our final state, we have to sum over all pathways in between.
    <br/>
    <br/>

    A state with 1000 Falses has 1000 ways to lose one False. A state with 999 Falses has 999 ways, and so on. So if we're only considering pathways that monotonically decrease N, we are considering N! pathways from a state with N Falses to a state with 0 Falses. Each of those will be exponentially suppressed, so that the population transfer due to any one walker is exponentially small. But factorially large beats exponentially small, so we still get efficient population transfer from our original state to the solution state.
    <br/>
    <br/>

    Note that this analysis doesn't conflict with the existence of slowly decaying near-equilibrium population distributions. 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Craig Gidney</strong> - Nov 15, 2015
    <br/>

    I think you forgot to account for backtracking when figuring out what's wrong with my toy model. There are more than Θ(N!) bit-toggle paths, because paths with backtracking are distinct. Also the possibility of backtracking forces our path count to depend on the number of steps taken. For example, if we hit N bits with T random toggles, then there are N^T paths instead of N!.
    <br/>
    <br/>

    Also keep in mind that the average path weight must be inversely proportional to the number of paths. When we allow backtracking and perform N random toggles on N bits, there's N! paths that go straight from the all-false state to the all-true state... but each path's weight is 1/N^N. So, despite there being factorially many ways to do it, the chance of reaching the solution as soon as possible drops as N increases because there are so many more backtracking paths than direct paths.
    <br/>
    <br/>

    My toy model does abstract factorially many non-backtracking paths into a single linear path from left to right, but I think any problems related to there being a lot of paths was accounted for when choosing the aggregate population transfer weights between the groups. I chose a 2/3 chance of backtracking and a 1/3 chance of advancing (for the last 0.1% of groups close to the solution, with a wall on the left and a sink on the right) based on the idea that at that point bit triplets with at least one false bit would probably not have another false bit. (Of course the algorithm doesn't pick triplets at random, it uses the given clauses. And it doesn't toggle if one bit doesn't match the solution, it toggles if ALL THREE don't match the CLAUSE. The mapping between the algorithm and the random process is definitely the weakest part of my argument; it relies on constructing hard inputs but I didn't figure out exactly what kinds of inputs would trigger the statistical behavior I intuited would apply. There are certainly classes of easy inputs that the algorithm will do fine on, such as [A∨B∨C] ∧ [D∨E∨F] ∧ [G∨H∨I] ∧ [J∨K∨L] ∧ [...]) 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Zach</strong> - Dec 22, 2015
    <br/>

    Hi again,
    <br/>
    <br/>

    The new version of the paper should be available today. I discuss tracing over scratch bits in more detail, and give a more detailed treatment of how changing the decimation angles projects the quasiequilibrium distribution onto quickly decaying eigendistributions. Enjoy! 
  </div>

  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>Craig Gidney</strong> - Jun 19, 2016
    <br/>

    I got around to reading the updated paper. See algorithmicassertions.com/post/1617
  </div>
</div>
