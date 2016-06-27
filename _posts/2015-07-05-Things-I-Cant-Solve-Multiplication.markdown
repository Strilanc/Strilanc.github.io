---
layout: post
title: "Things I Can't Solve: Multiplication"
date: 2015-07-05 11:30:00 EST
categories: computer-science
comments: true
highlight_in_list: true
---

In this post: how (some) [fast multiplication algorithms](https://en.wikipedia.org/wiki/Multiplication_algorithm#Fast_multiplication_algorithms_for_large_inputs) work, and a couple gotchas I've run into from toying with them.

# Intro

Finding an asymptotically fast algorithm for multiplication is one of those too-easily-accessed yet too-hard-to-solve problems that steals one of my weekends every now and then.
Although the problem is hard, perhaps best exemplified by the [asymptotically fastest known algorithm](https://en.wikipedia.org/wiki/F%C3%BCrer%27s_algorithm) having a running time of $O \parens{ n \log (n) 2^{3 \log^*{n}} }$ instead of the conjectured-to-be-optimal $O(n \log n)$, it hides lots of little accessible insights.
And tinkering with the algorithms is fun in a frustrating kind of way.

For example, here's one minor insight: squaring is not easier than multiplying.
If you can square quickly, then you can multiply quickly by rewriting $a \cdot b$ into a difference-of-squares form: $\frac{1}{4}\parens{(a + b)^2 - (a - b)^2}$.
This asymptotic equivalence is convenient, because some multiplication algorithms are easier to understand as squaring algorithms (e.g. [Karatsuba's](https://en.wikipedia.org/wiki/Karatsuba_algorithm) in my opinion; because $(a \ll n + b)^2 = (a^2 \ll 2n) + (((a+b)^2 - a^2 - b^2) \ll n) + b^2$).

I can't say I've made any progress on the fast-multiplication problem. At all. But I guess I've learnt some things and I can talk about those.

# Convolution and Principal Roots

The fastest known multiplication algorithms are all based on the [convolution theorem](https://en.wikipedia.org/wiki/Convolution_theorem).
They use a change of basis to turn [cyclic convolutions](https://en.wikipedia.org/wiki/Circular_convolution) into [point-wise products](https://en.wikipedia.org/wiki/Pointwise_product).
(The hard part of multiplying, adding up all the little sub-factors, can be reduced to a cyclic convolution.)

The underlying thing you need, in order to make the convolution theorem work, is a [principal root of unity](http://mathworld.wolfram.com/PrincipalRootofUnity.html).
With such a root, you can create a set of basis vectors $v\_0, v\_1, \ldots, v\_{n-1}$ where there's no "cross-talk" when performing a cyclic convolution.
That is to say, when we compute the cyclic convolution of two basis vectors $v\_a \ast v\_b$ we will get $0$.
This is useful because it means that convolutions-of-sums like $(v\_a + v\_b) \ast (v\_a + v\_b)$ will simplify into things like $v\_a^{\ast 2} + v\_b^{\ast 2}$ instead of $v\_a^{\ast 2} + v\_b^{\ast 2} + 2 v\_a \ast v\_b$.
Losing the $2 v\_a \ast v\_b$ part reduces the fan-out when recursing, which is a big deal when it comes to asymptotic complexity.

What *exactly* is a principal root of unity? Formally, an $n$'th principal root of unity $\lambda$ must satisfy two properties:

1. You have to get unity when you raise it to the $n$'th power.
(Otherwise it wouldn't be much of a "root of unity".)

    $\lambda^n = 1$

2. If you sum up all the powers of $\lambda$, or every second power (wrapping around), or every third power, or every $k$'th power, you have to get a total of nothing.
(This is the "no-cross-talk" part.)

    $\Sum{i=0}{n-1} \lambda^{k i} = 0$ for every $k \in [1, n)$

For example, the number two is a fourth principal root of unity when working modulo five:

- Exponentiates to one: $2^4 = 16 = 1 \pmod{5}$. Check!
- Sum of powers is zero: $2^0 + 2^1 + 2^2 + 2^3 = 1 + 2 + 4 + 8 = 15 = 0 \pmod{5}$. Check!
- Sum of every second power is zero: $2^0 + 2^2 + 2^4 + 2^8 = 1 + 4 + 16 + 64 = 85 = 0 \pmod{5}$. Check!
- Sum of every third power is zero: $2^0 + 2^3 + 2^6 + 2^9 = 2^0 + 2^3 + 2^2 + 2^1 = 0 \pmod{5}$. Check!

A more commonly used example of a principal root of unity is the [complex roots of unity](https://en.wikipedia.org/wiki/Root_of_unity).
A specific example is that the complex number $\cos(\tau/3) + i \sin(\tau/3)$ is a third principal root of unity (go ahead, check).
More generally, $e^{i \tau / n}$ is always an $n$'th principal root of unity (and forms the foundation of the [Fourier transform](https://en.wikipedia.org/wiki/Fourier_transform)).

With a principal root of unity in hand, we can go about constructing a "no-cross-talk" basis.

# A Useful Basis

Suppose we're given an $n$'th principal root of unity $\lambda$.
We know that $\lambda$ satisfies some useful properties related to sums of powers, sums of even powers, and so forth, so let's try to exploit that.
We'll crib the entries of our vectors directly from the lists of things that must sum up to zero.
More specifically, the $(k+1)$'th vector's $(j+1)$'th entry will be $\lambda^{kj}$.
That gives us a set of basis vectors:

$v\_0 = [1, 1, 1, \ldots, 1]$

$v\_1 = [1, \lambda, \lambda^2, \ldots, \lambda^{n-1}]$

$v\_2 = [1, \lambda^2, \lambda^4, \ldots, \lambda^{(n-1)2}]$

$\ldots$

$v\_k = [1, \lambda^{k}, \lambda^{2k}, \ldots, \lambda^{(n-1)k}]$

$\ldots$

$v\_{n-1} = [1, \lambda^{n-1}, \lambda^{n-2}, \ldots, \lambda]$

Now, consider what happens when we compute the cyclic convolution of two basis vectors $v\_a \ast v\_b$ with $a \neq b$.
The $i$'th entry of the resulting vector will equal:

$(v\_a \ast v\_b)_i = \Sum{j=0}{n-1} \lambda^{a j} \lambda^{(i-j) b} = \lambda^{b i} \Sum{j=0}{n-1} \lambda^{(a-b) j}$

But notice that, in that last term, $a - b$ is constant and being multiplied against the iteration variable.
This is one of the sums that must come out zero if $\lambda$ is a principal root of unity!
Therefore $v\_a \ast v\_b = 0$ when $a \neq b$.
When $a = b$, we are instead summing up $n$ copies of $\lambda^0 = 1$ and multiplying that by what happens to be the original value of the vector.
So we end up scaling: $v\_a^{\ast 2} = n v\_a$.

The above facts imply great things when it comes to re-expressing a cyclic convolution in terms of our special basis $v$.
We can decompose a vector $x$ into $x = a\_0 v\_0 + a\_1 v\_1 + \ldots + a\_{n-1} v\_{n-1}$, and then $x^{\ast 2}$ will simplify very nicely:

$x^{\ast 2}$

$= \parens{a\_0 v\_0 + a\_1 v\_1 + \ldots + a\_{n-1} v\_{n-1}}^{\ast 2}$

$= \parens{a\_0 v\_0}^{\ast 2} + \parens{a\_1 v\_1}^{\ast 2} + \ldots + \parens{a\_{n-1} v\_{n-1}}^{\ast 2}$

$= n \parens{a\_0^2 v\_0 + a\_1^2 v\_1 + \ldots + a\_{n-1}^2 v\_{n-1}}$

This means that, if we can efficiently convert to and from our special basis (usually by adapting a [Fast Fourier Transform](https://en.wikipedia.org/wiki/Fast_Fourier_transform) algorithm), then we can quickly square a number (or multiply two numbers) by converting to the special basis, squaring each coefficient there individually, then converting back.
(Just don't forget to cancel out that pesky factor of $n$ when you're done.)

# In Practice: The Schönhage–Strassen Algorithm

The [Schönhage–Strassen algorithm](https://en.wikipedia.org/wiki/Sch%C3%B6nhage%E2%80%93Strassen_algorithm) (hereafter SSA) is a convolution-based multiplication algorithm, and was the fastest known for decades.
SSA works in the ring of integers modulo $2^{2^s} + 1$.
(Ah, that's a bit hard to read, so let's define $m = 2^s$. We're working modulo $2^m + 1$.)

It so happens that two is a $2m$'th principal root of unity of that ring.
This is ultimately the reason SSA is so fast: the basis change can be done with shifts instead of multiplications (thanks, powers of two!).
Instead of taking $\Omega(n \log^2{n})$ time, SSA uses only $O(n \log{n})$ time on its basis change.

Although the SSA basis change takes $O(n \log{n})$ time, the *overall* running time of SSA is still $O(n \log(n) \log(\log(n)))$.
What's going on?
It has to do with the chosen principal root of unity wrapping around a bit too quickly.

In a field with $2^m + 1$ elements, it takes only $m$ doublings to hit $2^m$, the value congruent to -1.
After $m$ more doublings, effectively multiplying by -1 again, we'll be back to 1.
SSA is using a principal root of unity of order $2^{s+1} = 2m$, and that order is logarithmic with respect to the field size $2^m + 1$.

The logarithmic order of the principal root of unity has one major consequence: limiting how many pieces we can use when splitting up a number to be squared.
We're trying to represent each piece as a linear combination of vectors from a basis with dimension equal to the order of the principal root of unity, but if we have more pieces than that then there must be some direction that we're failing to cover.
You can't shove an $n$-dimensional vector space into an $(n-d)$-dimensional vector space without losing information.

Suppose we divide the input number into $k$ pieces of size $\frac{n}{k}$.
We need a field with at least $k$ roots to handle all those pieces, so $2m$ must be at least $k$.
But we also need the field to be large enough to hold the $\frac{n}{k}$ bits we're putting into each piece, and that means $m$ must be at least $\frac{n}{k}$ (plus a bit more overhead).
The latter constraint makes us want to use a lot of small pieces, but the former heavily constrains how small we can go.

The two opposing constraints meet at a sweet spot around $k \approx \sqrt{n}$, so we end up using $\sqrt{n}$ pieces of $\sqrt{n}$ size.
It takes $\log(\log(n))$ repeated square roots to go all the way from $n$ to a constant-sized base case, and that's where the extra $\log(\log(n))$ factor in the runtime complexity comes from.

Contrast the above with what we could do if we were working modulo a prime $p$ with a $p-1$'th principal root of unity.
The piece-size and root-number constraints now look like $p \geq k$ and $p \geq 2^\frac{n}{k}$.
These new constraints let the sweet spot drop all the way to $k \approx \frac{n}{\log{n}}$, so we could use logarithmically sized pieces.

Logarithmically sized pieces would be great, because they let you short-circuit the recursion right away.

# Performing Many Small Squarings Fast

If you have $n/\log(n)$ squarings of size $\log{n}$ to perform, you can perform them all in $O(n \log n)$ time.
The trick to doing this is to sort the inputs into ascending order (but keep track of the original order) and to then literally stream out every possible square number while iterating through the inputs:

    def stream_square(inputs):
        """
        Squares n inputs of size w in O(w n log(n) + w 2^w) time.
        """
        indexed = zip(inputs, range(len(inputs)))  # O(w n)
        ordered = sorted(indexed, key=lambda e: e[0])  # O(w n log(n))

        # O(n w + w 2^w)
        counter = 0
        counter_squared = 0
        ordered_squared = []
        for e in ordered:
            while counter < e[0]:
                # This inner-loop costs O(w 2^w) total.
                # It runs at most 2^w times and costs w each time.
                counter_squared += counter
                counter += 1
                counter_squared += counter
            ordered_squared.append((counter_squared, e[1]))
        restored = sorted(ordered_squared, key=lambda e: e[1])  # O(w n log(n))
        return [e[0] for e in restored]  # O(w n)

This means that *if* you could perform an application-of-convolution-theorem basis change in $O(n \log{n})$ time, *and* end up with $O(n / \log(n))$ pieces of size $O(\log n)$, then you could multiply in $O(n \log{n})$ time.

**Update (June 2016):**
*I have no idea why I ever thought this was a good idea, or why no one called me on it. Just performing the squarings separately is cheaper than $n \lg n$.*

This doesn't apply to SSA because working modulo $2^{2^s}+1$ doesn't give you enough pieces.

... Okay, segway question that's been bothering me for awhile: why does SSA's modulus use a power-of-a-power-of-2 like $2^{2^s}$ instead of just a normal power-of-2 like $2^m$?

# Degenerate Orders

Suppose we're working with the ring of integers modulo $3^n$.
It so happens that $2$ meets all the requirements to be a $2\cdot 3^{n-1}$'th principal root of unity for this ring.
Does that mean we can apply the convolution theorem in order to perform a multiplication cheaply?
Not exactly.

Recall that, in the special basis we create to turn convolution into point-wise multiplication, $v\_a^{\ast 2}$ is equal to $n v\_a$ where $n$ is the order of the root.
In the case of the integers modulo $3^n$ with principal root of unity chosen to be two, this comes out as $2 \cdot 3^{n-1} v\_k$.
... But that multiplication includes a (rather large) power of three, and powers of three have no multiplicative inverse when working modulo $3^n$.
In this ring, we can't undo the multiplication created by the convolution theorem!
If we try to compute a convolution this way, we'll just end up pushing almost all of the information out off the ring.
Whoops.

This is actually why the Schönhage–Strassen algorithm requires you to use a field of doubly-power-of-two size like $2^{2^s}+1$, instead of just $2^n+1$.
The principal root of unity (two) has order $2n$ when working modulo $2^{n+1}$, but $2n$ may not have a multiplicative inverse in that context.
For example, when working modulo $2^9+1$, applying the convolution theorem will cause a multiplication by 9 but $2^9 + 1 = 513=57 \cdot 9$, so we can't undo that multiplication.
So a convolution would throw away information.

When the $n$ in $2^n$ is also a power of two, there's guaranteed to be a multiplicative inverse because our principal root of unity passes through every power of two on its cycle back to 1.
Thus why SSA sticks to $2^{2^s}+1$-sized fields.
(A side-benefit of requiring the number of pieces to be a power of two is that you can adapt the dead-simple [Cooley-Tukey algorithm](https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm) for the basis change, instead of using something more esoteric.)

So not only do we need a fast basis change and a principal root of unity of large order, we have to be careful where that largeness comes from.
If the order shares factors with the size of the ring, it won't work.

Let's cover some more things that don't work.

# Things I've Tried

The title of this post says I can't solve the multiplying-fast problem.
I suppose I should justify that statement by noting some of the things I've tried that don't work.

1. **Cache the squares.**

    Caching all the multiplications up to numbers of size $\log(n)$ would take $O(n^2)$ space, but caching just the *squares* only takes $O(n)$ space.
    Maybe we can make a lookup-table and perform $\log(n)$-sized squarings in constant time?

    Unfortunately, although this did give me the "sort inputs and stream squares" idea, there are practical and theoretical reasons this lookup table won't work.
    
    Practically speaking, your computer can already square numbers up to 128 bits in size in constant time.
    And you simply won't have the space to store a table with more than $2^{128}$ elements.
    
    Theoretically speaking, the table lookup falls afoul of the rules of the abstract machine we're using.
    If we're working in the [RAM model with logarithmically sized words](http://blog.computationalcomplexity.org/2009/05/shaving-logs-with-unit-cost.html), then we can already do the squarings we're caching in constant time.
    If we're working with *bit complexity*, then lookups aren't constant time because you need $O(\log n)$ time just to read the bits of the offset to jump to.
    And if we're thinking of multi-tape turing machines, then we're really hosed because those can't do random access.
    
    No actual benefit. Doesn't work.

2. **Use the field of integers modulo a prime $p$.**

    The SSA algorithm is based on using an alternative system of arithmetic, the integers modulo $2^{2^s}+1$. Maybe there are better systems to use?
    
    There are primes where two is a $p-1$'th principal root of unity modulo $p$.
    That's as proportionally large as the order of a root of unity is going to get; we cycle through every single other value in the field before returning to 1!
    Except, that means the powers of two can't possibly satisfy any property for making the twiddling factors cheap to apply.
    
    Too expensive. Doesn't work.

3. **What about Modulo $(2^n+1)^2$ or $(2^n-1)^2$**?
    
    The hope for this idea was: maybe squaring the size would happen to square the order of the root, and not ruin everything in the process? That hope was wrong.

    Instead of squaring the root's order, e.g. from $2m$ to $4m^2$, squaring the size of the ring seems to multiply the root's order by the same factor that the ring's size was multiplied by.
    That's a problem, because it means the ring size will no longer be co-prime to the order of the root, meaning bye-bye information when convolving.
    
    Gives wrong answers. Doesn't work.

4. **Modulo $3^n$?**

    As explained earlier in the post: size of field not co-prime to order of root.

    Gives wrong answers. Doesn't work.

5. **Okay, okay, these modulo ideas don't seem to be working. But what if we worked Modulo $lcm(2^n+1, 2 \cdot 2^n+1)$**?

    This particular ring is tempting.
    
    First, it takes quadratically many doublings (w.r.t. $n$) to get back to 1.
    That would let us tweak SSA to use $\sqrt[3]{n}^2$ pieces, instead of $\sqrt{n}$ pieces, which might avoid the $\log \log n$ overhead factor.
    
    Second, operations are cheap.
    You can represent a number $x$ as a pair of numbers $[x \bmod (2^m+1), x \bmod (2 \cdot 2^m+1)]$ and later recover its value thanks to the [Chinese remainder theorem](https://en.wikipedia.org/wiki/Chinese_remainder_theorem).
    Within that representation, adding or multiplying two values is simply done point-wise, e.g. $[2, 3] \cdot [5, 7] = [2 \cdot 5, 3 \cdot 7]$.
    Combined with the fact that this representation turns every power of two into a pair of powers of two, we can directly steal SSA's tricks for performing twiddles cheaply.

    The problem?
    Two is a root of unity of this field, but not a *principle* root of unity.

    Has cross-talk. Doesn't work.

6. **Use the [Hadamard Transform](https://en.wikipedia.org/wiki/Hadamard_transform).**

    The Hadamard Transform is *extremely* similar to the Fast Fourier Transform, but can be done in $O(n \log n)$ time *without multiplying* thanks to the [Fast Walsh-Hadamard Transform](https://en.wikipedia.org/wiki/Fast_Walsh%E2%80%93Hadamard_transform).
    So maybe something interesting will happen if we apply the convolution theorem to the Hadamard basis?
    
    Actually, something interesting does happen!
    [You end up computing](http://dsp.stackexchange.com/a/7965/10155) $y\_j = \Sum{i=0}{n-1} x\_i x\_{j \oplus i}$.
    
    ... Except we wanted to compute of $y\_j = \Sum{i=0}{n-1} x\_i x\_{j - i}$.
    
    F@&$ that's close. Is math literally *toying* with me? Has cross-talk. Doesn't work.

Hopefully that list of my failures was satisfying to the reader.
The list is not exhaustive, but this post really is getting quite long.

# Summary

Fast multiplication algorithms use a basis change and the convolution theorem to turn all-to-all multiplication into one-to-one multiplication.

If you found a way to break a number into $n / \log(n)$ pieces of size $\log n$, and could perform the associated convolution-theorem basis change in $O(n \log n)$ time, you could use sorting and streaming of all the squares up to $\log n$ to create an overall $O(n \log n)$ multiplication algorithm.

If you pick a principal root of unity of order $n$, and $n$ has no multiplicative inverse in the context you're working in, you're gonna have a bad time.

*(Update: Added the "things I've tried" section.)*
