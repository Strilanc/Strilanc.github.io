---
layout: post
title: "Constant Depth Encoded Addition"
date: 2019-05-22 4:10:10 am PST
permalink: post/1901
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Additions circuits compute output bits that depend on a linear number of input bits.
This kind of dependence forces [addition circuits to have $\Omega(\lg n)$ depth](https://cs.stackexchange.com/questions/19468/what-circuit-depth-is-required-to-add).
This is a proven theorem.
There is no such thing as a constant depth adder.

...

...

Or is there?

# Paradox

There are many historical examples of a result that is correct despite apparently violating a theorem.
For example, [Holevo's theorem](https://en.wikipedia.org/wiki/Holevo%27s_theorem) proves you can't transmit more than 1 bit per qubit.
But [superdense coding](https://en.wikipedia.org/wiki/Superdense_coding) is a method for transmitting 2 bits per qubit.
The reason these two results don't contradict each other is because they disagree about whether pre-established entanglement counts as transmitted qubits.
Superdense coding doesn't violate Holevo's theorem, it merely violated our implicit assumptions about what Holevo's theorem meant in practice.

In this blog post, I'm going to present a constant depth adder.
That sounds silly, since there's no such thing as a constant depth adder.
But that's only true if you're using the normal binary representation of a number.
We're going to make an *encoded* constant depth adder, which uses a different representation to enable faster processing.


# Construction

The idea I have in mind isn't particularly complicated, basically it just amounts to "keep the carries instead of propagating them", so I'll explain it with an example.
In this example we will be performing online accumulation.
That is to say, we will be fed a series of integers, one by one, and we need to add up their total value.
To keep things simple I'll work in decimal, and assume we want to perform fixed width addition with 10 digits.

We start by initializing an accumulation register to zero, including an extra top row for carries:

$$
t_0 = {\tiny 0 \atop 0}{\tiny 0 \atop 0}{\tiny 0 \atop 0}{\tiny 0 \atop 0}{\tiny 0 \atop 0}
\
{\tiny 0 \atop 0}{\tiny 0 \atop 0}{\tiny 0 \atop 0}{\tiny 0 \atop 0}{\tiny 0 \atop 0}
$$

The first number shows up.
It's $x\_0=97546\ 96672$.
Nothing really interesting happens as we add it into the accumulation register, because no carries can occur.
Clearly we could do this particular addition in constant depth, because each digit position can be processed in parallel.
Without carries the various digit positions don't interact:

$$
\begin{aligned}
t\_1=&t\_0 + x\_0
\\\\=&\left(
{\tiny  \atop { \atop +} }
{\tiny 0 \atop {0 \atop 9} }
{\tiny 0 \atop {0 \atop 7} }
{\tiny 0 \atop {0 \atop 5} }
{\tiny 0 \atop {0 \atop 4} }
{\tiny 0 \atop {0 \atop 6} }
\
{\tiny 0 \atop {0 \atop 9} }
{\tiny 0 \atop {0 \atop 6} }
{\tiny 0 \atop {0 \atop 6} }
{\tiny 0 \atop {0 \atop 7} }
{\tiny 0 \atop {0 \atop 2} }
\right)
\\\\=&\left(
{\tiny 0 \atop 9}
{\tiny 0 \atop 7}
{\tiny 0 \atop 5}
{\tiny 0 \atop 4}
{\tiny 0 \atop 6}
\
{\tiny 0 \atop 9}
{\tiny 0 \atop 6}
{\tiny 0 \atop 6}
{\tiny 0 \atop 7}
{\tiny 0 \atop 2}
\right)
\end{aligned}
$$

The second number arrives.
It's $x\_1 = 64019\ 68795$.
You might think we can't work on every digit in parallel this time, because there will be carries.
But that's actually fine; it just means that all the carry bits are going to be generated in parallel.
It's only when we try to propagate the carries that we can run into trouble.
And, remember, basically the whole trick here is to *not* propagate the carries:

$$
\begin{aligned}
t\_2=&t\_1 + x\_1
\\\\=&\left(
{\tiny  \atop { \atop +} }
{\tiny 0 \atop {9 \atop 6} }
{\tiny 0 \atop {7 \atop 4} }
{\tiny 0 \atop {5 \atop 0} }
{\tiny 0 \atop {4 \atop 1} }
{\tiny 0 \atop {6 \atop 9} }
\
{\tiny 0 \atop {9 \atop 6} }
{\tiny 0 \atop {6 \atop 8} }
{\tiny 0 \atop {6 \atop 7} }
{\tiny 0 \atop {7 \atop 9} }
{\tiny 0 \atop {2 \atop 5} }
\right)
\\\\=&\left(
{\tiny 1 \atop 5}
{\tiny 0 \atop 1}
{\tiny 0 \atop 5}
{\tiny 1 \atop 5}
{\tiny 1 \atop 5}
\
{\tiny 1 \atop 5}
{\tiny 1 \atop 4}
{\tiny 1 \atop 3}
{\tiny 0 \atop 6}
{\tiny 0 \atop 7}
\right)
\end{aligned}
$$

Note how we're just storing the carries instead of propagating them.

The third number lands, $x\_2 = 73532\ 55939$, and things finally get a little interesting.
There is finally an interaction between digits: the carry bit at position $k$ needs to be read by the digit addition at position $k$, but it also needs to be written by the digit addition at position $k-1$.
We deal with this by simply copying the current carry bits into a temporary carry register that we associate with $x\_2$.
We can then work in parallel over each digit position:

$$
\begin{aligned}
t\_2=&t\_1 + x\_1
\\\\=&\left(
{\tiny\text{ } \atop { \atop +} }
{\tiny 1 \atop {5 \atop 7} }
{\tiny 0 \atop {1 \atop 3} }
{\tiny 0 \atop {5 \atop 5} }
{\tiny 1 \atop {5 \atop 3} }
{\tiny 1 \atop {5 \atop 2} }
\
{\tiny 1 \atop {5 \atop 5} }
{\tiny 1 \atop {4 \atop 5} }
{\tiny 1 \atop {3 \atop 9} }
{\tiny 0 \atop {6 \atop 3} }
{\tiny 0 \atop {7 \atop 9} }
\right)
\\\\=&\left(
{ {\atop} \atop {\tiny+ \atop +} }
{ {\tiny 0 \atop 5} \atop {\tiny 1 \atop 7} }
{ {\tiny 0 \atop 1} \atop {\tiny 0 \atop 3} }
{ {\tiny 0 \atop 5} \atop {\tiny 0 \atop 5} }
{ {\tiny 0 \atop 5} \atop {\tiny 1 \atop 3} }
{ {\tiny 0 \atop 5} \atop {\tiny 1 \atop 2} }
\
{ {\tiny 0 \atop 5} \atop {\tiny 1 \atop 5} }
{ {\tiny 0 \atop 4} \atop {\tiny 1 \atop 5} }
{ {\tiny 0 \atop 3} \atop {\tiny 1 \atop 9} }
{ {\tiny 0 \atop 6} \atop {\tiny 0 \atop 3} }
{ {\tiny 0 \atop 7} \atop {\tiny 0 \atop 9} }
\right)
\\\\=&\left(
{\tiny 0 \atop 3}
{\tiny 1 \atop 4}
{\tiny 0 \atop 0}
{\tiny 0 \atop 9}
{\tiny 1 \atop 8}
\
{\tiny 1 \atop 1}
{\tiny 1 \atop 0}
{\tiny 0 \atop 3}
{\tiny 1 \atop 9}
{\tiny 0 \atop 6}
\right)
\end{aligned}
$$

And we've now covered the general case; hopefully you see why it works.
As long as you do the absolute bare minimum work with the carries, as long as you don't fall prey to a desire to propagate them to completion, updating the accumulator becomes embarassingly parallel.
Thus additions can be done in constant depth.

Of course, eventually, you will want the final result.
When that time comes, you will need to fully propagate the carries and this will take logarithmic depth.
But during the accumulation, when you're using the unfolded-carries representation of the total, each addition can be done in constant depth.

With the idea explained, it's now just a matter of translating it into code:

```python
import numpy as np

class Accumulator:
    def __init__(self, size: int):
        self.bits = np.zeros(size, dtype=np.bool)
        self.carries = np.zeros(size, dtype=np.bool)

    def __iadd__(self, incoming: np.ndarray):
        assert len(incoming) == len(self.bits)
        old_carries = np.copy(self.carries)
        self.carries[1:] = maj(self.bits, incoming, old_carries)[:-1]
        self.bits ^= incoming ^ old_carries
        return self

    def __int__(self):
        result = bits_as_int(self.bits)
        result += bits_as_int(self.carries)
        result %= 2**len(self.bits)  # We want fixed-width addition.
        return result

def maj(a, b, c):
    return (a & b) | (a & c) | (b & c)

def bits_as_int(bits: np.ndarray) -> int:
    return sum(int(b) << k for k, b in enumerate(bits))
```

You can tell that the `__iadd__` method is constant depth (in principle) because it never branches and it only uses broadcasting numpy operations.


# Conclusion

There are number representations other than 2s complement integers, and some of these representations have adders with depths lower than what can be achieved in 2s complement.
The specific number preresentation used in this blog post is a pair of 2s complement registers (the main register and the carry register) where the represented integer is the sum of the two registers.
It is possible to add into this representation (from either an integer using the same representation or from a normal 2s complement integer) in constant depth.

This "use a different representation with lower depth" idea feels like a thing that should already be known and named.
But the closest I was able to find was ["Use of delayed addition techniques to accelerate integer and floating-point calculations in configurable hardware" by Luo et al](https://doi.org/10.1117/12.327033),
which uses (I think) a representation with $\Theta(n \lg n)$ bits instead of the $2n$ bit representation I explained in this post.
If someone knows a relevant paper or wikipedia page with previous work, please let me know.
**Update**: thank you to [peterderivaz for pointing out](https://www.reddit.com/r/algassert/comments/brrcxn/comment_thread_constant_depth_encoded_addition/eom77or/) that this is known as a [carry-save adder](https://en.wikipedia.org/wiki/Carry-save_adder) and dates all the way back to John von Neumann (wow).

Here's an interesting follow-up question for this post: are there *quantum* constant depth encoded adders?
The quantum case is harder because you aren't allowed to leak information about the values that were added into the register (other than the final sum, obviously).
You can't use a pair of registers the way I did in this post, because information leaks out via the way bits are distributed between the two registers.
I just put out [a paper on the arXiv](https://arxiv.org/abs/1905.08488) that contains a construction for an $O(\lg \lg t)$ depth approximate encoded quantum adder (where $t$ is the number of additions you will perform).
Can that depth be achieved with a deterministic adder instead of an (arbitrarily good) approximate adder?
Can the depth be reduced further, all the way down to $O(1)$?
I really don't know.

[View r/algassert comment thread](https://www.reddit.com/r/algassert/comments/brrcxn/comment_thread_constant_depth_encoded_addition/)
