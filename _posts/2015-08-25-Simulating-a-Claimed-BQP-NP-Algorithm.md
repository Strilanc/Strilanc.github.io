---
layout: post
title: "Simulating a Claimed NP=BQP Algorithm"
date: 2015-08-25 11:30:00 EST
categories: quantum
comments: true
---

[Last time](/quantum/2015/08/01/Checking-a-Claimed-BQP-NP-Algorithm.html), I summarized [a paper by Younes et al.](http://arxiv.org/abs/1507.05061) claiming to contain a polynomial-time quantum algorithm for an NP-Complete problem. Younes et al. left a comment disagreeing with the argument I gave (that moving the measurements around had no effect on the result).

Explaining why and when the deferred measurement principle works would make a good topic for a post... but instead why don't we just simulate the algorithm and see what happens?

# A Minimal Quantum Simulation Engine

Simulating a quantum circuit is not magic.
Qubits occupy a well defined state space, and operations affect states from that space in a well defined way.
Once you get past the rules being unfamiliar and counter-intuitive, but before you slam into the computational wall caused by the number of qubits increasing, it's not that hard to do.

All of the code used by this post [is available on github](https://github.com/Strilanc/qbp_np_younes_test).

The state of a quantum circuit can always be described as a so-called "[mixed state](https://en.wikipedia.org/wiki/Quantum_state#Mixed_states)". A mixed state is a probability distribution of "[pure states](https://en.wikipedia.org/wiki/Quantum_state#Pure_states)". A pure state is a superposition of classical states, and can represent the state of a quantum circuit as long as measurements and uncertainty aren't involved. A classical state is just an assignment of boolean values to each qubit: qubit #1 is Off, qubit #2 is On, etc.

We'll need programmatic representations of all three levels (classical, pure, and mixed) if we want to do any simulating.

A very convenient way to store a bunch of boolean values is as an integer [bitmask](https://en.wikipedia.org/wiki/Mask_%28computing%29), so that's what I did in my implementation.
The [ClassicalState class](https://github.com/Strilanc/qbp_np_younes_test/blob/master/classical_state.py) is a handful of convenience methods wrapped around an integer value, and that's it.

    >>> print(ClassicalState(5))
    |00000101〉
    >>> print(ClassicalState(5).bit(2))
    True

A pure state is a weighted combination of classical states (a "superposition"), with the caveat that if you sum the squares of all the weights (or "amplitudes") you must get a total of 1.
The [PureState class](https://github.com/Strilanc/qbp_np_younes_test/blob/master/pure_state.py) uses a map to store the pure state: the keys are the classical states, and the associated values are the amplitudes.

    >>> print(PureState({
            ClassicalState(2): -0.8,
            ClassicalState(7): 0.6j
        }))
    -0.800*|00000010〉 + 0.600j*|00000111〉

A mixed state is also a weighted combination, but this time the values are pure states instead of classical states and the weights are probabilities instead of amplitudes.
The [MixedState class](https://github.com/Strilanc/qbp_np_younes_test/blob/master/mixed_state.py) uses a map to store the mixed state: the keys are the pure states, and the associated values are the probabilities.

    >>> print(MixedState({
            PureState({ClassicalState(4): -1}): 0.25,
            PureState({ClassicalState(5): math.sqrt(0.5), ClassicalState(6): -math.sqrt(0.5)}): 0.75
        }))
    75.0%: 0.707*|00000101〉 + -0.707*|00000110〉
    25.0%: -1.000*|00000100〉

There are two types of operations that you can apply to quantum states: unitary operations, and measurement operations.
Roughly speaking, unitary operations turn classical states into pure states whereas measurement operations turn pure states into mixed states.

A [unitary operation](https://en.wikipedia.org/wiki/Unitary_matrix) projects classical inputs into a superposition of outputs.
When applied to a mixed state, a unitary operation just gets forwarded directly onto the contained pure states.
When applied to a pure state, a unitary operation distributes linearly: it gets forwarded to each sub-case, the outputs' weights are scaled by the corresponding amplitude or probability, and the whole set of results gets flattened back down into a superposition by interfering colliding outputs.
The main restriction on unitary operations is that they must preserve sum-of-squares-equals-1 property in all possible cases (i.e. the output vectors for each possible input must be orthonormal).

    >>> hadamard_first_bit = lambda c: PureState({
            c.with_bit(0, False): math.sqrt(0.5),
            c.with_bit(0, True): -math.sqrt(0.5) if c.bit(0) else +math.sqrt(0.5)
        })
    >>> input = MixedState({
            PureState({ClassicalState(4): -1}): 0.25,
            PureState({ClassicalState(5): math.sqrt(0.5), ClassicalState(6): -math.sqrt(0.5)}): 0.75
        })
    >>> print(input.unitary_transform(hadamard_first_bit))
    75.0%: 0.500*|00000100〉 + -0.500*|00000101〉 + -0.500*|00000110〉 + -0.500*|00000111〉
    25.0%: -0.707*|00000100〉 + -0.707*|00000101〉

A measurement operation allows information about a pure state to escape into the environment.
Cases that have been distinguished in this way can no longer interfere, so they become separate branches of a mixed state.
Although more general kinds of measurement are possible, in the code I they just distinguish flase cases from true cases:

    >>> value_of_first_bit = lambda c: c.bit(0)
    >>> input = MixedState({
            PureState({ClassicalState(4): -1}): 0.25,
            PureState({ClassicalState(5): math.sqrt(0.5), ClassicalState(6): -math.sqrt(0.5)}): 0.75
        })
    >>> print(input.measure(value_of_first_bit))
    37.5%: -1.000+0.000j*|00000110〉
    37.5%: 1.000+0.000j*|00000101〉
    25.0%: -1.000+0.000j*|00000100〉

The code also supports post-selecting, where you "force" a particular measurement outcome to happen and get to play with the resulting renormalized subset of states.
In practice this is done by simply repeating experiments until the desired measurement happens, so the post-selection method also outputs how likely you are to succeed:

    >>> print(input.post_select(value_of_first_bit))
    (0.3750000000000001, MixedState({PureState({ClassicalState(5): (1+0j)}): 1.0}))

# Simulating Younes et al's Algorithm

Younes et al's algorithm is implemented in the [younes_test.py file](https://github.com/Strilanc/qbp_np_younes_test/blob/master/younes_test.py).

The code sets up useful values:

    def simulate_younes_algo(anti_clauses):
        n = max(max(used_variables) for used_variables in anti_clauses) + 1
        m = len(anti_clauses)
        var_bits = range(n)
        clause_bits = range(n, n + m)
        ancilla_bit = n + m

        state = MixedState({PureState({ClassicalState(0): 1}): 1})

Superposes the variable-assignment bits and initializes the clause bits:

        for i in var_bits:
            state = state.unitary_transform(hadamard_op(i))
        for j in range(m):
            state = state.unitary_transform(not_op(n + j))
            state = state.unitary_transform(
                controlled_by(not_op(n + j), anti_clauses[j]))

And does the iterative filtering work:

        while True:
            [... track and output debug info ...]

            for j in clause_bits:
                v = controlled_by(
                    partial_x_rotation_op(ancilla_bit, m),
                    {j: True})
                state = state.unitary_transform(v)
            p_survive, state = state.post_select(bit_check_predicate(ancilla_bit))
            state = state.unitary_transform(not_op(ancilla_bit))

To test the algorithm, I picked a trivial 3-SAT instance where the only solution is assigning True to all of the variables:

    simulate_younes_algo(anti_clauses=[
        # Force 0 true
        {0: False, 1: False, 2: False},
        {0: False, 1: True, 2: False},
        {0: False, 1: False, 2: True},
        {0: False, 1: True, 2: True},

        # Force 1 true
        {0: True, 1: False, 2: False},
        {0: True, 1: False, 2: True},

        # Force all true
        {0: True, 1: True, 2: False},
        {0: True, 1: True, 3: False},
        ...
    ])

So how did it go?

# Results

I tracked two things as the algorithm ran: the probability that the algorithm had not been forced to restart due to measuring a bad value after the partial rotation (`p_survived`) and the probability of observing the solution if the clause and variable-assignment bits were measured given the current state. (`p_correct`).

Having a low `p_survived` is bad, because it acts as an inverse-multiplier on the running time.
If you only have a 1% chance of surviving, you'll expect to run the algorithm 100 times before reaching the current point.
Having a low `p_correct` is also bad, and it also acts an inverse-ultiplier on the running time.
If you only have a 1% chance of seeing the correct answer at the current point, you'll expect to need to get here a 100 times before seeing the correct answer.

Since both probabilities act as inverse-multipliers on the running time, and their effects stack, I'll also track their product.

Initially, `p_survived` is 100% and `p_correct` is $\frac{1}{2^n}$ where $n$ is the number of qubits.
In my test I used 11 qubits, so `p_correct` is initially $\frac{1}{2048} \approx 0.0488%$.

What we *want* to happen as the algorithm runs is for `p_correct` to trend upward towards 100%.
More importantly, we want it to trend upward *faster* than `p_survived` is trending downward, because if `p_correct*p_survived` doesn't go up then we're just trading bad-result-failures for restart-failures.

So, we run the program and we get...

    iter 0;      p_survived: 100.0000%;  p_correct: 0.0488%;     p_correct*p_survived: 0.0488%
    iter 10;     p_survived: 71.6915%;   p_correct: 0.0681%;     p_correct*p_survived: 0.0488%
    iter 100;    p_survived: 25.2162%;   p_correct: 0.1936%;     p_correct*p_survived: 0.0488%
    iter 200;    p_survived: 8.4309%;    p_correct: 0.5792%;     p_correct*p_survived: 0.0488%
    iter 300;    p_survived: 2.8427%;    p_correct: 1.7177%;     p_correct*p_survived: 0.0488%
    iter 400;    p_survived: 0.9801%;    p_correct: 4.9819%;     p_correct*p_survived: 0.0488%
    iter 500;    p_survived: 0.3592%;    p_correct: 13.5918%;    p_correct*p_survived: 0.0488%
    iter 600;    p_survived: 0.1523%;    p_correct: 32.0607%;    p_correct*p_survived: 0.0488%
    iter 700;    p_survived: 0.0833%;    p_correct: 58.6048%;    p_correct*p_survived: 0.0488%
    iter 800;    p_survived: 0.0603%;    p_correct: 80.9426%;    p_correct*p_survived: 0.0488%
    iter 900;    p_survived: 0.0527%;    p_correct: 92.7231%;    p_correct*p_survived: 0.0488%
    iter 1000;   p_survived: 0.0501%;    p_correct: 97.4508%;    p_correct*p_survived: 0.0488%
    iter 1090;   p_survived: 0.0493%;    p_correct: 99.0362%;    p_correct*p_survived: 0.0488%

Yup, we're just trading bad-result-failures for restart-failures.

Although the chance of the resulting being correct is increasing over time (meaning the algorithm can give the right answer!), the chance of having to restart is exactly countering it as far as the runtime multiplier is concerned.
As a consequence, we always expect to have to repeat the algorithm approximately 2048 times before we pass all the post-selection tests and end up with a correct answer, no matter how few or how many tests we run.

This is indicative of the fact that all our optimization power is coming from post-selection, instead of from interference or entanglement or deduction or something else practical.
We have a PostBQP algorithm, but we appear to be stuck in a BQP reality.

# Summary

Younes et al's algorithm is using post-selection.
This was already clear at a high level, thanks to the deferred measurement principle, but low-level simulation bears out that conclusion.
