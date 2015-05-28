---
layout: post
title: "Constructing Controlled Nots"
date: 2015-05-17 11:30:00 EST
categories: circuits
---

In this post: building $n$-control-NOTs out of 2-control-NOTs and an ancilla bit.

# Reversible Circuits

When you make a reversible circuit, you may need some working space.

Reversible computing is interesting because it avoids one of the lower bounds on heat dissipation from computation. (You still have to pay to pump errors out, though.)

In practice we only have circuit elements affecting a finite number of elements.

We want to make large controlled nots out of Toffoli gates.

Shtetl paper on reversible circuits.

It's not always possible to only use the bits affected by the circuit when constructing that circuit. We may need **ancilla bits**

Ancilla bits come in different varieties. Sometimes, you know that they're guaranteed to be off. Other times, you don't know what value they'll have. Sometimes, you are required to restore the bits to their original value after you're done with them. Sometimes you're not.

In this post I'm going to use the following naming convention:

- **Borrowed Bit**: An ancilla bit that you must restore, but don't know the value of.
- **Garbage Bit**: An ancilla bit that you don't know the value of. You can dump garbage into it.
- **Zero Bit**: An ancilla bit that's OFF beforehand, and must be OFF afterwards.
- **Burnable Bit**: An ancilla bit that's OFF beforehand, but you're allowed to ruin it. Corresponds to classical computation with neg-entropy to burn.

Usually, the shortest circuits use burnable bits (and correspond to classical computations). Using zero bits often requires you to uncompute, by running the circuit twice, the effects on the bit. So they tend to be twice as large. Garbage bits can similarly have a factor of 2 cost, because you have to key effects on the bit being toggled instead of its value. Borrowed bits are the worst, paying both factors of 2 in cost, so they're four times as large.

On the other hand, borrowed bits are the most commonly available simply because every bit not involved in the current gate is borrowable. So if you can break a gate into much smaller gates, those smaller gates will each individually have access to lots of borrowable bits.

The number of available ancilla bits can also affect how easy it is to construct the circuit. We can do things that are much more convenient when we have $n$ ancilla bits, than when we have $1$ ancilla bit. If we have $0$ ancilla bits, some circuits are simply not possible to construct. For example, a controlled-not involving every wire can't be broken into smaller controlled nots.

The problem is that in a reversible computation every gate corresponds to a permutation. The controlled-not touching every wire is a single swap, meaning its permutation has **odd parity**. But any gate that leaves a wire unaffected must have even parity, because it does some swaps in the case where that wire is off and identical swaps in the case where that wire is on. So it must have an even number of swaps.

**Lots of Available Bits**

Suppose we have $n-1$ ancilla bits and need to do a controlled-not involving $n$ controls (and one target). How do we construct our controlled not?

If we have burnable bits, it's really easy. We store the AND of the first two bits in one of the burnable bits, then keep AND'ing more bits on and storing the result in burnable bits. We touch every burnable bit twice and every value bit once.

    A ──•───── A
        │ 
    B ──•───── B
        │ 
      ──X•──── AB
         │
    C ───•──── C
         │
      ───X•─── ABC
          │
    D ────•─── D
          │
      ────X•── ABCD
           │
    E ─────•── E
           │
    T ─────X── T + ABCDE

If we have zero bits, we do the same thing but then need to undo all of the effects on the ancilla bits. The result looks like an arrow pointing towards the target.

    A ──•─────•── A
        │     │
    B ──•─────•── B
        │     │
      ──X•───•X── 
         │   │
    C ───•───•─── C
         │   │
      ───X•─•X─── 
          │ │
    D ────•─•──── D
          │ │
      ────X.X──── 
           │
    E ─────•───── E
           │
    T ─────X───── T + ABCDE

If we have garbage bits, the arrow points away from the target instead of towards it. The underlying idea is that we want to surround the work bits with controls, so that if the work bit toggles then the control is on exactly once. Otherwise it will undo its own effect, or do nothing. That gives us a thing that toggles, and we just keep layering:

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


Borrowed bits are, of course, the largest. We have to use the same strategy we did with the garbage bits, but then we have to repeat it again (except for the bottom-most part) in order to restore the original values.


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
    x3 ──•X───X.X───X── x3
         │     │
     E ──•─────•─────── E
         │     │
     T ──X─────X─────── T + ABCDE

**Single Ancilla Bit**

If we have 1 burnable bit:

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


If we have 1 garbage bit:

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
 

If we have 1 zero bit:

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


If we have 1 borrowed bit:

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

We *could* apply the 1-bit construction iteratively, until we had halved enough to turn n into 2, but this is inefficient. The recurrence relation is $C(N) = 4 C(N/2)$ and this solves out to $C(N) = O(N^2)$.

To avoid the quadratic blowup, we can borrow some of our own bits. Because each reduced control affects only half of the bits, there are suddenly $N-1$ available bits to borrow. So we can apply the $N-1$ borrowed bit construction from earlier. So we'll use $C(N) = 4 \cdot C(N/2) = 4 \cdot (4 N \cdot C(3)) = O(N)$ Toffoli gates

**Summary**

With no ancilla bits, you can't build larger controlled nots out of Toffoli gates.

Just one ancilla bit is enough to build a large controlled-nots out of $\Theta(n)$ Toffoli gates. Even if the ancilla bit is in an unknown state that must be preserved.

$n$ ancilla bits aren't necessary, but they make it easy to use a smaller number of gates.

In terms of the number of needed gates, borrowed bits are more expensive than garbage bits and zero bits, and they in turn are more expensive than burnable bits.

If the bit in a known state, or you don't have to restore it, you need 3/4 as many gates. If it's both known and not needed to be restored, you need 1/2 as many gates. If you have N ancilla bits to work with, instead of 1, you save factor of 4.

---

Next time: increment and decrement gates.

Next next time: using quantum gates to make the no-ancilla-bit case possible.
