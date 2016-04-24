---
layout: post
title: "Eve's Quantum Clone Computer"
date: 2016-04-08 3:10:10 EST
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

[Last post](/2016/04/05/copying-a-quantum-brain.html), I tried to explain that interactions with the world can reveal the current state of a quantum system.

I framed the post around the hypothetical of duplicating a brain despite the brain containing quantum information.
I pointed to a couple examples of people saying it would be impossible to do that, since the [No-Cloning Theorem](https://en.wikipedia.org/wiki/No-cloning_theorem)'s prevents the duplication of unknown quantum states, then tried to explain a copying algorithm based on moving the brain into a quantum computer and recording any measurements the brain decided to perform.

Anyways, I didn't explain the concept very well and took flak from people thinking I was claiming obviously-wrong things.
So let's try this again, but slower.

# Hold my Qubit

Suppose Alice has some quantum information, but is storing it on Eve's quantum computer.
Alice doesn't own a quantum computer of her own.

Storing the information on Eve's computer is inconvenient.
Whenever Alice wants to apply an operation or measure a qubit, she has to ask Eve to do it for her.
Which is tedious.
Also there's the fact that Eve could be snooping on Alice's state... but Alice figures the quantum-ness probably protects against that somehow.
And it's not like she has any other option.

Here's a diagram of the situation:

<img src="/assets/{{ loc }}/alice_eve_diagram.png" style="max-width: 100%;"/>

Eve, being Eve, wants snoop on Alice's information.
Specifically, **she wants to make a copy of Alice's state** despite knowing nothing about the initial state and not daring to apply any operations Alice doesn't ask for.
That sounds quite hard (what with the quantumness), but Eve is nothing if not resourceful and patient.

Of course the no-cloning theorem guarantees Eve can't make a copy right away, but Eve doesn't care *when* the copy happens.
Eve would be happy with a copy of the initial state $\ket{\psi\_0}$, but a copy of the state-after-the-first-operation $\ket{\psi\_1}$ is just as good.
A copy of $\ket{\psi\_{2}}$ is also fine, as is a copy of $\ket{\psi\_{3823284}}$.
Eve will settle for a copy of $\ket{\psi\_{t}}$ for *any* step $t$.

In this situation, Alice is safe as long as she only applies unitary operations.
Rotating an unknown state doesn't tell you anything about it.
But, whenever Alice asks for a measurement, Eve gets to see the result.
Hmm...

# Catching a Qubit

Suppose Alice is storing only a single qubit in Eve's computer.
In this trivial case, the jig is up as soon as the first measurement is applied.
The measurement will collapse Alice's state to one of two possibilities, and the measurement result will tell Eve exactly which possibilities it was.

*(Note: Eve's computer only supports single-qubit measurements in the computational basis.
Weak measurement, or measurements in a different basis, have to be emulated.)*

Let's go over an example case, and see how Eve ends up with a copy of Alice's state:

1. Alice securely loads her state into Eve's computer.
     - The initial state happens to be $\ket{\psi\_0} = \frac{1}{\sqrt 2}\ket{0} - \frac{1}{\sqrt 2}\ket{1}$.
     - Eve doesn't know $\ket{\psi\_0}$, so she can't clone it.
2. Alice asks Eve to hit the state with a Z gate.
    - The state becomes $\ket{\psi\_1} = \frac{1}{\sqrt 2}\ket{0} + \frac{1}{\sqrt 2}\ket{1}$.
    - Eve still knows nothing, so no cloning can happen.
3. Alice asks Eve to measure the qubit.
    - The measurement result is "Off", which Eve reports.
    - Eve knows that "Off" corresponds to the state $\ket{0}$.
    - Eve initializes $q_{\text{copy}}$ to $\ket{0}$.
4. Eve wins.

*(Keep in mind that Eve didn't clone Alice's original qubit.
Eve cloned a post-measurement state, not the preceeding unmeasured state.
That's why we aren't violating the no-cloning theorem.)*

The single qubit case is kind of boring, as you can see.
Eve never has partial information about the qubit; it's all or nothing.
To make the situation less black and white, we need more qubits.

# Analyzing a 2-Qubit System

Suppose Alice is storing two qubits, $q\_1$ and $q\_2$, on Eve's computer.
This is a big step up from one qubit, because Alice can mix things up between measurements.
Eve may never see a snapshot of the whole state.

There's a lot that could be said about the 2-qubit case, but let's focus on one particular type of thing Alice can do: obscuring a value with a unitary operation.
Alice will repeatedly ask Eve to CNOT $q\_1$ onto $q\_2$, and to measure then clear $q\_2$, but to protect $q\_1$ Alice will apply an operation $U = \bimat{a}{b}{c}{d}$ to $q\_2$ just before the measurement.

Here's a circuit diagram showing the operations Alice will ask Eve to apply:

<img src="/assets/{{ loc }}/2qubit_example_circuit.png" style="max-width: 100%;"/>

Will Eve be able to infer the value of $q\_1$ by recording the measurements of $q\_2$?
To answer that question, we need to understand how $q\_1$ is affected by the repeated operations.
(Yes, it's affected despite only being used as a control.)

Suppose $q\_1$ starts in the state $x \ket{0} + y \ket{1}$.
So the system as a whole is in the state:

$$\ket{\psi\_t} = x \ket{00} + y \ket{10}$$

Apply the CNOT. The new state is:

$$\ket{\psi_{t+1}} = x \ket{00} + y \ket{11}$$

Now apply $U$, advancing the state to:

$$\ket{\psi_{t+2}} = x a \ket{00} + x b \ket{01} + y c \ket{10} + y d \ket{11}$$

Lastly, measure $q\_1$ and clear it.
There are two possible output states, one for the OFF measurement outcome and one for the ON outcome:

$$\begin{align}
\ket{\psi\_{t+3,\text{ON}}} &= \frac{x b \ket{00} + y d \ket{10}}{\sqrt{|xb|^2 + |yd|^2)}}
\\\\
\ket{\psi\_{t+3,\text{OFF}}} &= \frac{x a \ket{00} + y c \ket{10}}{\sqrt{|ax|^2 + |yd|^2}}
\end{align}$$

Okay... those normalization factors are pretty gross.
Let's ignore them by focusing on *proportions* instead of exact amplitudes.
The proportional squared magnitudes for OFF:ON are:

$$\begin{align}
Q\_t &= |x|^2:|y|^2
\\\\
Q\_{t+3,OFF} &= |xa|^2:|yc|^2
\\\
Q\_{t+3,ON} &= |xb|^2:|yd|^2
\end{align}$$

Based on $U=\bimat{a}{b}{c}{d}$ being unitary, we know that $|a|^2=|d|^2$ and $|b|^2 = |c|^2 = 1 - |a|^2$.
Also we know that $|x|^2 = 1 - |y|^2$.
That lets us cut the number of involved variables:

$$\begin{align}
Q\_t &= 1-|y|^2:|y|^2
\\\\
Q\_{t+3,OFF} &= (1-|y|^2)|a|^2:|y| (1-|a|^2)
\\\
Q\_{t+3,ON} &= (1-|y|^2) (1-|a|^2):|y|^2 |a|^2
\end{align}$$

By defining $r\_u = \frac{|a|^2}{1-|a|^2}$, we can simplify even further:

$$\begin{align}
Q\_t &= 1-|y|^2:|y|^2
\\\\
Q\_{t+3,OFF} &= (1-|y|^2) \cdot r\_u:|y|^2
\\\
Q\_{t+3,ON} &= 1-|y|^2:|y|^2 \cdot r\_u
\end{align}$$

Our final simplification is to switch from odds $Q$ to [log-odds](https://wiki.lesswrong.com/wiki/Log_odds) $\tilde Q$:

$$\begin{align}
\tilde Q\_t &= \lg |y|^2 - \lg(1-|y|^2)
\\\\
\tilde Q\_{t+3,OFF} &= \tilde Q\_t - \lg r\_u
\\\
\tilde Q\_{t+3,ON} &= \tilde Q\_t + \lg r\_u
\end{align}$$

So we start at some value $\tilde Q$ then stochastically either add or subtract a constant...

Oh!
The qubit is performing a [random walk](https://en.wikipedia.org/wiki/Random_walk) in log-odds space!
We just need to know what the limiting behavior of the walk is.
That's not *immediately* clear, because the probability $p$ of stepping forwards isn't constant.
$p$ depends on $\ket{\psi}$ in addition to $U$:

$$\begin{align}
p &= |xb|^2 + |yd|^2
\\\\&=
(1-|y|^2) (1-|a|^2) + |a|^2 |y|^2
\\\\&=
\text{lerp}(|y|^2, 1-|a|^2, |a|^2)
\end{align}$$

Okay, so the probability is a [linear interpolation](https://en.wikipedia.org/wiki/Lerp_%28computing%29) from $1-|a|^2$ to $|a|^2$, controlled by $|y|^2$.
What does that mean?

Roughly speaking, $|a|^2$ corresponds to how much $U$ likes to toggle its input.
When $|a|^2$ is near 0, $U$ tends to not toggle its input.
OFF stays OFF, and ON stays ON.
Around $|a|^2=0.5$ the toggling is completely unpredictable.
When $|a|^2$ is near 1, $U$ tends to always toggle its input.
OFF and ON get swapped.

$|y|^2$ is the probability of $q\_1$ being ON.
So, as $q\_1$ transition from mostly-ON to mostly-OFF, $p$ transitions from $U$'s toggly-ness to the complement of $U$'s togglyness.

We now have enough information to summarize wether steps are biased positive-ward (towards ON) or negative-ward (towards OFF) for various cases.
Note that we have to take into account both the bias in the probability and the sign of $\lg r\_u$:

<style>
  table, th, td {
    border: 1px solid black;
    border-collapse: collapse;
    text-align: center;
    padding: 2px;
  }
</style>
<table>
  <tr>
    <td>State\Operation</td>
    <td>Not Toggly<br/>$|a|^2 \approx 1, \lg r_u >> 0$</td>
    <td>Less Toggly<br/>$\lg r_u > 0$</td>
    <td>50% Toggly<br/>$|a|^2 = 0.5, \lg r_u = 0$</td>
    <td>More Toggly<br/>$\lg r_u < 0$</td>
    <td>Very Toggly<br/>$|a|^2 \approx 0, \lg r_u << 0$</td>
  </tr>
  <tr>
    <td>Very OFF<br/>$p \approx 1-|a|^2$</td>
    <td>----</td>
    <td>--</td>
    <td>0</td>
    <td>--</td>
    <td>----</td>
  </tr>
  <tr>
    <td>Slightly OFF</td>
    <td>--</td>
    <td>-</td>
    <td>0</td>
    <td>-</td>
    <td>--</td>
  </tr>
  <tr>
    <td>50% ON<br/>$p = 0.5$</td>
    <td>0</td>
    <td>0</td>
    <td>0</td>
    <td>0</td>
    <td>0</td>
  </tr>
  <tr>
    <td>Slightly ON</td>
    <td>++</td>
    <td>+</td>
    <td>0</td>
    <td>+</td>
    <td>++</td>
  </tr>
  <tr>
    <td>Very ON<br/>$p \approx |a|^2$</td>
    <td>++++</td>
    <td>++</td>
    <td>0</td>
    <td>++</td>
    <td>++++</td>
  </tr>
</table>

The important thing to notice about the above table is that the bias is OFF-ward when the state is OFF-ish, and ON-ward when the state is ON-ish.
In other words, the bias is *away from the origin*: the random walk will diverge to one of the infinities and it won't keep coming back to the origin.
Thus $q\_1$ almost surely converges to ON or converges to OFF.
(Unless $U$'s togglyness is on that 50% line, where the step size is 0.)

Based on the analysis we just did, Eve will succeed at making a copy of Alice's state.
She just has to wait long enough for the states to converge.
But let's actually simulate what happens.

# Simulating a 2-Qubit Inferrence

How can Eve track the state of Alice's system, without knowing the exact state?

Here's a really naive idea: write down a list of all the possible states, and simulate applying Alice's requested operations to each of them.
When Alice says to rotate a qubit around the X axis, go through every single entry in the list and apply that rotation around the X axis.
When Alice says to measure a qubit, do the measurement but then post-select every entry in the list to match the result.
If the entries are ever all in basically the same spot, that's Alice's state.

Of course we can't actually list *all* the possible quantum states, since there's uncountably many of them.
But we can cover the state space as densely as desired, so that the true state is at most $\epsilon$ away from one of the entries in the list.
(This is all horrendously inefficient, but let's ignore that for now.)

It's straightforward to write hacky code that generates possible quantum states and simulates how those states change as Eve forces them to track what's happening to Alice's state.
We can even give a nice representation of the list of states, by plotting entries onto the Bloch sphere (although there's 2 qubits in the state, one is known thanks to the measurements; plot the other one).

If you write [that hacky code](/assets/{{ loc }}/infer-from-noisy-related-measurement.js), and set $U$ to be a 75-degree rotation around the Y axis, you'll see roughly this:

<img src="/assets/{{ loc }}/infer-from-noisy-related-measurement.gif" style="max-width: 100%;"/>

As you can see, the states flicker back and forth as the random walk plays out.
Eventually the true state is far enough from the equator that the likelihood of overcoming the outward bias and returning to the equator is negligible.
It gets pulled into a pole, and the other states get pulled along with it.

It's possible to create 2-qubit cases where Eve's inferrence process *won't* converge like this one does, but before we talk about that we should talk about density matrices.

# Density Matrices and Inefficiency

The inferrence-by-state-listing process I described above is simple, but horrendously inefficient.
We're creating absurdly many states to get good coverage of the state space... and yet all the states end in the same place.
There's obvious room for improvement.

A much better way to track what you know about a quantum state is the humble [density matrix](https://en.wikipedia.org/wiki/Density_matrix).

I won't be explaining how density matrices work in this post.
Suffice it to say that, given a probability distribution of possible quantum states, you can compute a corresponding density matrix.
And that it's easy to apply operations and measurements and post-selections to density matrices.
And that if two probability distributions of states have the same density matrix, then those two distributions are observationally indistinguishable.

Basically, instead of tracking who-knows-how-many states, we're going to be applying operations to a single $2^n \times 2^n$ matrix.
This is not only more efficient, it allows us to use standard methods for computing how much uncertainty is left in the inferrence process (via the [Von Neumann entropy](https://en.wikipedia.org/wiki/Von_Neumann_entropy)) and for comparing our inferred state to the true state (via the [trace distance](https://quantiki.org/wiki/trace-distance)).

Of course, operating on a $2^n \times 2^n$ amtrix is *kind of expensive*.
This updated inferrence algorithm is better, but still hopelessly intractable before the number of qubits $n$ gets anywhere near 100.
The algorithm will work in small cases, but for large cases it's merely a demonstration that security-against-cloning is based on a [computational hardness assumption](https://en.wikipedia.org/wiki/Computational_hardness_assumption) instead of being [unconditionally secure](https://en.wikipedia.org/wiki/Information-theoretic_security).

I tried to prove that the hardness assumption we're making is strong, but didn't manage to do so.
Making an inferred copy *smells* NP-Hard to me, but every time I try to make a reduction from 3-SAT or whatever I find that I forced Alice to find the solution instead of forcing Eve to find the solution.

*(Eve's task is trivial if she has a [PostBQP machine](https://en.wikipedia.org/wiki/PostBQP).)*

# Simulating More Qubits Being Inferred

To show that the density matrix solution actually works, I implemented it.
You can find the code [on github in the Eve-Quantum-Clone-Computer repository](https://github.com/Strilanc/Eve-Quantum-Clone-Computer).

For the example inferrence animated below, I tried to pick some interesting operations to apply.
First, entropy that can't be predicted by Eve is generated.
The first qubit keeps getting put into the state $\ket{0} + \ket{1}$ and measured.
Alice even mixes in some extra entropy she generated herself.
Second, the effects of the second qubit on the observed measurements are doubly-indirect: it partially rotates the third qubit, which partially rotates the measured qubit.

Here's the actual Alice code I used:

    import Matrix from "src/math/Matrix.js"
    import EveQuantumComputer from "src/EveQuantumComputer.js"

    let numQubits = 4;
    let qpu = EveQuantumComputer.withRandomInitialState(numQubits);

    // Pre-compute matrices for operations.
    let X0 = qpu.expandOperation(Matrix.PAULI_X, 0); // X gate on qubit 0.
    let X3 = qpu.expandOperation(Matrix.PAULI_X, 3);
    let H0 = qpu.expandOperation(Matrix.HADAMARD, 0);
    let CNOT_2_ONTO_3 = qpu.expandOperation(Matrix.PAULI_X, 3, [2]);
    let SMALL_Y_ROT_1 = qpu.expandOperation(
      Matrix.fromAngleAxisPhaseRotation(Math.PI/3, [0, 1, 0]),
      1);
    let SMALL_X_ROT_2_WHEN_1 = qpu.expandOperation(
      Matrix.fromAngleAxisPhaseRotation(Math.PI/4, [1, 0, 0]),
      2,
      [1]);
    let CONFOUNDING_X3 = qpu.expandOperation(
      Matrix.fromAngleAxisPhaseRotation(Math.PI/2 + 0.4, [1, 0, 0]),
      3);
    
    qpu.drawLoop(() => {
      let generatedEntropy = qpu.measureQubit(0);
      if (Math.random() < 0.3) { // Alice adding in her own home-grown entropy.
        generatedEntropy = !generatedEntropy;
      }
      if (generatedEntropy) {
        qpu.applyOperation(SMALL_Y_ROT_1);
        qpu.applyOperation(X0);
      }
      qpu.applyOperation(H0); // Ensure next measurement of qubit 0 is 100% noise.

      qpu.applyOperation(SMALL_X_ROT_2_WHEN_1); // 2 is affected by 1.
      qpu.applyOperation(CNOT_2_ONTO_3); // And 3 is affected by 2.
      qpu.applyOperation(CONFOUNDING_X3); // But the dependence is hidden by noise.
      let measureResult = qpu.measureQubit(3);
      if (measureResult) {
        qpu.applyOperation(X3); // Clear.
      }
    });

And here's how the inferrence process played out:

<img src="/assets/{{ loc }}/infer_4qubits_density_matrix.gif" style="max-width: 100%;"/>

As you can see, Eve eventually managed to infer a pretty good copy of Alice's state despite my attempts to make things difficult.

You can test out your own cases by cloning the repository and editing `src/main.js`.

# The Uncloneable

At this point I think I've very definitively established that *sometimes* Eve can clone the eventual state of Alice's system.
I mean, I literally provided working code.
But there are also situations where Eve *can't* clone Alice's state.

Our first clone killer is *unused qubits*.
For example, suppose Alice initializes 10 qubits but only ever uses the first 5.
Clearly Eve is not going to be able to learn anything about the unused qubits: they never affect any measurements!
On the other hand, if they *literally never affect any measurement*, maybe it's not such a big deal that Eve couldn't infer them.
Maybe we shouldn't be thinking of our goal as "duplicate the state" but instead as "correctly future measurement probabilities", since that's what matters in practice.

For example, a  quantum catalyst.

Also note that there may be unrevealed details even if all qubits are used.
It just might be mixed away from measurements.

But on the other other hand, determining if an Alice program will use a particular qubit is uncomputable.
So it would be quite difficult to design a good stopping condition.
At least when we know all the qubits we notice that the entropy drops to 0.

Our second clone killer is external entanglement.
In the toy model I presented, Eve's computer is an isolated system.
It's not interacting with other quantum computers out of Eve's control.
But if it did, then Alice could do things like exchange EPR pairs with Bob.
And half of an EPR pair is *really truly literally* impossible to clone.
It literally makes no sense; you might as well add meters and seconds.
It's a type error.

Our third clone killer is *size*.
Because Eve's inferrence algorithm scales like $\Omega(4^n)$, even a 100 qubits makes the problem hopelessly intractable.

# Objections Answered

- **Doesn't radnomness get unavoidably added into the state when measuring along non-commuting observables and degrade Eve's estimate?**

    *(For example, keep setting a qubit to $\ket{0} + \ket{1}$ and measuring it to build up unknown-to-Eve information.)*

    No.
    Entropy does get added into the state by the measurement, but then it's revealed by the measurement result.

    The 4-qubit example above actually tries to do this, and it doesn't hurt the inference process at all.
    Eve can lose ground when unlikely measurements keep happening, biasing the inferrence towards a wrong answer, but the overall tendency is to gain ground.

- **What about ancilla qubits that don't get measured (e.g. as in the Deutch-Josza algorithm)?**

    After the algorithm is over, the ancilla can be measured.
    They have to be, if you want to clear them for the next run.
    
    Secondarily, many algorithms have unnecessary Ancilla whose state is known or implied by the measurements that *are* performed.
    Deutch-Josza is an example.

- **Doesn't this violate the no-cloning theorem?**

    No.
    We're not cloning an unknown state, we're producing a known state.
    What's interesting is how we came to know it.

- **In practice wouldn't measurement error and other intrinsic sources of noise be a problem?**

    Maybe.
    It might also be a resource.
    For example, all the states reachable by plausible noise could count as copies for our purposes.

- **The inferrence process is absurdly intractable.**

    Yup.
    Still, the existence of an inferrence process downgrades security from [unconditional](https://en.wikipedia.org/wiki/Information-theoretic_security) to [computational-hardness-assumption](https://en.wikipedia.org/wiki/Computational_hardness_assumption).

- **Doesn't the fact that we know the state or copied the state make it collapse / prevent it from being in superposition?**

    No.
    If we were making entangled copies, instead of independent copies, this would be a problem.

- **This is obvious and trivial.**

    Maybe.
    But people do say things along the lines of "if brains are quantum then the No-Cloning Theorem means brains can't be copied even in principle".
    If it was truly drop-dead obvious, they wouldn't say that.

# Summary

Sometimes, when a quantum system keeps interacting with the world, you can gradually infer its true state.
Once you know the state, making copies is easy.

In terms of brains, making a brain 'quantum' is not sufficient for [unconditional security](https://en.wikipedia.org/wiki/Information-theoretic_security) against duplication.
You still get security from computational hardness, but unconditional security requires stronger assumptions than just 'quantum' (such as sharing EPR pairs with other brains).

- Mention that in practice Eve may be able to do things that Alice can't detect and this would make her stronger than I'm considering
- 