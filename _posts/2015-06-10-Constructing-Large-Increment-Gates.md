---
layout: post
title: "Constructing Large Increment Gates"
date: 2015-06-10 11:30:00 EST
categories: circuits
---

Part 1: [Constructing Large Controlled Nots](http://strilanc.com/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html)

In this part, we're going to construct large increment gates using a single ancilla bit.

# Incrementing

An increment gate is an operation that increases the binary value represented by the pattern of ONs and OFFs of a subset of wires.

The n'th wire toggles is all the smaller wires are ON.

![Incrementer example](http://i.imgur.com/SHWoaly.png)

The main thing to understand about how an increment works is it can always be split into two parts: a bottom-part that just increments, and a top-part that increments only when the bottom part is all-on.
By repeatedly splitting, you end up with a triangle of controlled-nots.

![Incrementer Definition](http://i.imgur.com/bJVfsfH.png)


                \ Preserve state
    Initial state\    No           Yes
    
        OFF           Burnable     Zeroed

      Unknown         Garbage      Borrowed

In the last part, I showed how to break down each of those controlled not into a linear number of Toffoli gates.

We can't do that here, because we'd end up with $\Sum{i=0}{n} i \in O(n^2)$ Toffoli gates instead of a linear number.

We'll progress like last time, by using the single ancilla bit to split the program in half and then by using a better construction.

We know we need at least one ancilla bit because for the same parity reason as last time.
Shifting $2^n$ values over by 1 requires $2^n-1$ swaps, which is an odd number, and smaller operations can only have even parity.
Therefore we need an ancilla bit to turn the number of swaps even in both cases.

**Single Ancilla Bit**

Given an $n+1$ wire circuit with $n$ increment wires and one ancilla wire, we want to break the increment into smaller operations. We want to take this:

Note: move the ancilla bit to the center for clarity.

and break it into smaller increments and a constant number of controlled-NOTs.

When our single ancilla bit is burnable, we can use it to intersect controls shared by the bottom part of the increment:

<img src="http://i.imgur.com/SYagN7o.png" alt="Single burnable bit circuit construction" height="300px"/>

If our ancilla bit is a zeroed bit instead of a burnable bit, we need to uncompute:

<img src="http://i.imgur.com/9ADaUP1.png" alt="Single zeroed bit circuit construction" height="300px"/>

The garbage bit case is a bit trickier when it comes to incrementing because, unlike the controlled-not, the increment gate is not its own inverse.
If it happens twice, it won't undo itself.

The trick I used to make this work is related to the fact that the logical inverse of $a$ if $~a = -a - 1$.
And if you increment $-a-1$ then invert it again, you get $~(~a+1) = ~(-a-1+1) = ~-a = a-1$.
So we can transform an increment gate into a decrement gate, or vice versa, by toggling all the bits of $a$ before and after the operation.

This allows us to put two gates that undo each other when both apply, but tweak the bad one into a correct one when we actually go to use it.

<img src="http://i.imgur.com/YjaopSn.png" alt="Single garbage/borrowed bit circuit construction" height="300px"/>

Consider the above construction.
If the top half is not all on, the bottom-half's controlled-nots will undo themselves so they don't matter.
That leaves the increment and decrement, which also undo each other, leaving nothing in the bottom half.
Which is correct.
If the top half is all on, then the controlled-not pairs each apply once, so it's like the decrement is surrounded by a logical negation.
This inverts the decrement into an increment.
Therefore we have two increment gates, each conditioned on a bit that's going to toggle between them.
Therefore exactly one increment happens.
Which is correct.

![Increment = not decrement](http://i.imgur.com/LhVB55R.png)

![Top control = bigger increment withnot](http://i.imgur.com/4At5Uae.png)

The garbage construction happens to also work for borrowed bits. It's possible to make it not work, but you only save a single CNOT so it's not really worth the effort.

Each of the above constructions uses 1 ancilla bit to turn an $n$-bit increment gate into $\frac{n}{2}$-bit increments or decrements, possibly with one control.

Like last time, we could apply these constructions iteratively, but we would get $T(n) = 2 T(\frac{n}{2}) + O(n) \in O(n \log n)$ instead of $O(n)$ for non-garbage keys.
For garbage keys we'd again naively get $O(n^{log_2(3)})$ but with careful choice of the split might be able to get it down to $O(n \log n)$.
Again we're going to need to borrow bits from ourselves.

Need to apply the construction again to get enough room.

# $n-2$ Ancilla Bits

//Given a $2n-1$ wire circuit with $n$ control wires, $n-2$ ancilla wires, and one target wire, we want to break a $C^{n}NOT$ into a linear number of Toffoli gates.
//We will intersperse the ancilla bits throughout the circuit, instead of putting them all at the bottom, to make the constructions look simpler:

<img src="/assets/2015-06-30-Constructing-Large-Controlled-Nots/N_Ancilla_Bits_Layout.png" alt="Linear ancilla bits" height="280px"/>

With burnable bits, tracking the carry is easy.

<img src="http://i.imgur.com/fQdfDy9.png" alt="Linear burnable bits circuit construction" height="300px"/>

Zeroed bits also have an easy time tracking the carry, and uncomputing works:

<img src="http://i.imgur.com/LFWUdAr.png" alt="Linear zeroed bits circuit construction" height="300px"/>

Garbage and borrowed bits are where things get tough.
It seems like you either have to mess up the carry or the value.

VanRot adder was the key, plus inversion trick.

If we add the garbage into $a$, then add the inverse garbage into $a$, we get $a + c + g + c - g - 1 = a + 2c - 1$.

To cancel out the $2c$, we invert $a$ conditioned upon $c$.

# Putting It All Together

Need to apply halving twice when there's an even number of bits, because we need as many ancilla as bits being operated on in the second step.

Example diagram worked to completion.

# Summary

Next time: using quantum gates to bootstrap an ancilla bit.

--------------------------
# Comments

{% include /comments/2015-06-30-Constructing-Large-Controlled-Nots.md %}

[Comment via Pull Request](https://github.com/Strilanc/Strilanc.github.io/edit/master/_includes/comments/2015-06-30-Constructing-Large-Controlled-Nots.md)

