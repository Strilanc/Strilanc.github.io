---
layout: post
title: "Constructing Controlled Nots"
date: 2015-05-17 11:30:00 EST
categories: circuits
---

In this post: using ancilla bits to build NOT gates with lots of controls out of NOTs with two controls.

# Reversible

Reversible circuits avoid [one of the lower bounds](http://en.wikipedia.org/wiki/Landauer%27s_principle) on the energy required to do computation.
They segue nicely into how quantum computers work. And they make for interesting theoretical challenges.

Reversible circuits can't use all of the gates that logic circuits can use.
In particular, they can't use NAND, AND, NOR, or OR gates.
This is an osbtacle, because those gates are often the ones used to achieve universality.

Reversible circuits instead use the Toffoli gate (or the controlled-swap with some caveats, or lots of other unnamed options) to achieve universality.

Unlike the universality of irreversible circuits, classical reversible universality has a caveat: you may need ancilla bits.

In practice we only have circuit elements affecting a finite number of elements.

We want to make large controlled nots out of Toffoli gates.

Shtetl paper on reversible circuits.

It's not always possible to only use the bits affected by the circuit when constructing that circuit. We may need **ancilla bits**

Ancilla bits come in different varieties. Sometimes, you know that they're guaranteed to be off.
Other times, you don't know what value they'll have.
Sometimes, you are required to restore the bits to their original value after you're done with them. Sometimes you're not.

**Ancilla Bits**

Even with a universal reversible gate, there's a caveat when it comes to computing *all* possible functions.
The caveat is that factoring the function into smaller gates may require some extra working space.

The underlying problem is that all reversible operations correspond to a permutation of the state space, and [permutations have a parity](http://en.wikipedia.org/wiki/Parity_of_a_permutation).
For example, suppose we have a 10-bit circuit and we want to toggle the last bit when the first nine are ON (i.e. we apply a $CNOT\_{10}$.
The permutation corresponding to $CNOT\_{10}$ swaps the 1111111110 state with the 1111111111 state, but leaves all the other states untouched.
A controlled-not that affects all the wires has a permutation with exactly on swap, so it has *odd parity*.
Conversely, any operation on a strict subset of the wires must have *even parity*.
If an operation doesn't affect or depend on a bit, then the operation must perform the same swaps amongst the subset of states where that bit is 0 as it does amongst the states where that bit is 1.
Every swap is happening twice, once per possible value of the unaffected bit, so there must be an even number of swaps.

The workaround for this problem is to give the circuit access to [ancilla bits](https://en.wikipedia.org/wiki/Ancilla_Bit). The extra bits give circuit constructions "room to move", simplifying them or making them possible in the first place.

Usually you'll know the initial value of an ancilla bit, and be required to restore that value, but there are other possibilities.
Being allowed to trash the value can easily halve the size of a circuit, because there's no need to uncompute effects.
several possibles types of ancilla bits, based on whether or not you're allowed to trash the bits and whether you know their initial values.
Usually you'll know the initial value and be required to restore the value, but in this post we'll explore four variations:

- **Burnable Bits**: Will be OFF beforehand, but with no restrictions on state afterwards.
Basically, these are neg-entropy you can consume to perform (a small amount of) irreversible computation.
- **Zeroed Bits**: Will be OFF beforehand, and must be OFF afterwards.
Zero bits are like burnable bits, except you have to [uncompute](https://en.wikipedia.org/wiki/Uncomputation) effects on the ancilla bits before continuing. As a result, circuits using zeroed bits tend to be twice as large as circuits using burnable bits.
- **Garbage Bits**: Could be in any state beforehand, and can be in any state afterwards.
Using a garbage bit generally requires detecting that it was toggled.
As with having to restore the initial state, this tends to double the size of circuits relative to burnable bits.
- **Borrowed Bits**: Could be in any state beforehand, but must be restored to that same state afterwards.
Combines the downsides of zeroed bits and garbage bits.
The upside is that you can borrow bits *from yourself*.
Tends to quadruple the size of circuits, relative to burnable bits.

Usually, the shortest circuits use burnable bits (and correspond to classical computations).
Using zero bits often requires you to uncompute, by running the circuit twice, the effects on the bit.
So they tend to be twice as large. Garbage bits can similarly have a factor of 2 cost, because you have to key effects on the bit being toggled instead of its value.
Borrowed bits are the worst, paying both factors of 2 in cost, so they're four times as large.

On the other hand, borrowed bits are the most commonly available simply because every bit not involved in the current gate is borrowable.
So if you can break a gate into much smaller gates, those smaller gates will each individually have access to lots of borrowable bits.

The number of available ancilla bits can also affect how easy it is to construct the circuit.
We can do things that are much more convenient when we have $n$ ancilla bits, than when we have $1$ ancilla bit.
If we have $0$ ancilla bits, some circuits are simply not possible to construct.
For example, a controlled-not involving every wire can't be broken into smaller controlled nots.

The problem is that in a reversible computation every gate corresponds to a permutation.
The controlled-not touching every wire is a single swap, meaning its permutation has **odd parity**.
But any gate that leaves a wire unaffected must have even parity, because it does some swaps in the case where that wire is off and identical swaps in the case where that wire is on.
So it must have an even number of swaps.

**Easy Case: Lots of Ancilla Bits**

Suppose we want to construct a $CNOT_n$, and we have $n$ ancilla bits.
How do we construct our large controlled not out of Toffoli gates?

If we have burnable bits, it's really easy. We store the AND of the first two bits in one of the burnable bits, then keep AND'ing more bits on and storing the result in burnable bits.
We touch every burnable bit twice and every value bit once.

    A ──•───── A
        │ 
    B ──•───── B
        │ 
    0 ──X•──── AB
         │
    C ───•──── C
         │
    0 ───X•─── ABC
          │
    D ────•─── D
          │
    0 ────X•── ABCD
           │
    E ─────•── E
           │
    T ─────X── T + ABCDE

If we have zeroed bits, we do the same thing but with uncomputation. The result looks like an arrow pointing towards the target.

    A ──•─────•── A
        │     │
    B ──•─────•── B
        │     │
    0 ──X•───•X── 0
         │   │
    C ───•───•─── C
         │   │
    0 ───X•─•X─── 0
          │ │
    D ────•─•──── D
          │ │
    0 ────X•X──── 0 
           │
    E ─────•───── E
           │
    T ─────X───── T + ABCDE

If we have garbage bits, we have to rely on toggle detection. That's simple to do with controlled NOTs because they are their own inverse: just have the operation depend on the toggle-able bit and repeat it on both sides of the possible toggle. If the toggle doesn't happen, the operation will either not happen at all or happen twice and undo itself. If the toggle does happen, the operation happens exactly once. You can then wrap another toggle-detection around the bigger toggle, and keep going. The result looks like an arrow pointing away from the target (instead of towards it like with zerod bits):

     A ─────•───── A
            │ 
     B ─────•───── B
            │ 
    x1 ────•X•──── x1 + AB
           │ │
     C ────•─•──── C
           │ │
    x2 ───•X X•─── x2 + ABC
          │   │
     D ───•───•─── D
          │   │
    x3 ──•X───X•── x3 + ABCD
         │     │
     E ──•─────•── E
         │     │
     T ──X─────X── T + ABCDE


With borrowed bits we re-use the garbage bits strategy, and then uncompute:


     A ─────•─────•──── A
            │     │
     B ─────•─────•──── B
            │     │
    x1 ────•X•───•X•─── x1
           │ │   │ │
     C ────•─•───•─•─── C
           │ │   │ │
    x2 ───•X─X•─•X─X•── x2
          │   │ │   │
     D ───•───•─•───•── D
          │   │ │   │
    x3 ──•X───X•X───X── x3
         │     │
     E ──•─────•─────── E
         │     │
     T ──X─────X─────── T + ABCDE

Garbage bits zig, zeroed bits zag, and borrowed bits zig-zag.

**Hard Case: Single Ancilla Bit**

All of the previous constructions need an extra ancilla bit for each extra control bit. We need a different construction when there are fewer ancilla bits available. However, we no longer need to factor operations into Toffoli gates. We only need to factor them into $CNOT_\frac{n}{2}$ gates now, because once we hit that point we can borrow the other $n/2$ bits from ourselves in order to apply the $n/2$ borrowed bit construction above and finish the job.

If we have 1 burnable bit, it's easy to split the gate in two:

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


Again we add uncomputation to handle the zeroed bit case:

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

And the garbage bit solution again looks like an inverted form of the zeroed bit solution:

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
 
And the borrowed bit solution again looks like a combination of the garbage and zeroed bit solutions:

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

All of the above constructions reduce the C(2N-1) case with 1 ancilla bit into four C(N)s with N ancilla bits.

We *could* apply the 1-bit construction iteratively, until we had halved enough to turn n into 2, but this is inefficient. The recurrence relation would $C(N) = 4 C(N/2)$ and this solves out to $C(N) = O(N^2)$. Borrowing our own bits avoids the quadratic blowup. Each reduced control affects only half of the bits, so there are suddenly $N-1$ available bits to borrow. So we can apply the $N-1$ borrowed bit construction from earlier. So we'll use $C(N) = 4 \cdot C(N/2) = 4 \cdot (4 N \cdot C(3)) = O(N)$ Toffoli gates

**Impossible Case: 0 Ancilla Bits**

As mentioned earlier, it's impossible construction a $CNOT_n$ (where $n>3$) out of Toffoli gates without an ancilla bit because a $CNOT$ affecting all wires has a permutation with odd parity whereas any smaller gate (including Toffoli gates) will have even parity.

Interestingly, this is *not* impossible to do with quantum operations. But that's a different post.

**Summary**

With no ancilla bits, you can't build larger controlled nots out of Toffoli gates.

Just one ancilla bit is enough to build a large controlled-nots out of $\Theta(n)$ Toffoli gates. Even if the ancilla bit is in an unknown state that must be preserved.

$n$ ancilla bits aren't necessary, but they make it easy to use a smaller number of gates.

In terms of the number of needed gates, borrowed bits are more expensive than garbage bits and zero bits, and they in turn are more expensive than burnable bits.

If the bit in a known state, or you don't have to restore it, you need 3/4 as many gates. If it's both known and not needed to be restored, you need 1/2 as many gates. If you have N ancilla bits to work with, instead of 1, you save factor of 4.

---

Next time: increment and decrement gates.

Next next time: using quantum gates to make the no-ancilla-bit case possible.
