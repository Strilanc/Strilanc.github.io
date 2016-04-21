---
layout: post
title: "Eve's Quantum Clone Computer"
date: 2016-04-08 3:10:10 EST
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

[Last post](/2016/04/05/copying-a-quantum-brain.html), I tried to explain how the [No-cloning theorem](https://en.wikipedia.org/wiki/No-cloning_theorem) doesn't always stop you from duplicating a continuously-interacting-with-the-world system like a brain.
But I didn't explain it very well, and took flak from people thinking I was claiming obviously-wrong things.
So let's try this again.

Instead of focusing on brains, let's start somewhere simpler.

# Hold my Qubit

Suppose Alice has some quantum information $q$.
However, Alice doesn't own a quantum computer; she doesn't have a way to store or operate on $q$.
Instead, Alice is storing $q$ on Eve's quantum computer.
Whenever Alice wants to apply an operation to $q$, or measure $q$, she asks Eve to do it.

The situation in diagram form:

<img src="/assets/{{ loc }}/alice_eve_diagram.png" style="max-width: 100%;"/>

**Eve doesn't know the value of $q$, and won't apply any operations Alice doesn't ask for, but wants to make a copy of $q$.**

The no-cloning theorem stops Eve from making a copy right away, but **Eve doesn't care _when_ the copy happens**.
Eve would be happy with a copy of the initial state $\ket{\psi\_0}$, but a copy of the state-after-the-first-operation $\ket{\psi\_1}$ is just as good.
A copy of $\ket{\psi\_{2}}$ is also fine, as is a copy of $\ket{\psi\_{3823284}}$.
Eve will settle for a copy of $\ket{\psi\_{t}}$ for **any** $t$.

If Alice only applies unitary operations, Eve won't ever learn anything and won't be able to make a copy.
But whenever Alice asks for a measurement, Eve gets to see the result...

# Catching a Qubit

Suppose Alice is storing only a single qubit in Eve's computer.
In this trivial case, any measurement at all ups the jig.
The measurement will collapse the qubit to one of two states, and the measurement result will tell Eve exactly which state it was.

Suppose $\ket{\psi\_0} = \frac{1}{\sqrt 2}\ket{0} - \frac{1}{\sqrt 2}\ket{1}$.
Eve doesn't know $\ket{\psi\_0}$, so she can't clone it.
Then Alice asks Eve to hit the state with a Z gate, meaning $\ket{\psi\_1} = \frac{1}{\sqrt 2}\ket{0} + \frac{1}{\sqrt 2}\ket{1}$.
Eve also doesn't know $\ket{\psi\_1}$, so no cloning can happen.
But then Alice asks Eve to measure $q$.
She does, and the measurement result is "Off".

Eve knows the measurement result was "Off", and knows that "Off" corresponds to $\ket{0}$.
Eve initializes $q_{copy}$ to $\ket{0}$, and succeeds at her goal of having a copy of Alice's state.
(Keep in mind that Eve didn't clone Alice's *original* qubit.
Eve copied a post-measurement state, not the preceeding unmeasured state.
That's why we aren't violating the no-cloning theorem.)

The single qubit case is trivial because Eve always goes all the way from "no idea what the state is" to "complete knowledge of the state" in a single step.
To make the situation a bit less black and white, we need more qubits.

# Inferring an Unmeasured Qubit

Suppose Alice is storing two qubits, $q\_1$ and $q\_2$, on Eve's computer.
The overall situation is the same (Alice requests operations and measurements, Eve does exactly what she's told while trying to infer the state), but now a measurement will only *partially* collapses the state of the system.
And Alice can mix up the qubits between measurements, so they never quite reveal the whole state.

How might Eve go about inferring the current state of the system?

Here's a really simple idea: write down a list of all the possible states, and simulate applying Alice's requested operations to all of them.
When Alice says to rotate a qubit around the X axis, you go through every single entry in the list and apply that rotation around the X axis.
When Alice says to measure a qubit, you do the measurement but then post-select every entry in the list to match the result.
Once all the entries are in basically the same spot, that's Alice's state.

Of course we can't actually list *all* the possible quantum states, since there's uncountably many of them.
But we can cover the state space as densely as desired, so that the true state is at most $\epsilon$ away from one of the entries in the list.
(This is all horrendously inefficient, but let's ignore that for now.)

Let's focus on one particular case, where Alice keeps asking Eve to do the same thing over and over again.
Specifically, Alice keeps saying to hit $q\_2$ with a CNOT controlled by $q\_1$, rotate $q\_2$ around the X axis by 85 degrees, measure $q\_2$, and repeat.

Note that $q\_1$ is never measured, but it affects how likely it is for $q\_2$ to stay the same or toggle.
If $q\_1$ is Off, $q\_2$ toggles 54% of the time.
If $q\_1$ is On, $q\_2$ toggles 46% of the time.
And if $q\_1$ is in a superposition of Off and On, its slight control over $q\_2$ gradually pulls it towards the all-Off or all-On states (yes, really!).

In the following diagram, each red circle represents a list entry, and the position of the circle is the entry's value for $q\_1$ on the Bloch sphere.
It considers a very specific case, where the measurement results keep returning "On":

<img src="/assets/{{ loc }}/infer-from-noisy-related-measurement.gif" style="max-width: 100%;"/>

As you can see, the states all get quickly pulled towards the $\ket{1}$ state.
Of course we cheated by forcing all the measurements of $q\_2$ to come up as $\ket{1}$, instead of determining them probabilistically based on a true $q\_1$.
But the same things happen when you run a proper simulation, just with janky noisy backtracking.
You can see a proper animation by [running the noisy code on jsFiddle](https://jsfiddle.net/dv36p4fa/) ([backup copy](/assets/{{ loc }}/infer-from-noisy-related-measurement.js)).
Give it a minute to converge.

In this case, Eve won't be able to make a perfect copy of Alice's state.
But, by waiting long enough, she can make an arbitrarily accurate copy.
If Alice's initial state was $q\_1 = 0.8 \ket{0} + 0.6 \ket{1}$ then, after a thousand cycles of the example instructions, Eve has effectively learned whether the state was pulled into $\ket{0}$ or into $\ket{1}$.

It's possible to create 2-qubit cases where Eve's inferrence process *won't* converge, but before we talk about that we should talk about density matrices.

# A Density Matrix is Better, but still Inefficient

The state-listing process I described above is simple, but horrendously inefficient.
Getting good coverage of the state space takes absurdly many points.
There's a much better way to track what you know about a quantum state: the [density matrix](https://en.wikipedia.org/wiki/Density_matrix).

I won't be explaining how density matrices work in this post.
Suffice it to say that, given a probability distribution of possible quantum states, you can compute a density matrix.
And that it's easy to apply operations and measurements and post-selections to density matrices.
And that if two probability distributions of states have the same density matrix, then those two distributions are observationally indistinguishable.

Basically, instead of tracking who-knows-how-many states, we're going to be operating on one $2^n \times 2^n$ matrix.
This will scale a lot better than the list of points... but is still going to be hopelessly expensive before $n$ gets anywhere near 100.

I think the inferrence problem Eve is forced to solve is unavoidably expensive, even with a quantum computer, but I haven't been able to prove it.
It smells NP-Hard to me.
But every time I come up with a reduction, I realize I assumed some exponentially unlikely measurements would happen.

Still, we can simulate small cases.

# Simulation

To show that the density matrix solution actually works, I implemented it.
You can find the code [on github in my Eve-Quantum-Clone-Computer repository](https://github.com/Strilanc/Eve-Quantum-Clone-Computer).

For example, I produced this animation of Eve inferring a 4-qubit state:

<img src="/assets/{{ loc }}/infer_4qubits_density_matrix.gif" style="max-width: 100%;"/>

by actually simulating the situation. Specifically, I ran this:

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
    
You can test out your own cases by cloning the repository and editing `src/main.js`.

(*Fair wairning: the drawing is quite expensive, because it does eigendecomposition to compute the trace distance and the Von Neumann entropy, so don't expect blazing-fast speeds.*)

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
