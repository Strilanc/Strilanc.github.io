---
layout: post
title: "Constructing Large Controlled Nots"
date: 2015-06-05 11:30:00 EST
categories: circuits
---

A month or so ago, I got nerd-sniped by an exercise from [Nielsen and Chuang's textbook](http://www.amazon.com/Quantum-Computation-Information-Anniversary-Edition/dp/1107002176): using only $O(n^2)$ [Toffoli gates](https://en.wikipedia.org/wiki/Toffoli_gate) and single-qubit gates, and without using any [ancilla bits](https://en.wikipedia.org/wiki/Ancilla_Bit), construct a $C^nNOT$ gate (a NOT gate with $n$ controls).

I thought it was wasteful to use a quadratic number of gates, and decided to try to do it with only a linear number of gates.
As a consequence, I had to figure out several different sub-problems: how to construct a $C^nNOT$ when you *do* have an ancilla bit, how to construct increment gates with an ancilla bit, and finally how to bootstrap an ancilla bit into existence using quantum gates.

Each sub-problem is getting its own post.
In this first post, we'll be looking at how to use any ancilla bit to construct a $C^nNOT$ out of $O(n)$ Toffoli gates.
Note that we won't be using any quantum gates.
Although ultimately I'll use what's explained here to solve a quantum circuit problem, this post (and the next one) are purely classical circuit construction problems.

# Reversible Circuits

Practically speaking, reversible circuits are interesting because they avoid [one of the lower bounds on the energy required to do computation](http://en.wikipedia.org/wiki/Landauer%27s_principle).
In principle, if you didn't have to spend energy pumping errors out, a reversible computation could be done for free (without consuming neg-entropy, i.e. turning energy into waste heat).
(On the other hand, we're six orders of magnitude away from the Landauer limit so this is more of a far-off-future-hypothetically-useful kind of practicality.)

Theoretically speaking, reversible circuits are interesting because they're a source of problems and questions to solve.
For example, you can [classify reversible gates](http://arxiv.org/abs/1504.05155) based on which equivalence class of operations they can construct.
And, of course, there's the circuit construction problems themselves.

Constructing reversible circuits is tricky because you're not allowed to use any of the gates that make it easy.
All of the gates we typically use for universal computation (i.e. NAND, AND, NOR, and OR gates) are irreversible.
There *are* still universal gates for reversible computation, and the Toffoli gate is one of them, but there's a caveat.

# Permutations and Parity

Every reversible operation  must map from every input to a distinct output, and to every output from exactly one input.
More specifically, it must be equivalent to a [permutation](https://en.wikipedia.org/wiki/Permutation) of the possible states.

[Permutations have a parity](http://en.wikipedia.org/wiki/Parity_of_a_permutation), based on the number of swaps it takes to rearrange the items to match the permutations.
If it takes an odd number of swaps to perform a permutation, it has odd parity.
Conversely, taking an even number of swaps means the permutation has even parity.
When you chain permutations, applying one then the other, the parity of the resulting overall net permutation is the sum of the two chained permutations' parities.
Chaining two even or two odd permutations gives an even permutation.
Chaining one even and one odd permutation (in either order) gives an odd permutation.
This means that, for example, you can't ever make an odd permutation by chaining even permutations.

The fact that even permutations can't make odd permutations is useful surprisingly often, when you want to show that something is impossible.
In particular, it creates a caveat on the universality of reversible gates.

Consider a controlled-not that affects all the wires of a circuit.
For example, suppose we have a 10-bit circuit and we want to toggle the last bit when the first nine are ON (i.e. we have a $C^9NOT$.
The permutation corresponding to that $C^9NOT$ swaps the $1111111110$ state with the $1111111111$ state, but leaves all the other states untouched.
Since it performs one swap, and that's an odd number, $C^9NOT$ is an operation with odd parity.

Now consider *any* operation that doesn't touch all the wires.
There is a bit $b$ that the operation doesn't depend on or affect.
Therefore, when we look at the swaps performed by this operation, any swap it performs when $b=0$ must be matched by an equivalent swap performed when $b=1$.
In other words, having an unaffected bit doubles the number of swaps (because the swap has to happen once in the $b=0$ case, and once in the $b=1$ case).
Therefore this operation must have even parity, because it performs an even number of swaps.

That brings us to our caveat. Since a controlled-not that affects every wire has odd parity, and *any* operation affecting fewer wires has even parity, and chaining even operations can't create an odd operation, it is impossible to reduce an all-wires-touched controlled not into smaller operations.

Fortunately, although chained permutations preserve the total number of swaps $\pmod{2}$, that's not true for other moduluses. It doesn't work $\pmod{4}$, for example. If we provided some working space, we can sidestep the parity problems.

# Ancilla Bits

The way we provide working space is by adding ancilla bits to the circuit.
Ancilla bits are extra bits, not involved in the logical operations being performed, that give circuit constructions "room to move".
In addition to making constructions possible in the first place, ancilla bits can allow for simpler and more efficient constructions.

Ancilla bits come in different flavors, based on if you know their initial value and if you're required to restore that value. We'll be creating constructions for each case in this post, so I'll name them now to avoid ambiguities:

- **Burnable Bits**: Guaranteed to be OFF initially, but with no restrictions on state afterwards.
Basically, burnable bits are (a small amount of) neg-entropy you can consume to perform some irreversible computation.
- **Zeroed Bits**: Guaranteed to be OFF initially, and you must ensure they're OFF when you're done.
Zeroed bits are generally used exactly like burnable bits, except you [uncompute](https://en.wikipedia.org/wiki/Uncomputation) effects before continuing.
Circuits using zeroed bits tend to be a constant factor larger than circuits using burnable bits because of the uncomputation tax.
- **Garbage Bits**: Could be in any state initially, and you can add more garbage into the state (you don't have to restore the initial value).
Garbage bits tend to be trickier to use than burnable or zeroed bits, because you need to base logic around *toggle detection*.
Toggle detection typically involves repeating a self-undoing operation twice, conditioned on the potentially-toggled garbage bit.
When no toggling occurs the operation either doesn't happen or happens twice and undoes itself.
When toggling occurs, the operation happens exactly once.
Circuits using garbage bits tend to be a constant factor larger than circuits using burnable bits because of the toggle-detection tax.
- **Borrowed Bits**: Could be in any state beforehand, and must be restored to that same state afterwards.
Borrowed bits have the downsides of both zeroed bits and garbage bits, and pay both of their boilerplate taxes.
However, borrowed bits are much more common because you can borrow bits *from yourself*.
Any operation that doesn't affect the entire circuit can use unaffected wires as de-facto borrowable bits.

Now that we have a language for talking about ancilla bits, let's start constructing some large controlled nots. We've already discussed why the 0-bit case is impossible, but what about the 1-bit case?

**1 Ancilla Bit**

Given an $n+2$ circuit with $n$ control wires, one target wire, and one ancilla wire, we want to break a $C^{n}NOT$ into smaller operations. We want to take this:

<img src="http://i.imgur.com/zqxs9PP.png" alt="Single ancilla bit circuit" height="280px"/>

and break it into controlled-NOTs with fewer controls, so that we have more breathing room to work with for each individual sub-operation.

If our single ancilla bit is a burnable bit, it's easy to split the problem in two. Just use toggle the ancilla bit ON when four of the controls are ON, and then use a single control on the ancilla bit to play the role of those four controls:

<img src="http://i.imgur.com/Pfei41X.png" alt="Single burnable bit circuit construction" height="300px"/>

<!--
    A ──•──── A
        │
    B ──•──── B
        │
    C ──•──── C
        │
    D ──•──── D
        │
    E ──┼─•── E
        │ │
    F ──┼─•── F
        │ │
    G ──┼─•── G
        │ │
    T ──┼─X── T + ABCDEFG
        │ │
      ──X─•── ABCD
-->

If our ancilla bit is a zeroed bit, we need to uncompute the effects on it before finishing. In this case our effects are very simple, and can be undone by simply repeating what we did to mess things up:

<img src="http://i.imgur.com/Cr8XFaW.png" alt="Single zeroed bit circuit construction" height="300px"/>

<!--
    A ──•───•── A
        │   │
    B ──•───•── B
        │   │
    C ──•───•── C
        │   │
    D ──•───•── D
        │   │
    E ──┼─•─┼── E
        │ │ │
    F ──┼─•─┼── F
        │ │ │
    G ──┼─•─┼── G
        │ │ │
    T ──┼─X─┼── T + ABCDEFG
        │ │ │
      ──X─•─X──
-->

When the ancilla bit is a garbage bit, we do toggle-detection. We conditionally toggling T on both sides of the possible toggling of the ancilla bit, so that the T-toggling undoes itself unless the ancilla bit was toggled:

<img src="http://i.imgur.com/t5b3Dq4.png" alt="Single garbage bit circuit construction" height="300px"/>

<!--
    A ────•──── A
          │
    B ────•──── B
          │
    C ────•──── C
          │
    D ────•──── D
          │
    E ──•─┼─•── E
        │ │ │
    F ──•─┼─•── F
        │ │ │
    G ──•─┼─•── G
        │ │ │
    T ──X─┼─X── T + ABCDEFG
        │ │ │
    x ──•─X─•── x + ABCD
-->
 
Finally, the borrowed bit case is just a combination of the garbage bit and zeroed bit tricks:

<img src="http://i.imgur.com/8CIaLFv.png" alt="Single borrowed bit circuit construction" height="300px"/>

<!--
    A ──•───•──── A
        │   │
    B ──•───•──── B
        │   │
    C ──•───•──── C
        │   │
    D ──•───•──── D
        │   │
    E ──┼─•─┼─•── E
        │ │ │ │
    F ──┼─•─┼─•── F
        │ │ │ │
    G ──┼─•─┼─•── G
        │ │ │ │
    T ──┼─X─┼─X── T + ABCDEFG
        │ │ │ │
    x ──X─•─X─•── x
-->

Each of the above constructions uses 1 ancilla bit to turn a $C^{n}NOT$ into $O(1)$ $C^{\frac{n}{2}}NOT$s (more specifically, we use $C^{\lceil \frac{n}{2} \lceil}NOT$s and $C^{\lceil \frac{n+1}{2} \rceil}NOT$s).

We could apply this construction iteratively, turning $C^{n}NOT$s into $C^{\frac{n}{2}}NOT$s into $C^{\frac{n}{4}}NOT$s and so forth $p$ times until we hit the base case of Toffoli gates when $\frac{n}{2^p} \approx 2$. Unfortunately, doing that would use more than a linear number of Toffoli gates. For borrowable bits, the recurrence relation for the construction is $T(n) = 4 T(\frac{n}{2})$, which is $O(n^2)$. For the zeroed bits and garbage bits we get $T(n) = 3 T(\frac{n}{2})$, which is $O(n^{lg_3 2}) \approx O(n^{1.585})$. Even if we could apply the burnable bits case iteratively (despite trashing the single ancilla bit then trying to pretend it was still 0), $T(n) = 2 T(\frac{n}{2})$ is $O(n lg(n))$ instead of $O(n)$.

Clearly we need a better construction. Fortunately, we've made our operations quite a lot smaller. We're guaranteed to have at least $\lceil \frac{n}{2} \rceil$ unaffected bits available and that our operations have size at most $C^{\lceil \frac{n+1}{2} \rceil}NOT$. That gives us the option of borrowing our own bits.

# $n-2$ Ancilla Bits

Given a $2n-1$ wire circuit with $n$ control wires, $n-2$ ancilla wires, and one target wire, we want to break a $C^{n}NOT$ into a linear number of operations. This time we will intersperse the ancilla bits throughout the circuit, to make the constructions look simpler:

<img src="http://i.imgur.com/GotM44a.png" alt="Linear ancilla bits" height="280px"/>


Once again, the burnable bits case is easy.
We store intermediate results in the ancilla bits, allowing us to use one control to represent many, and we AND up the result one control at a time.
In the end we've touch every burnable bit twice, and every value bit once.
Not bad:

<img src="http://i.imgur.com/qzigoTX.png" alt="Linear burnable bits circuit construction" height="300px"/>

<!--
     A ──•───── A
         │ 
     B ──•───── B
         │ 
    0₁ ──X•──── AB
          │
     C ───•──── C
          │
    0₂ ───X•─── ABC
           │
     D ────•─── D
           │
    0₃ ────X•── ABCD
            │
     E ─────•── E
            │
     T ─────X── T + ABCDE
-->

With zeroed bits, we have to uncompute.
We apply the same operations, except for the one toggling the target, but in the reverse order.
This creates a circuit that looks like it's pointing towards the target:

<img src="http://i.imgur.com/iB9FhXT.png" alt="Linear zeroed bits circuit construction" height="300px"/>

<!--
     A ──•─────•── A
         │     │
     B ──•─────•── B
         │     │
    0₁ ──X•───•X── 0
          │   │
     C ───•───•─── C
          │   │
    0₂ ───X•─•X─── 0
          │ │
     D ────•─•──── D
           │ │
    0₃ ────X•X──── 0 
            │
     E ─────•───── E
            │
     T ─────X───── T + ABCDE
-->

Garbage bits are again based on toggle detection, but this time we have to nest it.
Nested toggle detectors propagate toggling until one of them fails to fire.
The resulting circuit looks like an arrow pointing *away* from the target:

<img src="http://i.imgur.com/YW39FOb.png" alt="Linear garbage bits circuit construction" height="300px"/>

<!--
     A ─────•───── A
            │ 
     B ─────•───── B
            │ 
    x₁ ────•X•──── x₁ + AB
           │ │
     C ────•─•──── C
           │ │
    x₂ ───•X─X•─── x₂ + ABC
          │   │
     D ───•───•─── D
          │   │
    x₃ ──•X───X•── x₃ + ABCD
         │     │
     E ──•─────•── E
         │     │
     T ──X─────X── T + ABCDE
-->


Once again, the borrowed bits solution combines toggle-detection with uncomputation.
We take the garbage bits solution, then uncompute the non-target-affecting operations:


<img src="http://i.imgur.com/yoivhJC.png" alt="Linear borrowed bits circuit construction" height="300px"/>

<!--
     A ─────•─────•──── A
            │     │
     B ─────•─────•──── B
            │     │
    x₁ ────•X•───•X•─── x₁
           │ │   │ │
     C ────•─•───•─•─── C
           │ │   │ │
    x₂ ───•X─X•─•X─X•── x₂
          │   │ │   │
     D ───•───•─•───•── D
          │   │ │   │
    x₃ ──•X───X•X───X── x₃
         │     │
     E ──•─────•─────── E
         │     │
     T ──X─────X─────── T + ABCDE
-->

Each of the above constructions uses $n-2$ ancilla bits to turn a $C^{n}NOT$ into $O(n)$ Toffoli gates.

# Combination

Our 1 ancilla bit construction was not efficient enough to be applied iteratively.
Now that we have the efficient $n-2$ ancilla bit constructions, we can fix that problem by switching to the $n-2$ borrowed bit construction after applying the relevant 1 ancilla bit construction.

This achieves the $O(n)$ bound we were hoping for, even if we only have a single ancilla bit in an unknown state that we must maintain (in which case we use $\approx 4 \cdot \frac{n}{2} \cdot 4 \approx 8n$ Toffoli gates). Furthermore, this is $\Theta(n)$ because we clearly need at least $n/3$ gates (otherwise one of the controls could not have been touched).

The constant factor on the number of needed gates depends heavily on the type and number of ancilla bits. Starting with a burnable bit, instead of a borrowed bit, saves a factor of 2. Starting with $n$ burnable bits saves an additional factor of 4.

# Summary

You need an ancilla bit to build larger controlled nots out of Toffoli gates. Just one ancilla bit is enough to build a large controlled-nots out of $\Theta(n)$ Toffoli gates, even if the ancilla bit is in an important unknown state.

Having a larger quantity, or better quality, of ancilla bits isn't necessary but it improves the efficiency of the construction.

Next time: increment gates.

Next next time: bootstrapping an ancilla bit with quantum gates.

# Comments


