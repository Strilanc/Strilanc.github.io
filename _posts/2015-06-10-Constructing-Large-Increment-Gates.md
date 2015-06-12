---
layout: post
title: "Constructing Large Increment Gates"
date: 2015-06-10 11:30:00 EST
categories: circuits
---

(*This post is the second of three. Part 1 was [Constructing Large Controlled Nots](http://strilanc.com/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html).*)

Last time, we figured out how to use a single ancilla bit to reduce large controlled-not gates into a linear number of [Toffoli gates](https://en.wikipedia.org/wiki/Toffoli_gate) (NOT gates with two controls).

However, in order to reach the goal of performing a controlled-not *without* an ancilla bit, we also need to be able to efficiently reduce large increment gates into smaller gates.
That's what we'll be doing in this post: turning $n$-bit increments into $O(n)$ [Toffoli, [CNOT](https://en.wikipedia.org/wiki/Controlled_NOT_gate), and [NOT](https://en.wikipedia.org/wiki/Quantum_gate#Pauli-X_gate) gates with the help of an ancilla bit.

(Next time: using quantum gates to bootstrap the ancilla bit.)

# Incrementing

An increment gate is an operation that increases the [two's-complement](https://en.wikipedia.org/wiki/Two%27s_complement) value represented by a group of wires.
For example, if a 2-bit increment gate is applied to a circuit then the circuit's state will cycle from `[Off, Off]` to `[On, Off]` to `[Off, On]` to `[On, On]` and then back to `[Off, Off]`.

Implementing an increment gate out of NOT gates is easy, *if* you're allowed to have arbitrarily large numbers of controls.
The carry signal stops as soon as it encounters an `OFF` bit, so each bit flips if and only if all of the lower bits were `ON` before incrementing.
In other words, each wire gets a NOT that is controlled by all the preceding wires:

<img src="http://i.imgur.com/bJVfsfH.png" alt="Incrementer definition" height="300px"/>

Our goal is to *not* use arbitrarily larger numbers of controls.
We want at most two controls per NOT.

A simple way to reduce the incrementing circuit, so that each NOT had at most two controls, would be to run each of the $n$ large controlled NOTs though the construction from the last post.
Unfortunately, that would require $\Sum{i=1}{n} i \in O(n^2)$ gates in total.
We want to use a linear number of gates, not a quadratic number, so we need break the increment apart more intelligently.

Like last time, our constructions will use one or more [ancilla bits](https://en.wikipedia.org/wiki/Ancilla_bit).
We're guaranteed to need at least one ancilla bit, because the gates we can use all have [even parity](https://en.wikipedia.org/wiki/Parity_of_a_permutation) but an increment affecting all wires would have odd parity.

Also like last time, we'll consider several different types of ancilla bits: *burnable* (initially zero, allowed to end up non-zero), *zeroed* (initially zero, must end up zero), and *borrowed* (unknown initial value, must end up as that same value).
I'm skipping *garbage* (unknown initial value, allowed to end up different) this time because I didn't find a nice way for them to provide much benefit over borrowed bits when incrementing.

We'll start with the single ancilla bit case.

# Single Ancilla Bit

Given an $n+1$ wire circuit with $n$ increment wires and one ancilla wire, we want to break the increment into smaller operations.

Our goal is not to get all the way down to Toffoli gates, but to significantly reduce the size of operations.
Once we have smaller operations, possibilities open up because we can borrow our own bits.

When our single ancilla bit is burnable, we can use it to store the intersection of half of the controls.
The top wires can be incremented without depending on the bottom wires, because the top wires store the low bits of the two's complement number.
The bottom wires should only be changed if all of the top wires were ON, which is too many controls.
By storing the intersection of the top wires in the ancilla bit, the bottom wires need only one control instead of $n/2$ controls:

<img src="http://i.imgur.com/3PiQ1ho.png" alt="Split incrementer from Burnable bit" height="350px"/>

Note that we can absorb the single extra control into the increment gate. A controlled increment gate is equivalent to an increment gate with the control wire as the new lowest bit, except that the final NOT on the low bit is missing.
Therefore we can absorb controls into increments by following the increment with a NOT of the control:

![Top control = bigger increment withnot](http://i.imgur.com/4At5Uae.png)

Note that it's important to treat the absorbed control bit as the low bit, even if the absorbed wire is in the "wrong" position.
The control bit may need to be swapped into the right position, so that the increment plays out correctly.

When we get a single zeroed bit, instead of a burnable bit, we need to uncompute the effects on the ancilla bit before finishing.
This is a simple addition to the circuit, because we only had one easily reversed effect on the ancilla bit:

<img src="http://i.imgur.com/VdqzjFW.png" alt="Split incrementer from Zeroed bit" height="350px"/>

If the single ancilla bit is borrowed, it takes more than a simple tweak to make things work.

Last time, we used *toggle detection* when working with handle garbage bits and borrowed bits.
We repeating a self-undoing operation twice, conditioned on the garbage bit, so that the operation would undo itself if the garbage bit started off `On` and wasn't toggled.
Incrementing is *not* its own inverse, so toggle detection won't work out of the box here.

I was stuck on this problem for quite awhile, but eventually I realized that the trick was to use the *bitwise complement*.
When the bits of a two's-complement number $X$ are all toggled, you get a new value $(!X) = -X-1 \pmod{2^n}$.
Being able to negate a value is useful, even if there's an offset, because it allows us to turn increments into decrements.
In particular, the complement of the increment the complement of a value is $!(!X + 1) = !(-X - 1 + 1) = -(-X)-1 = X-1$, i.e. the decrement of the value.

In other words, surrounding an increment gate with NOTs turns it into a decrement (and vice versa)!

![Increment equals decrement surrounded by nots](http://i.imgur.com/LhVB55R.png)

This is useful to us because now we can control whether an operation will be undone, or redone, by a second operation.
That's the trick we'll use to make toggle detection work in this case.

We will apply an increment gate and a decrement gate to the high bits of the number.
Both operations will be conditioned on the borrowed ancilla bit.
We will toggle the ancilla wire and the high bits, before and after the decrement gate, whenever the top wires are all `On`.
If the low bits are *not* all `On`, nothing will happen to the bottom wires.
In the case where the borrowed ancilla bit is `Off`, neither the increment nor the decrement gate will apply and so nothing will happen.
In the case where the borrowed ancilla bit is `On`, both the increment and the decrement gate will apply, undoing each other, and so overall nothing will happen.
If the low bits are all `On`, then the NOTs around the decrement gate effectively transform it into an increment gate.
In the case where the borrowed ancilla bit is `On`, the increment gate will fire and the decrement-turned-increment gate will not.
In the case where the borrowed ancilla bit is `Off`, only the decrement-turned-increment gate will fire.
Therefore, when the low bits are all `On` the high bits will be incremented exactly once.
And when the low bits are not all `On`, nothing happens to the high bits.
That's exactly the logic we want.

Here's what the single borrowed bit construction looks like, for 8-bit numbers:

<img src="http://i.imgur.com/XC374p4.png" alt="Split incrementer from Borrowed bit" height="350px"/>

Notice how toggle-detection is used above to spread the toggling of the ancilla bit to all of the other high bits.
This avoids having more than a constant number of large controlled-nots, so that the large controlled-not construction can be applied without causing a quadratic blowup.

Our single-bit constructions could be applied iteratively, cutting the size of increments in half until we hit simple base cases.
However, like last time (*I notice that I am saying 'like last time' quite a lot.*), the single-bit construction goes super-linear if you do that.
For example, the recurrence relation for the borrowed bit construction is $T(N) = 3 T(N/2) + O(N)$.
That puts $T(N)$ in $O(n^{log_2(3)}) \approx O(n^{1.585}$, not $O(n).

To achieve a linear number of gates, we'll need to borrow bits from ourselves.

# $n$ Ancilla Bits

Given a $2n$ wire circuit, with $n$ target wires and $n$ ancilla wires, we want to increment the target wires.
This time, we want to do more than just make things a little smaller.
We want to reach all the way down to Toffoli gates.

Using burnable bits, we don't need all of the available ancilla bits: $n-2$ is sufficient.
We use the burnable bits to store a growing intersection of controls, then use those stored values to update the target bits:

<img src="http://i.imgur.com/9XRcScc.png" alt="Incrementer from n-2 Burnable bits" height="300px"/>

Zeroed bits work exactly like burnable bits, except we uncompute by sweeping up afterwards:

<img src="http://i.imgur.com/xs1NtN1.png" alt="Incrementer from n-2 Zeroed bits" height="300px"/>

The really hard case is borrowed bits.
I was stuck on this part even longer than I was stuck on the single-borrowed-bit case.
Eventually, help came in the form of the [VanRentergem adder](http://ftp.qucis.queensu.ca/home/akl/cisc879/papers/PAPERS_FROM_UNCONVENTIONAL_COMPUTING/VOLUME_1_Issue_4/RENTERGEM.pdf) ([source of diagram](http://iopscience.iop.org/1751-8121/43/38/382002/fulltext/)):

![VanRentergem adder](http://cdn.iopscience.com/images/1751-8121/43/38/382002/Full/jpa348454fig03.jpg)

The above circuit takes a carry bit $c$, a two's complement value $a$, a two's complement value $b$, and turns $(c, a, b)$ into $(c, a, b+a)$.
It's a handy thing to know about.
We'll tweak it just a little, to do subtraction instead of addition and to use Toffoli gates instead of controlled-swap gates, creating a subtraction widget:

<img src="http://i.imgur.com/irgmgGa.png" alt="Subtraction Widget" height="300px"/>

We can use the subtraction widget to subtract a garbage carry bit $c$ and a garbage two's-complement value $g$ out of our target value $v$.
This wouldn't be very useful, if it weren't for the fact that the bitwise complement trick applies to this situation.
If we apply the subtraction widget, then flip $g$'s bits, then apply the subtraction widget again, we end up with $v \rightarrow v-c-g \rightarrow v-c-g-(-g-1)-c = v-2c+1$.
(Note that, because we we're storing one more bit of $v$ than we are of $g$, we have to counter the fact that adding $g$ and its inverse toggles $v$'s high bit.)

It helps to think of $v-2c+1$ conditioned upon $c$.
When $c$ is `On` we get $v \rightarrow v-2+1 = v-1$, meaning we *decremented* $v$.
When $c$ is `Off` we get $v \rightarrow v+1$, meaning we *incremented* $v$.
We always want to increment, and can easily turn a decrement into an increment by surrounding it with NOTs, so... just make the NOTs conditional upon $c$:

<img src="http://i.imgur.com/tbah33i.png" alt="Incrementer from n Borrowed bits" width="100%"/>

(We're getting a lot of mileage out of this bitwise complement trick.)

Our linear-ancilla constructions all break things down into a constant number of linear sweeps, so they use an overall linear number of Toffoli (or smaller) gates.

We can combine this with the single-bit construction.

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

![Linear scaling of full incrementer circuit](http://i.imgur.com/fodBO0c.png)

This also shows that we're not being particularly efficient.
We're using lots of gates.
But linear is all we needed.

# Summary

Given a single ancilla bit in an unknown state that must be preserved, you can create $n$-wire increment gates out of $O(n)$ Toffoli, CNOT, and NOT gates.
The key parts of the construction are a VanRentergem-style subtraction, toggle-detection, and using the bitwise complement to switch between adding and subtracting.

Next time: using quantum gates to bootstrap an ancilla bit.

