One of the dangers of reading about multiplication algorithms is that there's a tantalizingly "simple" open problem about multiplication: can it be done in $O(n \log n)$ time? And, if you're me, it will consume you... at least for a few weeks. On the other hand, that's a really effective way to learn and understand and retain.

In this post, I will try to give an intuitive explanation of the [Schönhage–Strassen algorithm](http://en.wikipedia.org/wiki/Sch%C3%B6nhage%E2%80%93Strassen_algorithm) for multiply two numbers.

**Overview**

There are two fundamental ideas behind the SS multiplication algorithm:

1. [Fourier transforms](http://en.wikipedia.org/wiki/Fourier_transform) turn [convolution](http://en.wikipedia.org/wiki/Convolution) into item-by-item multiplication.
2. The Fourier transform can be done in fields that aren't the complex numbers. In particular, the integers modulo $2^n \pm 1$ make important operations cheap.

**Convolution**

When you multiply two numbers by breaking it into pieces, the way the pieces get added together corresponds to a mathematical operation called [convolution](http://en.wikipedia.org/wiki/Convolution).

For example, suppose we want to multiply $123$ by $789$. We break the problem into $9$ single-digit multiplications: $1 \cdot 7$, $1 \cdot 8$, $1 \cdot 9$, $2 \cdot 7$, $2 \cdot 8$, $2 \cdot 9$, $3 \cdot 7$, $3 \cdot 8$, and $3 \cdot 9$. Then the sum of the right-to-left position of the input digits determines the output position they get added into. This groups the single-digit multiplications into how much you left-shift them, where a left-shift $x \ll y$ is just $x \cdot y^{10}$ (because we're working in base $10$). The groups from our example are:

- $(1 \cdot 7) \ll 4$
- $(1 \cdot 8 + 2 \cdot 7) \ll 3$
- $(1 \cdot 9 + 2 \cdot 8 + 3 \cdot 7) \ll 2$
- $(2 \cdot 9 + 3 \cdot 8) \ll 1$
- $(3 \cdot 9) \ll 0$

If our input numbers are $a = \sum\_{i} a\_i \ll i$ and $b = \sum\_{i} b\_i \ll i$, where $a\_i$ and $b\_i$ are the digits of $a$ and $b$ respectively, then the multiplication of $a \cdot b$ can be broken into digit multiplications grouped by where they get shifted. $\sum\_{t} \left( \left( \sum\_{i} a\_i b\_{t-i} \right) \ll t \right)$. Notice how we are scanning one way in the first vector while scanning the other way in the second vector. That's one group. Then we move the starting point in the second vector to the right, do it again, and that's the next group. This "opposite scan" pattern is convolution. If $v = a \ast b$ then $v\_t = \sum\_{i} a\_i b\_{t-i}$.

**Fourier Transform**

There's an excellent introductory [explanation of the Fourier Transform on the site Better Explained](http://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/).

Basically, the Fourier transform tells you how to create some given data by adding up some scaled circular motions. It is how your audio player converts between speaker-position-space and frequency-space. It is *incredibly* useful, and you should [learn lots about it](https://www.youtube.com/watch?v=gZNm7L96pfY), because it's basically a cheat code for many types of problems.

The definition of the Fourier transform, for discrete data, is: $F\_f = \sum\_{k=0}^{n-1} v\_k \exp(i \, \tau \frac{f k}{n})$. In other words: take a vector with $n$ values, rotate the $k$'th value by $\frac{1}{n}$ of a turn  in the [complex plane](http://en.wikipedia.org/wiki/Complex_plane) repeatedly until you've done it $f \cdot k$ times, then add up the values and that's the amplitude of the $f$'th frequency in the vector's data.

Undoing the Fourier transform, to go from frequencies back to positions,  is basically the exact same operation. The only difference is that you rotate in the opposite direction, and you have to cancel out some unfortunate scaling by dividing by $n$. Mathematically, that's $v\_k = \sum\_{f=0}^{n-1} F\_f \exp(-i \, \tau \frac{f k}{n}) / n$.

The interesting property about the Fourier transform relevant to multiplication is that it lets you compute the convolution of two vectors quickly. You just Fast Fourier Transform the vectors, multiply matching entries together, and inverse FFT the result. I will give an example in the next section, but with a generalization.

**The "Fermat" Transform**

The Fourier transform can be generalized to work with other sorts of numbers. As long as addition is nice and multiplication is nice, and $w^n = 1$ but $w^c \neq 1$ for $0 \lt c \lt n$, you can do a Fourier transform on vectors of $n$ items in your field.

The particular field that we care about is the integers modulo $2^n + 1$ or $2^n - 1$, for some integer $n > 0$. There are advantages to using $2^n + 1$, but we're going to use $2^n - 1$ because it's easier to explain and you get the same asymptotic complexity at the end.

Notice that $2$ is an $n$'th root of unity when working in the integers modulo $2^n - 1$. Multiply $2$ by itself $n$ times, and you end up back at something congruent to $1$ because $2^n - (2^n - 1) = 1$. So let's use it, instead of $\frac{1}{n}$'ths of a turn in the complex plane. Let's also define $a \ll x = a \cdot 2^x$ to make it a bit simpler:

$F\_f = \sum\_{k=0}^{n-1} \left( v\_k \ll f k \right) \pmod{2^n-1}$

However, we have a bit of a problem when we compute the inverse because we have to divide by $n$:

$F\_f = \sum\_{k=0}^{n-1} \left( v\_k \gg f k \right) / n \pmod{2^n-1}$

But it's not guaranteed that, when working modulo $2^n$, there will be a unique answer $c$ to $c \cdot n = a$ for some $a$. For example, $2^4-1 = 15$ but there's no solution to $x \cdot 3 = 1$. Also, these are not constant-sized numbers that we're dividing! We have to do this operation multiple times, so we should try to make it cheap.

The solution to this division issue is to make $n$ be a power of $2$, so we're working modulo $2^{2^s} - 1$ for some integer $s \geq 0$. That turns the division into a right shift by $s$, and we can do that efficiently.

Numbers of the form $2^{2^s} - 1$ are called [Fermat numbers](http://en.wikipedia.org/wiki/Fermat_number), and so a generalized Fourier transform in the field of integers modulo $2^{2^s} - 1$ is sometimes called a "Fermat" transform.

**Convolution Example**

$F\_f = \sum\_{k=0}^{2^s-1} \left( a\_k \ll f k \right) \pmod{2^{2^s}-1}$

$G\_f = \sum\_{k=0}^{2^s-1} \left( b\_k \ll f k \right) \pmod{2^{2^s}-1}$

and then inverse transform:

$p\_i = \sum\_{f=0}^{2^s-1} \left( F\_f G\_f \ll f i \right) \pmod{2^{2^s}-1}$

$p\_i = \sum\_{f=0}^{2^s-1} \left( \left( \sum\_{k=0}^{2^s-1} \left( b\_k \ll f k \right) \right) \left( \sum\_{k=0}^{2^s-1} \left( a\_k \ll f k \right) \right) \ll f i \right) \pmod{2^{2^s}-1}$

$p\_i = \sum\_{f=0}^{2^s-1} \left( \left( \sum\_{k=0}^{2^s-1} \sum\_{j=0}^{2^s-1} \left( a\_j \ll f j \right) \left( b\_k \ll f k \right) \right) \ll f i \right) \pmod{2^{2^s}-1}$

$p\_i = \sum\_{f=0}^{2^s-1} \left( \sum\_{k=0}^{2^s-1} \sum\_{j=0}^{2^s-1} \left( a\_j b\_k \ll (f j + f k + f i) \right) \right) \pmod{2^{2^s}-1}$

$p\_i = \sum\_{k=0}^{2^s-1} \sum\_{j=0}^{2^s-1} \sum\_{f=0}^{2^s-1} \left( a\_j b\_k \ll (f \cdot (j + k + i)) \right) \pmod{2^{2^s}-1}$

$p\_i = \sum\_{k=0}^{2^s-1} \sum\_{j=0}^{2^s-1} \left( a\_j b\_k \sum\_{f=0}^{2^s-1} 2^{f \cdot (j + k + i)} \right) \pmod{2^{2^s}-1}$

$p\_i = \sum\_{k=0}^{2^s-1} \sum\_{j=0}^{2^s-1} \left( a\_j b\_k \sum\_{f=0}^{2^s-1} 2^{f \cdot (j + k + i)} \right) \pmod{2^{2^s}-1}$

The crucial thing to realize here is that we now have two cases: either $j+k+i=0$, or not. If it's equal to zero, then the inner sum is just $1$ added up $2^s$ times. If it's not zero, then it's $\sum\_{f=0}^{2^s-1} (2^x)^f$ and we can use the power thingy to get $\frac{(2^x)^{2^s} - 1}{2^s - 1}$. But we know that $2^{2^s} = 1$, so this is just $\frac{1^x - 1}{2^s - 1} = 0$. Given the fact that $j+k+i = 0 \pmod{2^s}$, we get:

$p\_i = \sum\_{k=0}^{2^s-1} a\_j b\_{-k-i \pmod{2^s}} \pmod{2^{2^s}-1}$

and that's just the cyclic convolution. *Which means we can use the Fermat transform to do our digit multiplications faster*.

**Choice of Field**

What field should we do the transform in? What base should our digits be? Well, there's a couple constraints.

First, we need the field to be large enough to transform our input data. Our field has $2^{2^s}-1$ elements and a $2^s$'th root of unity, so we can transform $2^s$ items of size $\log(2^{2^s}-1)$ for a total of approximately $4^s$ bits. So $s \gt \log\_4 n$, where $n$ is the size of our inputs.

Second, we need the field to be large enough to represent our outputs. The maximum value an output can take on is the sum of $2^s$ maxed out then squared inputs. Squaring doubles the number of needed bits, and adding together $2^s$ items adds up to $\log 2^s = s$ bits, so we need $\frac{n}{2^s} \cdot 2 + s \leq 2^s$ bits per field item. So $n \leq (4^s - s 2^s) / 2 \lt 4^s$, meaning we again have $s \gt \log\_4 n$.

The cost of adding and shifting in this field is proportional to the size of the items, which is $2^s$. Additionally, the transform does $s$ passes with each requiring $O(2^s)$ operations. Basically, our costs are all proportional to $s$ so we should make it as small as possible. So we should set $s \approx \log\_4 n$, meaning the field will have $2^{\log\_4 n} = \sqrt{n}$ bits per item. We will divide the input into $\sqrt{n}$ pieces of size $\sqrt{n}$, perform the Fermat transform in $\sqrt{n} \log{\sqrt{n}}$ operations with operations costing $\sqrt{n}$ time, recurse on $\sqrt n$ multiplications of size $2 \sqrt n + \log{\sqrt{n}}$, then perform the inverse transform and do carrying.

It turns out that the running time is dominated by the recursion. The transform takes $O(n \log n)$ time, but the recursive just *barely* doesn't shrink things enough and we end up paying $O(n \log n)$ for each pass and it takes $\log \log n$ passes to get from $n$ to $O(1)$ by repeated square rooting. So the overall time is $O(n \log n \log \log n)$.

**Example**

**Are there better fields**

One wonders if there are better fields to do the arithmetic in. In particular, working $2^{2^s}-1$ gives us very few root orders per size of field. Contrast that with a prime field, which has exponentially more. The basic problem is that *shifting absolutely positively must be cheap* for a field to work.

Let $g$ be the bit size of the field. Let $r$ be the number of roots in the field. Let $s$ be the cost of shifting and $a$ the cost of adding.

Consume input constraint: $g \cdot r \in \Omega(n)$

Recursion constraint: $r \cdot g \cdot \log g \in O(n \log n)$

Twiddle constraint: $(s + a) r \log r \in O(n \log n)$

If you don't meet those constraints, your Fourier transform style multiplication algorithm is not an $n \log n$ algorithm.

Interestingly, the SS algorithm *does* meet these constraints. They're necessary, but not sufficient.

I think we need a field that has a lot more roots, so that we can set $g$ to $\log n$ and $r$ to $\frac{n}{\log n}$. Then all you need is a field where adding and multiplying are linear time... except that's not so easy. If you work modulo a prime you have more than enough roots, but multiplication is not linear. If you work modulo $(2^n+1)^2$ you still have enough roots, but shifting is not linear. If you work in $3^n \pmod 2^m$ then you have enough roots, and I think shifts can be done in $n \log \log n$ time, but that's still not good enough.

If you try to ammortize the cost of shifting by sorting the inputs, you find that sorting has an extra factor of $log(n)$ in the complexity model and so we blow the pass constraint!

---


