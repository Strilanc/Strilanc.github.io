---
layout: post
title: "Impractical Experiments #3: Treating Controls Like Values"
date: 2015-05-17 11:30:00 EST
categories: impractical-experiments
---

# Controls

Every operation on a circuit, whether the circuit is classical, probabilistic, or quantum, can be represented as a matrix.
This makes it easy to compile the overall effect of the circuit into a single operation: you just multiply the matrices.

When combining operations that apply to different wires, you need to adjust their matrices.
The mathematical tool for doing this is the [Kronecker product](http://en.wikipedia.org/wiki/Kronecker_product) $\otimes$, which essentially tiles one matrix inside of another.

For example, if you want to apply a Hadamard gate $H$ to one wire and a Not gate $X$ to the other wire, then the overall matrix is computed like this:

    ──H──
    ──X──

$H = \frac{1}{\sqrt{2}} \bimat{1}{1}{1}{-1}$

$X = \bimat{0}{1}{1}{0}$

$X \otimes H
= \frac{1}{\sqrt{2}} \bimat{0 \cdot H}{1 \cdot H}{1 \cdot H}{0 \cdot H}
= \frac{1}{\sqrt{2}} \bimat{0\_2}{H}{H}{0\_2}
= \frac{1}{\sqrt{2}} \begin{bmatrix}
0 & 0 & 1 & 1 \\\\
0 & 0 & 1 & -1 \\\\
1 & 1 & 0 & 0 \\\\
1 & -1 & 0 & 0
\end{bmatrix}$.

When the other wire(s) don't have an operation, you kronecker product against identity matrix (to expand the operation to apply to the larger circuit).

Controlled operations, i.e. operations conditioned to only occur if a designated control wire is On, look a little bit like they could be decomposed in this way.
It wouldn't be too crazy for someone's first impression of this:

    ──•──
    ──X──

to be "What's the matrix for that • operation?".
But there is no matrix for the control operation, because a control is not an operation (it's an *operation modifier*).

But what if there *was* a matrix for the "• gate"? How would that work?

# Hacky Matrices

When I wrote my quantum circuit simulator, I did actually represent controls as a matrix.

It wasn't a normal matrix, of course.
It contained a "special" value, which I'll call $\mu$ in this post.
In the code, $\mu$ was just an instance of the `Complex` class with real part 1 and complex part 0.
So it acted like 1 everywhere... except in the Kronecker product code, which explicitly checked for it using reference equality:

    def kronecker_product(m1, m2):
      w1, h1 = len(m1), len(m1[0])
      w2, h2 = len(m2), len(m2[0])
      return [[
          controlled_product(m1[i1][j1], m2[i2][j2], i1, i2, j1, j2)
          for i1 in range(w1), i2 in range(w2)]
          for j1 in range(h1), j2 in range(h2)]

    def controlled_product(v1, v2, i1, i2, j1, j2):
      if v1 == SPECIAL_CONTROL_ONE:
        return SPECIAL_CONTROL_ONE if i2==j2 else 0
      if v2 == SPECIAL_CONTROL_ONE:
        return SPECIAL_CONTROL_ONE if i1==j1 else 0
      return v1*v2

Basically what this code is saying is: when you tile one matrix inside the other, any tiled-inside matrix that gets paired with $\mu$ is replaced with an identity matrix filled with $\mu$s instead of 1s.
In effect, it's saying that $\mu \otimes U = \mu \cdot I$.
For example, $H \otimes \mu = \bimat{\mu}{0}{0}{\mu}$.

Given $\mu$, it's easy to make the matrix for a control.
When the input is off, we want the identity matrix, so we'll scale by $\mu$.
When the input is on, we don't want to change the operation, so we use 1.
Thus:

$C = \bimat{\mu}{0}{0}{1}$

Before I go into the details of what this breaks, let's take a closer look at how $\mu$ behaves.

# Tainted Numbers

A lot of interesting number systems start by introducing some special value with interesting rules related to squaring.

If you introduce a value whose $i$ square is -1, you get the [complex numbers](http://en.wikipedia.org/wiki/Complex_number).
Complex numbers are super useful when dealing with rotating quantities in 2d.
If you instead introduce a value $\epsilon$ whose square is 0, you get the [dual numbers](http://en.wikipedia.org/wiki/Dual_number#Linear_representation).
Dual numbers make numeric differentiation really easy, because $f(x+\epsilon) - f(x) = \epsilon \frac{d}{dx} f(x)$.
Introducing a value whose square is +1 also does interesting things, though I'm not aware of any use for the resulting algebra.

In the case of $\mu$, which we want to stick around when things are multiplied together so that we can tell what was controlled, we're going to define $\mu^2$ to just be $\mu$ again.
This is a value that, once it's been multiplied on, can't be multiplied off.
It taints any value it touches, creating an indelible mark that we can check for later.

There's undoubtedly some standard name for this number system, but I don't know it.
In this post I'll be calling the reals, augmented with $\mu$ such that $\mu^2 = \mu$, the *tainted numbers*.

Let's explore how typical operations behave, when applied to tainted numbers.

Anytime you define a number system, the first order of business is to explore how typical operations behave.
Is multiplication still commutative? Associative? Does division have more can't-divide-by-that corner cases? Do functions like $e^x$ do anything new?

For example, let's figure out what happens when you raise a tainted number $a + b \mu$ to the n'th power.
We'll start by expanding $(a + b \mu)^n$ with the [binomial theorem](http://en.wikipedia.org/wiki/Binomial_theorem):

$= \Sum{i=0}{n} {n \choose i} a^i (b \mu)^{n-i}$

Now pull out the only term that won't get an $\mu$ factor:

$= a^n + \mu \Sum{i=0}{n-1} {n \choose i} a^i b^{n-i}$

And fill in the hole in the sum:

$= a^n + \parens{-a^n + \Sum{i=0}{n} {n \choose i} a^i b^{n-i}} \mu$

So that we can un-apply the binomial theorem, given us our answer:

$(a + b \mu)^n = a^n + \parens{(a+b)^n - a^n} \mu$.

That turned out to simplify really well! (I enjoy this kind of thing far too much.)

Another good function to test is $exp$, the exponential function.
If you haven't done this before, that sounds like a daunting task.
But really all you have to is pick a definition of $e^x$, usually the Taylor series $e^x = \Sum{n=0}{\infty} \frac{x^n}{n!}$ works pretty well, and see what happens when you apply it to $e^{a + \mu b}$.
You'll find that it expands into:

$ = \Sum{n=0}{\infty} \frac{(a + b \mu)^n}{n!}$

We can simplify the numerator of the summands using the raised-to-nth-power equivalence we figured out a second ago:

$ = \Sum{n=0}{\infty} \frac{a^n + \parens{(a+b)^n - a^n} \mu}{n!}$

Now that we have additions inside our infinite sum, we can de-interleave it into three infinite sums.
Note that this doesn't always work (e.g beware conditionally convergent series), but all of our sums converge so we'll probably only get yelled at a little:

$ = \Sum{n=0}{\infty} \frac{a^n}{n!} + \mu \Sum{n=0}{\infty} \frac{(a+b)^n}{n!} - \mu \Sum{n=0}{\infty} \frac{a^n}{n!}$

Each of the sums matches the series definition of $e^x$.
After packing the sums back into $e^x$ form, and acknowledging that we were a bit fast and loose (e.g. we used $\mu^0$ despite it having the same issues that $0^0$ has), we get a nice solution:

$e^{a + b \mu} = e^a + \parens{e^{a+b} - e^a} \mu$.

Notice that both exponentiating and raising to a power were affected in similar ways when generalized to work on tainted numbers.
In both cases we found that $f(a + b \mu) = f(a) + \parens{f(b) - f(a)} \mu$.
That's not a coincidence.

Consider the matrices $I = \bimat{1}{0}{0}{1}$ and $M = \bimat{0}{0}{0}{1}$.
Note that $I \cdot M = M$ and that $M \cdot M = M$.
The matrices $I$ and $M$ act like the values 1 and $\mu$!
This means we can use $I$ and $M$, and linear combinations thereof, to *represent* tainted numbers (e.g. $a + \mu b$ becomes $\bimat{a}{0}{0}{a+b}$).
The representation will then allow us to translate facts about matrices into facts about tainted numbers, and we can use this to explain things like functions generalizing in the same way.

The eigenvalues of the matrix $\bimat{a}{0}{0}{a+b}$ are just $a$ and $a+b$.
A good rule of thumb for applying functions to a matrix is to [decompose the matrix into its eigenvalue/vector parts](http://en.wikipedia.org/wiki/Eigendecomposition_of_a_matrix), transform the eigenvalues with the function in question, then put the matrix back together.
(I think it works as long as the function is [analytic](http://en.wikipedia.org/wiki/Analytic_function)?)
That's why $f(a + \mu b)$ ends up being in terms of $f(a)$ and $f(a+b)$: because $a$ and $a+b$ are the eigenvalues being transformed.
Then, recovering the $\mu$ part, the new $b$, requires subtracting off the added-on $a$ part.
Thus the $f(a + \mu b) = f(a) + \mu (f(a+b) - f(a))$ pattern.

(You can use the same represent-the-values-as-a-matrix trick [for complex numbers](http://en.wikipedia.org/wiki/Complex_number#Matrix_representation_of_complex_numbers), [for dual numbers](en.wikipedia.org/wiki/Dual_number#Linear_representation), and for lots of other algebras.
Unfortunately I don't know the term for this general technique.
I thought it was called "representing X as a matrix algebra", but there's no Wikipedia article for "matrix algebra".)

Anyways, that ends the tangent into abstract algebra. Let's get back to operations on circuits.

# Merging Operations

Now that we can multiply and add tainted numbers, we put them in matrices and run those matrices through typical matrix operations.

For example, it's always possible to combine non-control gates that affect the same wire into one mega-gate whose matrix is the product of the combined gates' matrices.
Can we do that with controls?

Then I set the matrix of the control "operation" to $\bimat{\mu}{0}{0}{1}$.

So when I computed the tensor product I'd get

$\bimat{\mu}{0}{0}{1} \otimes \bimat{x}{y}{z}{t} =
\bimat
{c \bimat{x}{y}{z}{t}} {0 \bimat{x}{y}{z}{t}}
{0 \bimat{x}{y}{z}{t}} {1 \bimat{x}{y}{z}{t}}
= \begin{bmatrix}
1 & 0 & 0 & 0 \\\\
0 & 1 & 0 & 0 \\\\
0 & 0 & x & y \\\\
0 & 0 & z & t
\end{bmatrix}$ which is in fact the matrix for a controlled operation.

Eventually I wondered if I could use $c$ a bit more freely.
For example, in the circuit:

    ──H─•─H──
        │
    ────X────

$H = \frac{1}{\sqrt{2}} \bimat{1}{1}{1}{-1}$

$X = \bimat{0}{1}{1}{0}$

Could I mix some of the Hadamard operations into the controlled operation by propagating the $c$s?

$\frac{1}{\sqrt{2}} \bimat{1}{1}{1}{-1} \cdot \bimat{\mu}{0}{0}{1} \cdot \frac{1}{\sqrt{2}} \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{\mu}{1}{\mu}{-1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}$

Then tensor product that into X:

$\frac{1}{2} \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1} \otimes \bimat{0}{1}{1}{0}$

$= \frac{1}{2} \bimat
{(\mu+1) \otimes \bimat{0}{1}{1}{0}} {(\mu-1) \otimes \bimat{0}{1}{1}{0}}
{(\mu-1) \otimes \bimat{0}{1}{1}{0}} {(\mu+1) \otimes \bimat{0}{1}{1}{0}}$

$= \frac{1}{2} \bimat{I + X}{I - X}{I - X}{I + X}$

$= \frac{1}{2} \begin{bmatrix}
1 & 1 & 1 & -1 \\\\
1 & 1 & -1 & 1 \\\\
1 & -1 & 1 & 1 \\\\
-1 & 1 & 1 & 1 \end{bmatrix}$

Hey, that's the right answer!

In effect, $(C \otimes U) \cdot (V \otimes I) = (C \cdot V) \otimes U$.
We can replace one of the 4x4 matrix multiplications with a 2x2 matrix multiplication, while also eliding a tensor product.
It also works when $V$ is pre-tensor-multiplied instead of post.

This means we can combine a basis change with the control.

We can also combine multiple controls together.
For example

    ──•──
      │
    ──•──
      │
    ──X──


Is

$\bimat{\mu}{0}{0}{1} \otimes \bimat{\mu}{0}{0}{1} \otimes \bimat{0}{1}{1}{0}$

$= \bimat
{\mu \otimes \bimat{\mu}{0}{0}{1}} {0 \otimes \bimat{\mu}{0}{0}{1}}
{0 \otimes \bimat{\mu}{0}{0}{1}} {1 \otimes \bimat{\mu}{0}{0}{1}}
\otimes \bimat{0}{1}{1}{0}$

$= \begin{bmatrix}
\mu & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 \\\\
0 & 0 & \mu & 0 \\\\
0 & 0 & 0 & 1
\end{bmatrix} \otimes \bimat{0}{1}{1}{0}$

$= \begin{bmatrix}
\mu X & 0 & 0 & 0 \\\\
0 & \mu X & 0 & 0 \\\\
0 & 0 & \mu X & 0 \\\\
0 & 0 & 0 & 1 X
\end{bmatrix}$

$= \begin{bmatrix}
\mu & 0 & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & \mu & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & \mu & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & \mu & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & \mu & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 \\\\
0 & 0 & 0 & 0 & 0 & 0 & 1 & 0 \\\\
\end{bmatrix}$

Which is the correct matrix for the Toffoli gate.

# Does it break when combining?

Controls break some of the rules of tensor products.
For example, it is no longer the case that $(X \otimes Y) \cdot (Z \otimes T) = (X \cdot Z) \otimes (Y \cdot T)$.
If $X$ has $c$s in it, then you can't break it out of the $X \otimes Y$.
Also, moving $T$ into the $Y$ can cause the $T$ to come under control.
So you have to "clean out" the controls.

So although we can represent a lot more things as matrices now, the way those matrices can be combined is much more restrictive.
Which might cause problems and inefficiencies.

# Increment

A simple in-place increment-by-1 circuit is the following:

    ──•─•─X──
      │ │
    ──•─X────
      │
    ──X──────

Here's the question: is it possible to mix all of these operations into one?

Define $C\_n = \mu I_n + \ket{n} \bra{n} (1 - \mu)$.

Well, the second two can definitely be combined.
We know that $(C \otimes X) \cdot (X \otimes I) = (C \cdot X) \otimes X$.

$(C \cdot X) \otimes X$

$= \bimat{0}{\mu}{1}{0} \otimes X$

$= \bimat
{0 \otimes X}{c \otimes X}
{1 \otimes X}{0 \otimes X}$

$= \bimat{0}{\mu}{1}{0} \otimes \bimat{0}{1}{1}{0}$

$= \bimat
{\bimat{0}{\mu}{1}{0} \otimes 0} {\bimat{0}{\mu}{1}{0} \otimes 1}
{\bimat{0}{\mu}{1}{0} \otimes 1} {\bimat{0}{\mu}{1}{0} \otimes 0}$

$= \begin{bmatrix}
0 & \mu & 0 & 0 \\\\
0 & 0 & 1 & 0 \\\\
0 & 0 & 0 & \mu \\\\
1 & 0 & 0 & 0
\end{bmatrix}$


If we apply the trick a second time, we get

$(C \otimes C \otimes X) \cdot (C \otimes X \otimes I) \cdot (X \otimes I \otimes I)$

$= ((C \otimes C) \otimes X) \cdot ((C \cdot X) \otimes X \otimes I)$.

$= (((C \otimes C) \cdot ((C \cdot X) \otimes X)) \otimes X$

Is that the right answer?
Let's calculate.

$(((C \otimes C) \cdot ((C \cdot X) \otimes X)) \otimes X$

$= (C_4 \cdot Inc(2)) \otimes X$

$= (C_4 \cdot \begin{bmatrix}
0 & c & 0 & 0 \\\\
0 & 0 & 1 & 0 \\\\
0 & 0 & 0 & c \\\\
1 & 0 & 0 & 0
\end{bmatrix}) \otimes X$

$= (\begin{bmatrix}
0 & c & 0 & 0 \\\\
0 & 0 & c & 0 \\\\
0 & 0 & 0 & c \\\\
1 & 0 & 0 & 0
\end{bmatrix}) \otimes X$

$= \begin{bmatrix}
0 & \mu & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & \mu & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & \mu & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & 1 & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & \mu & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & 0 & \mu & 0 \\\\
0 & 0 & 0 & 0 & 0 & 0 & 0 & \mu \\\\
1 & 0 & 0 & 0 & 0 & 0 & 0 & 0
\end{bmatrix}$

$\rightarrow Inc(3)$

You can kind of see how the magic is working.
You take the increment gate for (n-1) bits, scale every row except the last by $c$, the tensor an X on.
Each $c$ turns into an $I$, keeping that clean diagonal, and the hole in the middle is filled in by the bottom row becoming an X.

Or more generally you can define

$Inc(n) = \Pi\_{i=1}^{n} C^{\otimes n-i} \otimes X \otimes I^{\otimes i-1}$

with

$Inc(1) = X$

$Inc(n) = (C^{\otimes n-1} \cdot Inc(n-1)) \otimes X$

So if you're computing the overall matrix of the simple increment circuit, you don't need to do $n-1$ matrix multiplications of size $2^n$ x $2^n$.
You can instead do one 2x2, one 4x4, one 8x8, and so forth until you get to $2^n$ x $2^n$, for a runtime speedup factor of $n$.
This would get trounced by anything specialized to notice the increment circuit and just re-index the amplitudes, but our optimization applies anytime there are operations with large numbers of controls.

# Summary

By introducing a special value with special tensor product semantics, the concept of "use this wire as a control" can be given a matrix (as if it was a typical gate).
