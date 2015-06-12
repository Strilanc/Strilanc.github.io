---
layout: post
title: "Constructing Large Increment Gates"
date: 2015-06-10 11:30:00 EST
categories: circuits
---

This post is Part 2 of solving a quantum circuit construction exercise.
In Part 1, [Constructing Large Controlled Nots](http://strilanc.com/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html), we figured out how to reduce a NOT with many controls into a linear number of NOTs with two controls (i.e. [Toffoli gates](https://en.wikipedia.org/wiki/Toffoli_gate)).
However, we needed an [ancilla bit](https://en.wikipedia.org/wiki/Ancilla_bit) to make the construction work.

In order to reach the end goal of constructing a NOT with many controls *without* an ancilla bit, we will need the ability to do large increments.
That's what we'll be figuring out in this post: how to turn an $n$-bit increment gate into $O(n)$ Toffoli, [CNOT](https://en.wikipedia.org/wiki/Controlled_NOT_gate), and [NOT](https://en.wikipedia.org/wiki/Quantum_gate#Pauli-X_gate) gates.

Once again we will need an ancilla bit to make the construction work, because we only have access to operations with even parity but an increment affecting every wire has odd parity. We also won't need to do anything quantum, again. (The quantum gates only show up next time, to bootstrap the ancilla bit.)

# Incrementing

An increment gate is an operation that increases the [two's-complement](https://en.wikipedia.org/wiki/Two%27s_complement) value represented by a group of wires.
For example, if a 3-bit increment gate is applied to a circuit then the circuit's state will cycle from `[Off, Off, Off]` to `[On, Off, Off]` to `[Off, On, Off]` to `[On, On, Off]` to `[Off, Off, On]` to `[On, Off, On]` to `[Off, On, On]` to `[On, On, On]` and then back to `[Off, Off, Off]`.

Implementing an increment gate out of NOT gates is easy, *if* you're allowed to have arbitrarily large numbers of controls.
The increment only propagates, as a carry, through the bits until it encounters an `OFF` bit.
Each bit flips if and only if all of the lower bits were `ON` before the incrementing started.
In other words, each wire gets a NOT that is controlled by all the preceding wires:

<img src="http://i.imgur.com/bJVfsfH.png" alt="Incrementer definition" height="300px"/>

Our goal is to do the same thing that the above circuits do, but without using more than two controls on any NOT and without using more than $O(n)$ NOTs.

The most immediately obvious thing to try is to apply the large controlled-not construction from last time.
Unfortunately, because that construction requires $O(n)$ gates per controlled NOT, we'd end up needing a quadratic number of gates in total (because $1 + 2 + 3 + 4 + ... + n \in \Theta(n^2)$).
We need break the increment apart more intelligently than that.

Like last time, our constructions will use one or more .
We're guaranteed to need at least one ancilla bit, because 

Like last time, we'll solve the problem for various different types of ancilla bits.
We'll consider *burnable* ancilla bits (initially zero, allowed to end up non-zero), *zeroed* ancilla bits (initially zero, must end up zero), and *borrowed* ancilla bits (unknown initial value, must end up as that same value).

(*Side note: I'm skipping garbage ancilla bits (unknown initial value, allowed to end up different) this time because I didn't find a nice way for them to provide much benefit over borrowed bits when incrementing.*)

We'll start with the single ancilla bit case.

# Single Ancilla Bit

Given an $n+1$ wire circuit with $n$ increment wires and one ancilla wire, we want to break the increment into smaller operations.
The goal, in this section, is not about getting all the way down to Toffoli gates.
Instead, we simply want to reduce the size of the operations we're using.
Once the operations are small enough, possibilities open up because we can borrow our own unused bits for use as ancilla.

The first case to consider is what to do when the single given ancilla bit is burnable.
The top wires, which store the low bits of the number we want to increment, can be incremented without depending on the bottom wires in any way.
The bottom wires, which store the high bits, should only be incremented when the top wires are all ON.
We can avoid the bottom wires depending on $n/2$ top wires by storing the intersection of those wires in the ancilla bit.
That way, the bottom wires only need to depend on one control:

<img src="http://i.imgur.com/3PiQ1ho.png" alt="Split incrementer from Burnable bit" height="350px"/>

Note that we can absorb the single extra control into the increment gate.
A controlled increment gate is equivalent to an increment gate with the control wire as the new lowest bit, except that the final NOT on the low bit is missing.
Therefore we can absorb controls into increments by following the increment with a NOT of the control:

![Top control = bigger increment withnot](http://i.imgur.com/4At5Uae.png)

Note that it's important to treat the absorbed control bit as the low bit, even if the absorbed wire is in the "wrong" position.
Either the control bit must be swapped into the right position, or a custom re-arranged increment gate will be needed.

The next case to consider is the single zeroed bit case.
All we need to do here is take our solution to the burnable bit case, and [uncompute](https://en.wikipedia.org/wiki/Uncomputation) the effects we had on the ancilla bit.
This is a simple addition to the circuit, because we only had one easily reversed effect:

<img src="http://i.imgur.com/VdqzjFW.png" alt="Split incrementer from Zeroed bit" height="350px"/>

The last single-ancilla bit case we're considering is the borrowed ancilla bit case.
This time, it takes more than a simple tweak to make things work.

In the last post, we used *toggle detection* when working with garbage bits and borrowed bits.
We repeating a self-undoing operation twice, conditioned on the garbage bit, so that the operation would undo itself unless the bit was toggled.
This won't work for incrementing, because increment is not its own inverse.

I was stuck on this problem for quite awhile, but eventually I realized that the trick was to mix in the *bitwise complement*.
When the bits of a two's-complement number $X$ are all toggled, they switch from storing $X$ to storing $\overline{X} = -X-1 \pmod{2^n}$.
If we increment the complemented value, then take the complement again, the bits will be storing $\overline{\overline{X} + 1} = \overline{-X - 1 + 1} = -(-X)-1 = X-1$.

Surrounding an increment gate with NOTs turns it into a decrement! (And vice versa.)

![Increment equals decrement surrounded by nots](http://i.imgur.com/LhVB55R.png)

The conversion from increment to decrement is useful to us because now we can now turn an increment into the inverse of an increment, and we can do it conditionally.
That's the trick we'll use to make toggle detection work in this case:

- We will apply an increment gate and a decrement gate to the high bits of the number.
- Both operations will be conditioned on the borrowed ancilla bit.
- We will toggle the ancilla wire and the high bits, before and after the decrement gate, whenever the top wires are all `On`.
    - If the low bits are *not* all `On`, nothing will happen to the bottom wires.
    In the case where the borrowed ancilla bit is `Off`, neither the increment nor the decrement gate will apply and so nothing will happen.
    In the case where the borrowed ancilla bit is `On`, both the increment and the decrement gate will apply, undoing each other, and so overall nothing will happen.
    - If the low bits are all `On`, then the NOTs around the decrement gate effectively transform it into an increment gate.
    In the case where the borrowed ancilla bit is `On`, the increment gate will fire and the decrement-turned-increment gate will not.
    In the case where the borrowed ancilla bit is `Off`, only the decrement-turned-increment gate will fire.
- Therefore, when the low bits are all `On` the high bits will be incremented exactly once.
And when the low bits are not all `On`, nothing happens to the high bits.
That's exactly the logic we want, solving the problem.

Here's what the single borrowed bit construction looks like, for 8-bit numbers:

<img src="http://i.imgur.com/XC374p4.png" alt="Split incrementer from Borrowed bit" height="350px"/>

The above circuit also uses one other trick, that I didn't mention.
Because we want to toggle so many bits when the first $n/2$ bits are `ON`, but we don't want to pay the quadratic price of having $n/2$ gates of size $n/2$, we use toggle-detection to spread the toggling of one target bit to all the other targets.

The constructions so far let us turn any $n$-bit increment gate into two or three $n/2$-bit increments, depending on what type of ancilla bit we have.
We could apply these constructions again and again, cutting the size of increments in half until we hit simple base cases, but that would not be efficient.
For example, the recurrence relation for the single borrowed bit construction is $T(N) = 3 T(N/2) + O(N)$ and [that means](https://en.wikipedia.org/wiki/Master_theorem) $T(n) \in O(n^{log_2(3)}) \approx O(n^{1.585})$, not $O(n)$.

To achieve a linear number of gates, we'll need to borrow bits from ourselves, just like last time.

# $n$ Ancilla Bits

Given a $2n$ wire circuit, with $n$ target wires and $n$ ancilla wires, we want to increment the target wires.
And we want to do it with at most $O(n)$ Toffoli-or-smaller gates.

The burnable bits case only needs $n-2$ of the $n$ available ancilla bits.
By using the burnable bits to accumulate the intersection of controls, we can pair each target bit then use those stored values to update the target bits:

<img src="http://i.imgur.com/w4iZ92K.png" alt="Incrementer from n-2 Burnable bits" height="300px"/>

The zeroed bits case is solved, as with the single bit case, by uncomputing. We simply sweep up afterwards:

<img src="http://i.imgur.com/xs1NtN1.png" alt="Incrementer from n-2 Zeroed bits" height="300px"/>

The $n$ borrowed bit case is the one I had the hardest time with.
I was stuck on it for a solid week, unable to come up with anything that worked.
The basic reason that I wasn't making progress are two-folder.
First, I was trying to make things work with $n-2$ ancilla bits, instead of $n$.
Second, I was trying to avoid putting any temporary garbage into the bits.

Eventually, after spinning in circles for an embarrassing amount of time, I came across the [VanRentergem adder](http://ftp.qucis.queensu.ca/home/akl/cisc879/papers/PAPERS_FROM_UNCONVENTIONAL_COMPUTING/VOLUME_1_Issue_4/RENTERGEM.pdf) ([source of diagram](http://iopscience.iop.org/1751-8121/43/38/382002/fulltext/)):

![VanRentergem adder](http://cdn.iopscience.com/images/1751-8121/43/38/382002/Full/jpa348454fig03.jpg)

The VanRentergem adder takes a carry bit $c$, a two's complement value $a$, a two's complement value $b$, and turns $(c, a, b)$ into $(c, a, a+b+c)$.
We'll use a tweaked version of the circuit, made out of Toffoli gates instead of controlled-swap gates, and with the gates reversed so it does subtraction instead of addition:

<img src="http://i.imgur.com/irgmgGa.png" alt="Subtraction Widget" height="300px"/>

With the above circuit, we can subtract a garbage carry bit $c$ and a garbage two's-complement value $g$ out of our target value $v$.

On its own, that's not particularly useful because we don't want garbage mixed into in our target bits.
Fortunately, we can use the bitwise complement trick to fix the problem.
If we apply the subtraction widget, then toggle $g$'s bits, then apply the subtraction widget again, the target bits will transition from storing $v$ to storing $v-c-g$ to storing $v-c-g-(-g-1)-c = v-2c+1$.

(*Caution: because we we're storing one more bit of $v$ than we are of $g$, adding $g$ and its complement will toggle $v$'s high bit. Put a NOT on the high bit to fix that problem.*)

Consider how $v-2c+1$ behaves for each possible value of $c$.
When $c$ is `On` we get $v \rightarrow v-2+1 = v-1$, meaning we *decremented* $v$.
When $c$ is `Off` we get $v \rightarrow v+1$, meaning we *incremented* $v$.
We always want to increment, and can easily turn a decrement into an increment by surrounding it with NOTs, so... just do that.

What we end up with is two VanRentergem-style subtractions. The non-carry-bit garbage is cancelled out by toggling it before and after one of the subtractions. The carry bit garbage is cancelled out by toggling the target bits when the carry bit is `On`. Finally, because the target value has one more bit than the garbage value, the highest bit needs special handling. Overall, you get this:

<img src="http://i.imgur.com/tbah33i.png" alt="Incrementer from n Borrowed bits" width="100%"/>

With these asymptotically efficient $n$ bit constructions in hand, we can fix the inefficiencies in our single bit constructions.

# Putting It All Together

Basically all we need to do, to turn an $n$-bit increment with a single ancilla bit into a linear number of Toffoli-or-smaller gates, is apply the appropriate single bit construction and then apply the appropriate $n$ borrowed bit construction.
However, there are a few caveats.

First, after the single bit construction has been applied, each remaining operation has size at most $\lceil \frac{n}{2} \rceil$ and therefore has access to at most $\lfloor \frac{n}{2} \rfloor$ borrowable unaffected bits. Because $\lfloor \frac{n}{2} \rfloor$ can be one less than $\lceil \frac{n}{2} \rceil$, we sometimes need to apply the single bit construction twice before we have enough bits to apply the $n$ bit construction. Alternatively, because increments only have one controlled-not that touches all the relevant wires, we can pull that operation out of the increment (reducing the increments bit size by 1) and handle it separately.

Second, the constructions make (a constant number of) controlled-not gates (in addition to the created increment gates).
Handling those is just a matter of applying the construction from last time to handle those.

Third, although this construction is asymptotically efficient, it has a large constant factor.
I didn't do a careful analysis, but it seems that an $n$ bit increment turns into something like $30n$ Toffoli-or-smaller gates.

To make sure that the construction actually works, I wrote some [hacky python code to test it](https://gist.github.com/Strilanc/1768464eb8cbca0981cd).
Using that code to generate the 5-bit increment circuit, then crunching it down a bit by hand so the thing fits on the page, gives:

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


If you squint a bit, you can see a bit of a pattern.
To make that pattern very apparent, I printed incrementally larger and larger cases then zoomed out:

![Linear scaling of full incrementer circuit](http://i.imgur.com/fodBO0c.png)

I guess this construction is creating some *delicious* circuits.
mMMmMMMM.
(I am so sorry. Please don't shun me.)

# Summary

Given a single ancilla bit, in an unknown state that must be preserved, you can create $n$-wire increment gates out of $O(n)$ Toffoli-or-smaller gates.

The key parts of the construction are the VanRentergem-style subtraction, and using bitwise complements to conditionally switch between adding and subtracting.

Next time: using quantum gates to bootstrap an ancilla bit.

