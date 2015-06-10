---
layout: post
title: "Constructing Large Increment Gates"
date: 2015-06-10 11:30:00 EST
categories: circuits
---

(*This post is the second part of a three part series. You may want to read [Part 1: Constructing Large Controlled Nots](http://strilanc.com/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html) first.*)

Last time, we learnt to [construct large controlled-not gates](http://strilanc.com/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html) for reversible circuits out of NOT gates with at most 2 controls, using a single ancilla bit.

However, in order to reach the goal of performing a controlled-not *without* an ancilla bit, we will need construct large increment gates.
In this post, we'll figure out how to make $n$-bit increments under the same constraints: using one ancilla bit and $O(n)$ [Toffoli](https://en.wikipedia.org/wiki/Toffoli_gate), [CNOT](https://en.wikipedia.org/wiki/Controlled_NOT_gate), and [NOT](https://en.wikipedia.org/wiki/Quantum_gate#Pauli-X_gate) gates.

(Next time: using quantum gates to bootstrap the ancilla bit.)

# Incrementing

An increment gate is an operation that increases the [two's-complement](https://en.wikipedia.org/wiki/Two%27s_complement) value represented by a subset of wires by 1.
For example, if a 2-bit increment gate is applied to a circuit where all wires start out `Off` then the state of the wires will go from `[Off, Off]` to `[On, Off]` to `[Off, On]` to `[On, On]` and then back to `[Off, Off]` to start the cycle again.

The basic logic that an individual wire follows, when being incremented, is that it toggles if all the wires representing smaller bits were `On`.
Conversely, if any of the smaller wires was `Off` then the carry propagation would have halted there and so the current wire should not be toggled.
Because the logic is so simple, it's easy to make an increment gate out of NOT gates, *if* you're allowed to have arbitrarily large numbers of controls:

<img src="http://i.imgur.com/bJVfsfH.png" alt="Incrementer definition" height="300px"/>

Of course, we're *not* allowed to use arbitrarily larger numbers of controls.
We're limited to using at most two, so we'll need to split up the work somehow.

We could translate each of the controlled-NOTs individually, but we'd end up using a quadratic number of gates.

Like last time, we'll need to use an [ancilla bit](https://en.wikipedia.org/wiki/Ancilla_bit) (because incrementing all the wires is an operation that would have odd parity and smaller gates always have even parity).

Also like last time, we'll consider several different types of ancilla bits.
The ancilla bit or bits may be *burnable* (initially zero, allowed to end up non-zero), *zeroed* (initially zero, must end up zero), or *borrowed* (unknown initial value, must end up as that same value).
We won't be considering *garbage* (unknown initial value, allowed to end up different) this time, but only because I didn't find a nice way for them to provide much benefit over borrowed bits when it comes to incrementing.

We'll start (like last time) with the single ancilla bit case.
Recall that our goal is not to get all the way down to Toffoli gates, but to significantly reduce the size of operations.
Once we have smaller operations, possibilities open up because we can borrow our own bits.

# Single Ancilla Bit

Given an $n+1$ wire circuit with $n$ increment wires and one ancilla wire, we want to break the increment into smaller operations.

When our single ancilla bit is burnable, we can use it to store the intersection of half of the controls.
That allows us to increment the upper bits while only depending on one bit, instead of all of the lower bits.
Then, the lower bits can be incremented independently of the upper bits:

<img src="http://i.imgur.com/3PiQ1ho.png" alt="Split incrementer from Burnable bit" height="350px"/>

A controlled increment gate is equivalent to an increment gate with the control wire as the lowest bit, except that the final NOT is missing (it would go on the control wire).
This allows us to absorb controls into increments by following the increment with a NOT of the control:

![Top control = bigger increment withnot](http://i.imgur.com/4At5Uae.png)

Note that this only makes sense if the absorbed control bit is *treated as the low bit*.
The control bit may need to be moved into the right relative position.

If the single ancilla bit is a zeroed bit, instead of a burnable bit, the effects on it must be uncomputed before finishing.
This is a simple addition to the circuit:

<img src="http://i.imgur.com/VdqzjFW.png" alt="Split incrementer from Zeroed bit" height="350px"/>

The changes aren't so simple if the single ancilla bit is a borrowed bit.

Last time, we used *toggle detection* to handle garbage bits and borrowed bits: repeating a self-undoing conditioned operation twice, so it undid itself if the garbage bit started off `On` and wasn't toggled.
Unfortunately, incrementing is *not* its own inverse.
We'll need an additional trick.

I was stuck on this problem for quite awhile, but eventually I realized that the trick was to use the *bitwise inverse*.
When the bits of a two's-complement number $X$ are all toggled, you get a new value $(!X)$.
It so happens that $(!X) = -X-1 \pmod{2^n}$.
So if you increment the bitwise inverse, you get $-X-1+1 = -X$.
And if you then compute the bitwise inverse of the increment of the bitwise inverse, you get $(!-X) = --X-1 = X-1$.

In other words, surrounding an increment gate with NOTs turns it into a decrement (and vice versa)!

![Increment equals decrement surrounded by nots](http://i.imgur.com/LhVB55R.png)

This is useful to us because it lets cause an increment gate to undo a previous increment gate (by turning it into a decrement, or vice versa).
That's how we will make toggle detection work in this case.

We will apply an increment gate and a decrement gate on the bottom wires, both conditioned on the bottom wire.
We will toggle the bottom wire, and the rest of the bottom wires, before and after the decrement gate, whenever the top wires are all `On`.
If the top wires are not all `On`, nothing will happen to the bottom wires because the increment and decrement gates will either both not happen, or both happen and undo each others' effects.
If the top wires are all `On`, then either the increment gate will fire or the decrement gate will fire.
However, because we toggle the bottom wires before and after the decrement gate in this case, it actually acts like an increment gate.
Therefore exactly one increment will occur.

It looks simpler than it sounds:

<img src="http://i.imgur.com/XC374p4.png" alt="Split incrementer from Borrowed bit" height="350px"/>

The NOTs with lots of controls can be reduced using the techniques from the last post.

Like last time, we could apply the single-bit construction iteratively, cutting the size of increments in half until we hit simple base cases. However, like last time (I *really* hope you read that post first), this is inefficient. The recurrence relations grow super-linearly, e.g. like $T(N) = 3 T(N/2) + O(N) \in O(n^{log_2(3)})$.
To achieve a linear number of gates, we need to borrow bits from ourselves.

# $n$ Ancilla Bits

Given a $2n$ wire circuit, with $n$ target wires and $n$ ancilla wires, we want to increment the target wires.

If we're given burnable bits, we only need $n-2$ instead of $n$.
We use the burnable bits to store a growing intersection of controls, then use those stored values to update the target bits:

<img src="http://i.imgur.com/9XRcScc.png" alt="Incrementer from n-2 Burnable bits" height="300px"/>

Zeroed bits work exactly like burnable bits, except we sweep up afterwards:

<img src="http://i.imgur.com/xs1NtN1.png" alt="Incrementer from n-2 Zeroed bits" height="300px"/>

The really hard case is borrowed bits.
I was stuck on this part for quite awhile.
Eventually help came, in the form of the [VanRentergem adder](http://ftp.qucis.queensu.ca/home/akl/cisc879/papers/PAPERS_FROM_UNCONVENTIONAL_COMPUTING/VOLUME_1_Issue_4/RENTERGEM.pdf) ([source of diagram](http://iopscience.iop.org/1751-8121/43/38/382002/fulltext/)):

![VanRentergem adder](http://cdn.iopscience.com/images/1751-8121/43/38/382002/Full/jpa348454fig03.jpg)

This handy little circuit takes a carry bit $c$, a two's complement value $a$, a two's complement value $b$, and turns $(c, a, b)$ into $(c, a, b+a)$.

We'll tweak it just a little, to do subtraction instead of addition and to use Toffoli gates instead of controlled-swap gates:

<img src="http://i.imgur.com/irgmgGa.png" alt="Subtraction Widget" height="300px"/>

<!--
    ─•X•───────────────────•X──
     │││                   ││  
    ─X••───────────────────••X─
      ││                   │││ 
    ──•X•X•─────────────•X─X••─
        │││             ││     
    ────X••─────────────••X────
         ││             │││    
    ─────•X•X•───────•X─X••────
           │││       ││        
    ───────X••───────••X───────
            ││       │││       
    ────────•X•X•─•X─X••───────
              │││ ││           
    ──────────X••─••X──────────
               ││ │││          
    ───────────•X•X••──────────
                 │             
    ─────────────X─────────────
-->

We can use the subtraction widget to subtract a borrowed/garbage carry bit $c$ and a borrowed/garbage two's-complement value $g$ out of our target value $v$.
This wouldn't be very useful, if it weren't for the fact that the bitwise inverse trick applies to this situation.
If we flip $g$'s bits, then subtract again, we end up with $v \rightarrow v-c-g \rightarrow v-c-g-(-g-1)-c = v-2c+1$.
(Note that, because we we're storing one more bit of $v$ than we are of $g$, we have to counter the fact that adding $g$ and its inverse toggles $v$'s high bit.)

When $c$ is `On` we get $v \rightarrow v-2+1 = v-1$ so we decrement $v$, and when $c$ is `Off` we get $v \rightarrow v+1$ so we increment $v$.
We're really getting mileage out of this bitwise inverse thing.
When $c$ is `On$, we simply invert $v$ before and after so that the decrement turns into an increment.

Put that all together, and you get:

<img src="http://i.imgur.com/tbah33i.png" alt="Incrementer from n Borrowed bits" width="100%"/>

<!--
    ─••••─•X•───────────────────•X──•X•───────────────────•X─••••─
     ││││ │││                   ││  │││                   ││ ││││
    ─X┼┼┼─X••───────────────────••X─X••───────────────────••XX┼┼┼─
      │││  ││                   │││  ││                   │││ │││
    ──┼┼┼X─•X•X•─────────────•X─X••X─•X•X•─────────────•X─X••─┼┼┼─
      │││    │││             ││        │││             ││     │││
    ──X┼┼────X••─────────────••X───────X••─────────────••X────X┼┼─
       ││     ││             │││        ││             │││     ││
    ───┼┼X────•X•X•───────•X─X••───X────•X•X•───────•X─X••─────┼┼─
       ││       │││       ││              │││       ││         ││
    ───X┼───────X••───────••X─────────────X••───────••X────────X┼─
        │        ││       │││              ││       │││         │
    ────┼X───────•X•X•─•X─X••──────X───────•X•X•─•X─X••─────────┼─
        │          │││ ││                    │││ ││             │
    ────X──────────X••─••X───────────────────X••─••X────────────X─
                    ││ │││                    ││ │││             
    ─────X──────────•X•X••─────────X──────────•X•X••──────────────
                      │                         │                
    ─────X────────────X─────────────────────────X─────────────────
-->

There's almost definitely an easier way to do it, but the above is good enough because it uses a constant number of linear-sized sweeps and so is overall $O(n)$.

# Putting It All Together

There's a few more details that need to be addressed.

First, because we need $n$ borrowed bits instead of $n-2$ borrowed bits, a single splitting step may not be enough.
Sometimes you'll need to split twice, or else to pull the largest CNOT out of one of the sub-cases and handle it separately.

Second, there are a lot of little opportunities for optimization.
For example, for small number of bits it may be more efficient to just break the CNOTs individually instead of as a combined increment gate.

Third, there are some isolated NOT gates with more than a constant number of controls.
They need to be broken down using the technique from last time.

But, overall, things work.
The construction is complicated enough that I wrote [hacky python code to test it](https://gist.github.com/Strilanc/1768464eb8cbca0981cd).
When I create the 5-bit increment circuit, and then crunch it down a bit by hand so it fits on the page, you get:

    a ────•─•─•••X•───────•X──•X•───────•X─••──•─•─•◦•X•───────•X──•X•───────•X─•◦X─X••───────••X─X••───────••XX─ a+1
          │ │ │││││       ││  │││       ││ ││  │ │ │││││       ││  │││       ││ │││ │││       │││ │││       ││││ 
    b ────•─•X┼┼┼•X•X•─•X─X••X┼•X•X•─•X─X••┼┼──•─•X┼┼┼•X•X•─•X─X••X┼•X•X•─•X─X••┼┼┼X┼┼┼X••─••X┼┼┼─┼┼┼X••─••X┼┼┼┼X b+a
          │ │ ││││││││ ││ │││ ││││││ ││ │││││  │ │ ││││││││ ││ │││ ││││││ ││ │││││││││││││ ││││││ ││││││ ││││││││
    c ───•┼•┼X┼┼┼┼┼┼•X◦X••┼┼┼X┼┼┼┼•X•X••┼┼┼┼┼─•┼•┼X┼┼┼┼┼┼•X•X••┼┼┼X┼┼┼┼•X•X••┼┼┼┼┼┼┼┼┼┼┼┼┼X┼┼┼┼┼┼─┼┼┼┼┼┼X┼┼┼┼┼┼┼┼ c+ab
         ││││ │││││││││││││││ │││││││││││││││ ││││ │││││││││││││││ ││││││││││││││││││││││││││││││ │││││││││││││││
    d ─X•X┼X┼•┼X┼┼┼X••┼••X┼┼┼─┼┼┼X••┼••X┼┼┼┼X•X┼X┼•┼X┼┼┼X••┼••X┼┼┼─┼┼┼X••┼••X┼┼┼┼X┼┼┼•X•X•┼•X┼X••X┼•X•X•┼•X┼X••┼┼ d+abc
        │││││││ │││   │   │││ │││   │   ││││ │││││││ │││   │   │││ │││   │   ││││ │││││ ││││││││  │││ ││││││││ ││
    e X•X•X•XX┼•┼┼┼───X───┼┼┼─┼┼┼───X───┼┼┼┼•X•X•XX┼•┼┼┼───X───┼┼┼─┼┼┼───X───┼┼┼┼X┼┼┼┼┼─•X◦X••┼┼─X┼┼┼─•X•X••┼┼─┼┼ e+abcd
       │      │││││       │││ │││       │││││      │││││       │││ │││       ││││ │││││       ││  │││       ││ ││
    Z ─X──────XXX••───────••X─X••───────••XXXX─────XXX••───────••X─X••───────••XXX•••X•───────•X──•X•───────•X─•• Z


If you squint a bit, you can see the hints of a pattern that looks a bit like M's and m's.
This jumps out a lot more if you run some larger cases and zoom out:

![Scaling](http://i.imgur.com/QS6iulE.png)

This also shows that we're not being particularly efficient.
We're using lots of gates.
But linear is all we needed.

# Summary

Given a single ancilla bit in an unknown state that must be preserved, you can create $n$-wire increment gates out of $O(n)$ Toffoli, CNOT, and NOT gates.
The key parts of the construction are a VanRentergem-style subtraction, toggle-detection, and using the bitwise complement to switch between adding and subtracting.

Next time: using quantum gates to bootstrap an ancilla bit.

--------------------------
# Comments

{% include /comments/2015-06-30-Constructing-Large-Controlled-Nots.md %}

[Comment via Pull Request](https://github.com/Strilanc/Strilanc.github.io/edit/master/_includes/comments/2015-06-30-Constructing-Large-Controlled-Nots.md)

