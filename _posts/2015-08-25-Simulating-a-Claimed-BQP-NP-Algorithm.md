---
layout: post
title: "Simulating a Claimed NP=BQP Algorithm"
date: 2015-08-27 11:30:00 EST
categories: quantum
comments: true
---

[In my last post](/quantum/2015/08/01/Checking-a-Claimed-BQP-NP-Algorithm.html), I argued that [this paper](http://arxiv.org/abs/1507.05061)'s claimed quantum polynomial-time 3-SAT algorithm actually took exponential time. I pointed out that the algorithm must be equivalent to random guessing because the final measurements could be done before any hard work happened.

The authors of the paper, Younes et al., left a comment politely disagreeing with my argument:

> [...] it is not correct to say that the measurements of the variable assignments can be brought forward to the start of the algorithm. The manipulation of the entangled target qubit involves measurements, and not purely control -and so this part of the algorithm will not commute with the measurement of the variable assignments. [... other points ...]

Initially I thought I'd respond with a post explaining why and when measurements can be moved around without changing the overall effect of a circuit.
That does seem like an interesting post to write... but I decided to take a different approach instead: simulation.

In this post, I will give a quick guide to simulating quantum circuits, provide code for simulating Younes et al's algorithm, and use the results of that simulation to demonstrate that their algorithm takes exponential time.

# Quantum Circuit Simulation

Simulating a quantum circuit is not magic.
The state space may be unfamiliar and the effects of the operations may be counter-intuitive, but everything is mathematically well defined.
The code is trivial (no, really, it is); the hard part is internalizing and understanding the rules.

(Well... until you increase the number of qubits past 20.
Then the hard part is slamming into the exponential cost walls).

All of the code used by this post [is available on github](https://github.com/Strilanc/qbp_np_younes_test).

**Quantum States**

The type of state a quantum circuit can hold has a name: a "[mixed state](https://en.wikipedia.org/wiki/Quantum_state#Mixed_states)". A mixed state is a probability distribution of "[pure states](https://en.wikipedia.org/wiki/Quantum_state#Pure_states)". A pure state is a superposition of classical states. A classical state is an assignment of boolean values to each qubit: qubit #1 is Off, qubit #2 is On, etc.

That's a lot of definition to take in all at once, but I'll go through them one by one.
We need programmatic representations of all three levels (classical, pure, and mixed) if we want to do any simulating.

A *classical state* is just a bunch of bits.
A very convenient way to store a bunch of bit values is as an integer [bitmask](https://en.wikipedia.org/wiki/Mask_%28computing%29), so that's what I did in my implementation.
The [ClassicalState class](https://github.com/Strilanc/qbp_np_younes_test/blob/master/classical_state.py) is nothing more than a handful of convenience methods wrapped around an integer value:

    >>> print(ClassicalState(5))
    |00000101〉
    >>> print(ClassicalState(5).bit(2))
    True

A *pure state*, also called a "superposition", is a weighted combination of classical states.
The weight associated with each state is called an "amplitude", and is basically the square root of a probability.
If you square the magnitudes of all the amplitudes, and add up those squares, you should get a total of 100% (otherwise it's not a valid superposition).
The [PureState class](https://github.com/Strilanc/qbp_np_younes_test/blob/master/pure_state.py) uses a dictionary to store the pure state: the keys are the classical states, and the values are the amplitudes.

    >>> print(PureState({
            ClassicalState(2): -0.8,
            ClassicalState(7): 0.6j
        }))
    -0.800*|00000010〉 + 0.600j*|00000111〉

A *mixed state* is also a weighted combination of states, but this time it's pure states instead of classical states and the weights are probabilities instead of amplitudes.
The [MixedState class](https://github.com/Strilanc/qbp_np_younes_test/blob/master/mixed_state.py) uses a dictionary to store the mixed state: the keys are the pure states, and the values are the probabilities.

    >>> print(MixedState({
            PureState({ClassicalState(4): -1}): 0.25,
            PureState({ClassicalState(5): math.sqrt(0.5), ClassicalState(6): -math.sqrt(0.5)}): 0.75
        }))
    75.0%: 0.707*|00000101〉 + -0.707*|00000110〉
    25.0%: -1.000*|00000100〉

So the state of a quantum circuit is a probability distribution of superpositions of classical states.
A convenient mathematical representation for this kind of state is as a [density matrix](https://en.wikipedia.org/wiki/Density_matrix), but I'm trying to be brief so let's stick with the code's dictionaries-of-dictionaries approach and move on to operations.

**Quantum Operations**

There are two types of operations that you can apply to quantum states: unitary operations, and measurement operations.
Roughly speaking, unitary operations turn classical states into pure states while measurement operations turn pure states into mixed states.

A [unitary operation](https://en.wikipedia.org/wiki/Unitary_matrix) associates a pure state output with every allowed classical state.
When applied to a pure state, the operation distributes linearly: it gets applied to each classical state in the superposition, and the amplitudes in the resulting output pure states are scaled by the associated input state's amplitude.
The multiple output superpositions are then flattened into a single superposition by concatenating them together, except that matching classical states interfere (their amplitudes from each superposition get added together).
See [the code](https://github.com/Strilanc/qbp_np_younes_test/blob/master/pure_state.py#L65) if the above sounds ambiguous or went way, way too fast.

When applied to a mixed state, unitary operations just distribute directly onto each pure state in the mixed state ([code](https://github.com/Strilanc/qbp_np_younes_test/blob/master/mixed_state.py#L82)).
(There's no flattening or interference steps necessary at the mixed state level.)

Here's an example of a unitary operation being applied to a mixed state:


    >>> op_hadamard_on_first_bit = lambda c: PureState({
            c.with_bit(0, False): math.sqrt(0.5),
            c.with_bit(0, True): -math.sqrt(0.5) if c.bit(0) else +math.sqrt(0.5)
        })
    >>> input = MixedState({
            PureState({ClassicalState(4): -1}): 0.25,
            PureState({ClassicalState(5): math.sqrt(0.5), ClassicalState(6): -math.sqrt(0.5)}): 0.75
        })
    >>> print(input)
    75.0%: 0.707*|00000101〉 - 0.707*|00000110〉
    25.0%: -1.000*|00000100〉
    >>> print(input.unitary_transform(op_hadamard_on_first_bit))
    75.0%: 0.500*|00000100〉 + -0.500*|00000101〉 + -0.500*|00000110〉 + -0.500*|00000111〉
    25.0%: -0.707*|00000100〉 + -0.707*|00000101〉

A [measurement operation](https://en.wikipedia.org/wiki/POVM) distinguishes between the classical states that make up a pure state, cleaving it into pieces.
(Actually, measurements are a bit more general than that, but we'll stick to measuring in the computational basis for simplicity.
Don't worry about it.)
The resulting pieces' probabilities are determined by the sum of the squared amplitudes of the states within that piece.
Each piece then becomes a separate branch at the mixed state level:

    >>> value_of_first_bit = lambda c: c.bit(0)
    >>> input = MixedState({
            PureState({ClassicalState(4): -1}): 0.25,
            PureState({ClassicalState(5): math.sqrt(0.5), ClassicalState(6): -math.sqrt(0.5)}): 0.75
        })
    >>> print(input.measure(value_of_first_bit))
    37.5%: -1.000+0.000j*|00000110〉
    37.5%: 1.000+0.000j*|00000101〉
    25.0%: -1.000+0.000j*|00000100〉

The code [also supports](https://github.com/Strilanc/qbp_np_younes_test/blob/master/pure_state.py#L34) [post-selecting](https://en.wikipedia.org/wiki/Postselection), where you do a measurement but assert what the result will be.
In practice this would involve running an experiment again and again, until you get the result you want.
The code returns both the resulting renormalized state, and the probability of success:

    >>> value_of_first_bit = lambda c: c.bit(0)
    >>> print(input.post_select(value_of_first_bit))
    (0.3750000000000001, MixedState({PureState({ClassicalState(5): (1+0j)}): 1.0}))

With the ability to store states and perform operations, we now have ourselves a basic quantum circuit simulation engine.

# Simulating Younes et al's Algorithm

My implementation of Younes et al's algorithm is in the [younes_test.py file](https://github.com/Strilanc/qbp_np_younes_test/blob/master/younes_test.py).

The code sets up useful values:

    def simulate_younes_algo(anti_clauses):
        n = max(max(used_variables) for used_variables in anti_clauses) + 1
        m = len(anti_clauses)
        var_bits = range(n)
        clause_bits = range(n, n + m)
        ancilla_bit = n + m

        state = MixedState({PureState({ClassicalState(0): 1}): 1})

Superposes the variable-assignment bits and initializes the entangled is-clause-satisfied bits:

        for i in var_bits:
            state = state.unitary_transform(hadamard_op(i))
        for j in range(m):
            state = state.unitary_transform(not_op(n + j))
            state = state.unitary_transform(
                controlled_by(not_op(n + j), anti_clauses[j]))

And performs the iterated rejection testing based on the number of satisfied clauses:

        while True:
            [... track and output debug info ...]

            for j in clause_bits:
                op_mx = controlled_by(
                        partial_x_rotation_op(ancilla_bit, m),
                        {j: True})
                state = state.unitary_transform(op_mx)
            p_pass, state = state.post_select(bit_check_predicate(ancilla_bit))
            state = state.unitary_transform(not_op(ancilla_bit))

The 3-SAT instance I chose to use for testing is a trivial one, where the only solution is assigning True to all of 11 variables:

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
        {0: True, 1: True, 4: False},
        {0: True, 1: True, 5: False},
        {0: True, 1: True, 6: False},
        {0: True, 1: True, 7: False},
        {0: True, 1: True, 8: False},
        {0: True, 1: True, 9: False},
        {0: True, 1: True, 10: False},
    ])

There are two important values to track as the algorithm runs: `p_survived` and `p_correct`.
`p_survived` is the probability that the algorithm has not been forced to restart, as it must if the post-selection following the rotate-based-on-number-of-satisfied-clauses-and-expect-True check fails.
`p_correct` is the probability that, if you measured the clause bits and variable bits in the current iteration, you would get the correct answer (all clauses satisfied, all variables true).

Both `p_survived` and `p_correct` act as multipliers on the running time of the algorithm.
If you have to restart 99 out of a 100 times, due to `p_survived` being 1%, it will take 100 times longer for the algorithm to run.
If you get the wrong answer 99 out of a 100 times, due to `p_correct` being 1%, you'll have to repeat the algorithm ~100 times before you expect to have seen a good answer.
Furthermore, the effect of these two multipliers on the running time *stacks* so the real quantity we care about is the product `p_correct*p_survived`.

Since the test case I choose has 11 variables, and the algorithm starts by putting them into a uniform superposition, `p_correct` is initially $\frac{1}{2^{11}} = \frac{1}{2048} \approx 0.0488\%$. `p_survived` starts at 100%, of course, since the post-selection only happens later.

What we *want* to happen as the algorithm runs is for `p_correct` to trend upward towards 100%.
It has to do so *faster* than `p_survived` trends downward, because `p_correct*p_survived` has to increase if we want the running time to decrease.

# Results

When I run the simulation code, I get these results:

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

As expected, `p_correct` is increasing over time (thanks to throwing out bad solutions) but `p_survived` is trending down (due to the post-selection).

Unfortunately, `p_survived*p_correct` is *not* increasing; it's staying *exactly* constant.
This means that varying the number of iterations is simply trading correctness restarts for postselection restarts, without any improvements to the overall runtime.
No matter what number of iterations we pick, the algorithm will require approximately $2^{n}$ retries before it both passes the postselection checks and returns a correct answer.

This is exactly what I was expecting, based on the fact that the measurements can be done before the hard work happens: the algorithm is equivalent to random guessing, but done in a more complicated way.

(The most likely reasons for these results to be wrong is a bug in the code, since I wrote something from scratch instead of using an existing simulator.)

# Summary

Younes et al's algorithm is an obfsucated post-selection algorithm.
All of the optimization power comes from restarting when things don't go perfectly, instead of from interference or entanglement or deduction or something else that works in practice.

It would be a great algorithm if post-selection was free, but unfotunately we appear to be stuck in a BQP reality.
