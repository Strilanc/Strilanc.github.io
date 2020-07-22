---
layout: post
title: "Decorrelated Depolarization"
date: 2020-07-21 10:10:10 am PST
permalink: post/2001
---

There are a variety of ways of defining depolarizing errors out there.
A common definition, used when analyzing error correction circuits, is that when a depolarizing error occurs to a set of qubits,
a random Pauli ($I$, $X$, $Y$, or $Z$) is applied to each qubit.
Every combination of Paulis is equally likely, except that the all-identity case is omitted.
For example, a single-qubit depolarizing error would apply one of $X$, $Y$, or $Z$ chosen uniformly at random.
A two qubit depolarizing error would apply one of
$IX$, $IY$, $IZ$, $XI$, $XX$, $XY$, $XZ$, $YI$, $YX$, $YY$, $YZ$, $ZI$, $ZX$, $ZY$, or $ZZ$
chosen uniformly at random.

I just defined a depolarizing error using a set of individual disjoint error cases.
Because the individual cases are disjoint, they are not applied independently.
The lack of independence between the various cases can cause complications when attempting to analyze the effects of depolarizing noise on a quantum circuit.
Our goal in this post is to fix that problem.
To attempt to rewrite the definition of a depolarizing error in terms of *independent* error cases.


# Solving the single qubit case

We want to model a depolarizing error that is going to occur with probability $d$ by using independent random $X$, $Y$, and $Z$ errors that occur with probabilities $p\_x, p\_y, p\_z$.
Although it's conceivable that each error would have a different probability, we might as well start by assuming that $p\_x = p\_y = p\_z = p$ and see if that works.

Let's start by getting at least one of the cases working.
The probability that the net effect of applying the independent errors is equal to $X$ (up to global phase) should be $d/3$.
There are two ways that the net effect of applying the independent errors can equal a net $X$ error.
First, the $X$ error can occur without the $Y$ or $Z$ errors.
This happens with probability $p(1-p)^2$.
Alternatively, the $Y$ and $Z$ errors can occur without the X error.
This happens with probability $p^2(1-p)$.
Therefore it must be the case that:

$$p(1-p)^2 + p^2(1-p) = d/3$$

Solving for $p$, we find that:

$$p = \frac{1}{2} \pm \frac{1}{2} \sqrt{1 - \frac{4}{3}d}$$

I know I said we were going to start by doing just one case, but we actually just solved the entire problem.
Because this value of $p$ works for the net X error, and the whole situation is symmetric with respect to permuting $X$, $Y$, and $Z$, this value of $p$ must also work for the $Y$ and $Z$ cases.
And because we're reasoning about the *net* effect of the errors, the probabilities of producing net $X$, $Y$, and $Z$ errors are all correctly disjoint.

Note that the above formula only works when $d \leq \frac{3}{4}$.
This actually kind of makes sense, because $d=3/4$ is the threshold where a depolarizing error completely randomizes a qubit.
Going beyond that value of $d$ makes the depolarizing error *less* severe, assuming you know it was applied.
This is analogous to how, classically, if you are told a bit flip error was applied with probability $b$, the worst case scenario for recovering the bit is not at $b=1$ but rather at $b=0.5$.
Basically the $d \leq \frac{3}{4}$ limit is saying that, if you want to use independent errors to model a depolarizing error, the depolarization can't be so strong that it shoots past the maximally mixed state and starts unmixing the qubit.

# Verifying the single qubit solution

I just gave some quick, but vague, mathematical arguments that independently applying $X$, $Y$, and $Z$ errors each with probability $\frac{1}{2} - \frac{1}{2} \sqrt(1 - \frac{4}{3}d)$ is equivalent to applying a depolarizing error with probability $d$.
How can we verify this claim in a more direct way?

Well, one simple way to verify the equivalence of two quantum channels is to use the [state channel duality](https://en.wikipedia.org/wiki/Channel-state_duality).
If applying a quantum channel $A$ to one half of an EPR pair results in a system whose density matrix is exactly equal to the density matrix that would have been produced by applying some other channel $B$ instead, then applying $A$ is always equivalent to applying $B$.
So all we need to do is pick some values of $d$ to try, prepare an EPR pair, apply the indendent errors to one of the qubits in the pair, and see if the resulting density matrix of the two qubit system is equal to the density matrix that would have resulted from applying a depolarizing error instead.

Here is some python code that does that, using numpy and cirq:

```python
import cirq
import numpy as np

def verify_random_d():
    d = np.random.random() * 0.75
    p = 0.5 - 0.5 * np.sqrt(1 - 4/3 * d)

    a, b = cirq.LineQubit.range(2)
    actual_density_matrix = cirq.final_density_matrix(cirq.Circuit(
        # Make EPR pair.
        cirq.H(a),
        cirq.CNOT(a, b),
        # Independent errors.
        cirq.X(a).with_probability(p),
        cirq.Y(a).with_probability(p),
        cirq.Z(a).with_probability(p),
    ))
    expected_density_matrix = cirq.final_density_matrix(cirq.Circuit(
        # Make EPR pair.
        cirq.H(a),
        cirq.CNOT(a, b),
        # Depolarizing error.
        cirq.depolarize(d).on(a),
    ))
    assert np.allclose(actual_density_matrix, expected_density_matrix, atol=1e-8)
```

Running this code a few times produces no assertion errors, and so the solution should be correct.


# Solving the two qubit case

We can solve the two qubit case the same way we solved the one qubit case.
First, assume that all 15 possible will errors occur independently with the same probability $p$.
Second, pick any one of the errors, and compute the probability that applying the independent errors will produce the chosen error as a net effect.
This will be some polynomial function of $p$, and this function must equal $d/15$ (the desired disjoint chance of the chosen error term occuring).
Then we just solve for $p$ in terms of $d$.

Unfortunately, there is a complicating factor: this is massively tedious.
There are just too many ways for the 15 possible errors to produce some desired net effect.
Fortunately, this is why people invented computers.
Instead of attempting to solve the equation ourselves, we can delegate to the machine:

```python
from typing import Iterable
import itertools
import cirq
import sympy


def pauli_product(paulis: Iterable[cirq.PauliString]) -> cirq.PauliString:
    result = cirq.PauliString()
    for p in paulis:
        result *= p
    result /= result.coefficient
    return result


def problem_polynomial(qubit_count: int) -> sympy.Basic:
    # Find all the combinations of Paulis that can happen, omitting the all-identity case.
    qs = cirq.LineQubit.range(qubit_count)
    paulis = [cirq.I, cirq.X, cirq.Y, cirq.Z]
    errors = {
        pauli_product(p(q) for p, q in zip(ps, qs))
        for ps in itertools.product(paulis, repeat=qubit_count)
    }
    errors.remove(cirq.PauliString())

    arbitrary_error = next(iter(errors))
    d = sympy.Symbol('d')
    p = sympy.Symbol('p')

    # Add up the various probabilities of achieving the target error.
    zero_polynomial = -d / (4 ** qubit_count - 1)
    for n in range(len(errors) + 1):
        hits = 0
        for combo in itertools.combinations(errors, n):
            t = cirq.PauliString()
            for e in combo:
                t *= e
            t /= t.coefficient
            if t == arbitrary_error:
                hits += 1
        zero_polynomial += hits * p ** n * (1 - p) ** (len(errors) - n)

    return zero_polynomial.expand()


print(problem_polynomial(1))
# -d/3 - p**2 + p
print(problem_polynomial(2))
# -d/15 - 16*p**8 + 64*p**7 - 112*p**6 + 112*p**5 - 70*p**4 + 28*p**3 - 7*p**2 + p
```

So the polynomial for the two qubit case is:

$$-16p\_2^8 + 64p\_2^7 - 112p\_2^6 + 112p\_2^5 - 70p\_2^4 + 28p\_2^3 - 7p\_2^2 + p\_2 = d\_2/15$$

With the polynomial in hand, we can symbolically solve it using almost any computer algebra system (since I'm sure as hell not going to do it by hand).
We can then inspect the various solutions and pick one corresponding to valid probabilities (as opposed to negative or imaginary solutions).
One such root is:

$$p\_2 = \frac{1}{2} - \frac{1}{2} \sqrt{\sqrt{\sqrt{1 - \frac{16}{15} d\_2}}}$$

The above formula will work for any $d\_2 \leq \frac{15}{16}$.
Note that, once again, the threshold where we can no longer describe the depolarizing error in an independent fashion occurs at the maximal mixing point.

I'll leave verifying that the two qubit formula works, and generalizing to larger numbers of qubits, as exercises for the reader.


# Closing Remarks

Any depolarizing error (that depolarizes by at most the amount needed to maximally mix states) can be described as a series of independently applied Pauli product errors, instead of as a series of disjoint errors.

If we could probabilistically apply the non-physical ["Universal Not" gate](https://physics.stackexchange.com/a/247178/911), this would fix the problem preventing us from describing maximum strength depolarization using independent error terms.
However, it would introduce other problems.

[View r/algassert comment thread](https://www.reddit.com/r/algassert/comments/hvooyq/decorrelated_depolarization/)
