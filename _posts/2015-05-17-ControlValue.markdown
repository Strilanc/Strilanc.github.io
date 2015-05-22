---
layout: post
title: "Impractical Experiments #3: Treating Controls Like Values"
date: 2015-05-17 11:30:00 EST
categories: impractical-experiments
---

Every operation on a circuit, whether the circuit is classical, probabilistic, or quantum, can be represented as a matrix.

Representing operations as matrices makes it easy to compile the overall effect of a circuit into a single operation: just multiply the matrices together. It also makes it straightforward to combine operations that apply to different wires, with the [Kronecker product](http://en.wikipedia.org/wiki/Kronecker_product) $\otimes$.

In case you're not familiar with the Kronecker product, it's basically like tiling one matrix inside of another and scaling the tiles by the original matrix' entries (it's almost identical to the [tensor product](http://en.wikipedia.org/wiki/Tensor_product)). For example, if you want to apply a Hadamard gate $H$ to one wire and a Not gate $X$ to the other wire, like this:

    ──H──
    ──X──

Then the overall matrix is computed like this:

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

The need to put the low bit operation second is unfortunate, but we already

When the other wire doesn't have an operation, you use the Identity operation to represent the no-op. This expands the single-wire operation to apply to the larger circuit's larger state vector.

# The Control Matrix

Controlled operations, i.e. operations conditioned to only occur if a designated control wire is On, look a little bit like operations applied to separate wires. For example, when I look at the following diagram a part of me wants to ask "What's the matrix for that • operation?":

    ──•──
    ──X──

In fact there is no matrix for •, because controls aren't operations. Instead, controls are *operation modifiers*. Trying to compute the matrix for a controlled operation by evaluating $X \otimes $• is simply a type error. It's *not even wrong*.

... But what if we tweaked the rules of arithmetic a bit, so that there *was* a matrix for the "• gate"? When I wrote my quantum circuit simulator, that's what I did.

The trick I used was to introduce a special value, which I'll call $\mu$ in this post.
In the code, $\mu$ was just an instance of the `Complex` class with real part 1 and complex part 0.
As a result, it acted like 1 everywhere... except in the code for the Kronecker product which explicitly checked for it using reference equality:

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

Basically what the above code is saying is: when you tile one matrix inside the other, any tiled-inside matrix that gets paired with $\mu$ is replaced with a matrix with $\mu$s along its diagonal.
In other words, $\mu \otimes U$ differs from $\mu \cdot U$ because $\mu \otimes U = \mu \cdot I$.
For example, $H \otimes \mu = \bimat{\mu}{0}{0}{\mu}$.

Given $\mu$, it's easy to make a "control gate".
When the input is off we want operations to be replaced by the identity matrix, so we'll kronecker-scale by $\mu$.
When the input is on, we want operations to apply, so we'll kronecker-scale by 1.
Thus we define the control gate's matrix to be:

$C = \bimat{\mu}{0}{0}{1}$

Introducing $\mu$ and $C$ is a useful hack, because the tweaks to the tensor product are small compared to having to add logic for noticing and generating controlled operations. But that's just the start of the story.

# Tainted Numbers

I want to do more things with this $\mu$ value. I want to add it, multiply it, square it, you name it. Maybe it has more tricks up its sleeves.

A lot of interesting number systems start by introducing some special value with interesting rules related to squaring.
If you introduce a value $i$ whose square is -1, you get the [complex numbers](http://en.wikipedia.org/wiki/Complex_number).
Complex numbers are super useful when dealing with rotating quantities in 2d.
If you instead introduce a value $\epsilon$ whose square is 0, you get the [dual numbers](http://en.wikipedia.org/wiki/Dual_number#Linear_representation).
Dual numbers make numeric differentiation really easy, because $f(x+\epsilon) - f(x) = \epsilon \frac{d}{dx} f(x)$.
Introduce a value $j$ whose square is +1 and you'll get the [split-complex numbers](http://en.wikipedia.org/wiki/Split-complex_number).

In the case of $\mu$, I think the semantics we want are "sticking around".
We don't want to lose $\mu$ when things are multiplied together, so that afterwards we can tell what was controlled and what wasn't.
With that in mind, we'll define $\mu^2$ to just be $\mu$ again.
This means that $\mu$ is a value that, once it's been multiplied on, can't be multiplied off.
It taints any value it touches, creating an indelible mark that we can check for later.

I don't know of any standard name for the number system created by adding a $\mu$ such that $\mu^2 = \mu$. The lack of name probably has to do with the fact that it's a basis change away from being [isomorphic to the split-complex numbers](http://math.stackexchange.com/a/1293724/3820). Regardless, in this post I'll be calling $\mu$-ified numbers *tainted numbers*.

Anytime you define a number system, the first order of business is to explore how typical operations behave.
Is multiplication still commutative?
Associative?
Does division have more can't-divide-by-that corner cases?
Do functions like $e^x$ do anything new?

For example, let's figure out what happens when you raise a tainted number $a + b \mu$ to the $n$'th power.

Start by expanding $(a + b \mu)^n$ with the [binomial theorem](http://en.wikipedia.org/wiki/Binomial_theorem):

$= \Sum{i=0}{n} {n \choose i} a^i (b \mu)^{n-i}$

Now pull out the only term that won't get a $\mu$ factor:

$= a^n + \mu \Sum{i=0}{n-1} {n \choose i} a^i b^{n-i}$

And fill in the hole in the sum:

$= a^n + \parens{-a^n + \Sum{i=0}{n} {n \choose i} a^i b^{n-i}} \mu$

So that we can un-apply the binomial theorem, given us our answer:

$(a + b \mu)^n = a^n + (a+b)^n \mu - a^n \mu$.

That turned out to simplify really well! (I enjoy this kind of thing far too much.)

Another good operation to test is the exponential function.
The way to do that is to pick a definition of $e^x$, usually the Taylor series $e^x = \Sum{n=0}{\infty} \frac{x^n}{n!}$ works pretty well, and see what happens when you apply it to $e^{a + \mu b}$.
This is the same thing Euler did to show that $e^{\pi i} = -1$.
Unfortunately we won't come anywhere near that level of awe-inspiring surprise.
You'll find that $e^{a + \mu b}$ expands into:

$ = \Sum{n=0}{\infty} \frac{(a + b \mu)^n}{n!}$

We can simplify the numerator of the summands using the raised-to-nth-power equivalence we figured out a second ago:

$ = \Sum{n=0}{\infty} \frac{a^n + \parens{(a+b)^n - a^n} \mu}{n!}$

Now that we have additions inside our infinite sum, we can de-interleave it into three infinite sums.
Note that this isn't always a safe step (beware conditionally convergent series), but all of our sums converge absolutely so we'll probably only get yelled at a little:

$ = \Sum{n=0}{\infty} \frac{a^n}{n!} + \mu \Sum{n=0}{\infty} \frac{(a+b)^n}{n!} - \mu \Sum{n=0}{\infty} \frac{a^n}{n!}$

Each of the sums matches the series definition of $e^x$.
After packing the sums back into $e^x$ form, and apologizing for playing it a bit fast and loose (e.g. we used $\mu^0$ despite it having the same issues that $0^0$ has), we get a nice solution:

$e^{a + b \mu} = e^a + \parens{e^{a+b} - e^a} \mu$.

Notice that both exponentiating and raising to a power were affected in similar ways when generalized to work on tainted numbers.
In both cases we found that $f(a + b \mu) = f(a) + \parens{f(b) - f(a)} \mu$.
That's not a coincidence.

Consider the matrices $I = \bimat{1}{0}{0}{1}$ and $M = \bimat{0}{0}{0}{1}$.
Note that $I \cdot M = M$ and that $M \cdot M = M$, just like how $1 \cdot \mu = \mu$ and $\mu \cdot \mu = \mu$.
Addition, scaling, and multiplication of $I$ and $M$ also behave isomorphically to how they do for $1$ and $\mu$.
This means we can use $I$ and $M$, and linear combinations thereof, to *represent* tainted numbers!
We can translate the number $a + \mu b$ into the matrix $\bimat{a}{0}{0}{a+b}$, then translate facts about that kind of matrix back into facts about tainted numbers.
For example, we can explain why functions are generalizing in the same way.

(You can use the same represent-the-values-as-a-matrix trick [for complex numbers](http://en.wikipedia.org/wiki/Complex_number#Matrix_representation_of_complex_numbers), [for dual numbers](en.wikipedia.org/wiki/Dual_number#Linear_representation), for [combinations thereof](http://en.wikipedia.org/wiki/Hypercomplex_number), and for lots of other algebras.
Unfortunately I don't know the term for this general technique.
I thought it was called "representing X as a matrix algebra", but there's no Wikipedia article for "matrix algebra".)

The eigenvalues of the matrix $\bimat{a}{0}{0}{a+b}$ are just $a$ and $a+b$.
A good rule of thumb for applying functions to a matrix is to [decompose the matrix into its eigenvalue/vector parts](http://en.wikipedia.org/wiki/Eigendecomposition_of_a_matrix), transform the eigenvalues with the function in question, then put the matrix back together.
(I think it works as long as the function is [analytic](http://en.wikipedia.org/wiki/Analytic_function)?)
That's why $f(a + \mu b)$ ends up being in terms of $f(a)$ and $f(a+b)$: because $a$ and $a+b$ are the eigenvalues being transformed.
Then, recovering the $\mu$ part, the new $b$, requires subtracting off the added-on $a$ part.
Thus the $f(a + \mu b) = f(a) + \mu (f(a+b) - f(a))$ pattern.

Anyways, that ends the tangent into basic abstract algebra. Let's get back to operations on circuits.

# Merging Operations Into Controls

When we have a circuit like this:

    ──H─X─H──
        │
    ──H─•─H──

We definitely can't merge the top Hs into the X. That would cause the Hs to also be controlled, changing the behavior of the circuit. But what if we tried to multiply the *bottom* Hs into the *control*? Then we would get:

$H \cdot C \cdot H$

$= \frac{1}{2} \bimat{1}{1}{1}{-1} \cdot \bimat{\mu}{0}{0}{1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{1 \cdot \mu + 1 \cdot 0}{1 \cdot 0 + 1 \cdot 1}{1 \cdot \mu - 1 \cdot 0}{1 \cdot 0 - 1 \cdot 1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{\mu}{1}{\mu}{-1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}$

Now we want to pretend this matrix is some weird control that we're applying to X:

    ──H─X─H──
        │
    ────?────

So we use the kronecker product:

$X \otimes (H \cdot C \cdot H)$

$= \frac{1}{\sqrt{2}} \bimat{0 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}{1 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}{1 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}{0 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}$

Flattening the above expression into a single matrix is a bit tricky. The $\mu$ are on the right, so the diagonal we should put $\mu$s on is bit harder to see. Basically, any $\mu$s in the top-left and bottom-right sections stay $\mu$s while $\mu$s in the top-right and bottom-left get replaced with 0s. It's also a bit confusing that the $1$s being added/subtracted from the $\mu$s follow the normal kronecker product rules, instead of the follow-the-diagonal rule. But carefully put it all together and you'll find:

$= \frac{1}{2} \begin{bmatrix}
\mu & \mu & 1 & -1 \\\\
\mu & \mu & -1 & 1 \\\\
1 & -1 & \mu & \mu \\\\
-1 & 1 & \mu & \mu
\end{bmatrix}$

We don't need to keep track of what's controlling what anymore, so we can clean up the $\mu$s by applying the function $f(a + b \mu) = a + b$:

$\rightarrow \frac{1}{2} \begin{bmatrix}
1 & 1 & 1 & -1 \\\\
1 & 1 & -1 & 1 \\\\
1 & -1 & 1 & 1 \\\\
-1 & 1 & 1 & 1
\end{bmatrix}$

We're almost done! Our circuit looks like this:

        ┌─┐
    ──H─┤?├─H──
        │?│
    ────┤?├────
        └─┘

We just need to multiply in those last two Hadamard gates, to get the matrix for the whole circuit:

$(H \otimes H) \cdot (X \otimes C) \cdot (H \otimes H)$

$= (H \otimes I) \cdot (X \otimes (H \cdot C \cdot H)) \cdot (H \otimes I)$

$= \frac{1}{\sqrt{2}} \begin{bmatrix}
1 & 0 & 1 & 0 \\\\
0 & 1 & 0 & 1 \\\\
1 & 0 & -1 & 0 \\\\
0 & 1 & 0 & -1
\end{bmatrix} \cdot \frac{1}{2} \begin{bmatrix}
1 & 1 & 1 & -1 \\\\
1 & 1 & -1 & 1 \\\\
1 & -1 & 1 & 1 \\\\
-1 & 1 & 1 & 1
\end{bmatrix} \cdot \frac{1}{\sqrt{2}} \begin{bmatrix}
1 & 0 & 1 & 0 \\\\
0 & 1 & 0 & 1 \\\\
1 & 0 & -1 & 0 \\\\
0 & 1 & 0 & -1
\end{bmatrix}$

Which [is equal to...](http://www.wolframalpha.com/input/?i=\{\{1,0,1,0\},\{0,1,0,1\},\{1,0,-1,0\},\{0,1,0,-1\}\} . \{\{1,1,1,-1\},\{1,1,-1,1\},\{1,-1,1,1\},\{-1,1,1,1\}\} . \{\{1,0,1,0\},\{0,1,0,1\},\{1,0,-1,0\},\{0,1,0,-1\}\})

$= \begin{bmatrix}
1 & 0 & 0 & 0 \\\\
0 & 1 & 0 & 0 \\\\
0 & 0 & 0 & 1 \\\\
0 & 0 & 1 & 0
\end{bmatrix}$

Which is this circuit:

    ──•──
      │
    ──X──


Which means... surrounding a controlled-not with Hadamards on all sides swaps the wires that the control and the not are on. Neat! This is actually a well known trick, but the fact that we computed it correctly indicates that merging operations into controls is safe. We have not-rigorously-at-all shown that $(C \otimes U) \cdot (V \otimes I) = (C \cdot V) \otimes U$ (and this holds when you reverse all the $\otimes$ terms and/or all the $\cdot$ terms).

Intuitively, merging operations into the controls can be thought of as modifying the controls to apply in a *different basis*. For example, merging in a Hadamard operation on each side causes the control to apply in the X observable's basis (instead of the computational basis, i.e. the Z observable's basis).

# Multiple Controls

Does combining controls with other controls work? Let's try it.

The Toffoli gate is a doubly-controlled not:

    ──X──
      │
    ──•──
      │
    ──•──

We can start by computing $C \otimes C$, alternatively stated as $C^{\otimes 2}$:

$C^{\otimes 2}$

= $\bimat{\mu \otimes \bimat{\mu}{0}{0}{1}}{0 \otimes \bimat{\mu}{0}{0}{1}}{0 \otimes \bimat{\mu}{0}{0}{1}}{1 \otimes \bimat{\mu}{0}{0}{1}}$

= $\begin{bmatrix}
\mu & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 \\\\
0 & 0 & \mu & 0 \\\\
0 & 0 & 0 & 1
\end{bmatrix}$

This pattern, where the entire diagonal is made of $\mu$s except for the bottom-right value being a 1, continues for all kronecker powers $C^{\otimes n}$. The resulting matrix can be stated succinctly via bra-ket notation: $C^{\otimes n} = \mu I_{2^n} + (1 - \mu) \ket{2^n-1} \bra{2^n-1}$.

Getting back to that Toffoli gate:

$C^{\otimes 2} \otimes X$

$= \begin{bmatrix}
\mu & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 \\\\
0 & 0 & \mu & 0 \\\\
0 & 0 & 0 & 1
\end{bmatrix} \otimes X$

$= \begin{bmatrix}
\mu \otimes X & 0 & 0 & 0 \\\\
0 & \mu \otimes X & 0 & 0 \\\\
0 & 0 & \mu \otimes X & 0 \\\\
0 & 0 & 0 & 1 \otimes X
\end{bmatrix}$

$= \begin{bmatrix}
\mu & 0 & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & \mu & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & \mu & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & \mu & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & \mu & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 \\\\
0 & 0 & 0 & 0 & 0 & 0 & 1 & 0
\end{bmatrix}$

Which is the correct matrix for the Toffoli gate (or, it is after applying $f(a + \mu b) = a + b$ anyways).

# Merging Multiple Operations into Multiple Controls Multiple Times

Given that we can have several controls, can we merge operations into those several controls?

A good example where that might be beneficial is *incrementing*. The simplest increment circuits look like this:

    ──•─•─X──
      │ │
    ──•─X────
      │
    ──X──────

Pretty straightforward pattern. Just keep adding slightly larger controlled nots in front.

Here's the question: is it possible to mix all of these operations into one? Can we simplify $(I \otimes I \otimes X) \cdot (I \otimes X \otimes C) \cdot (X \otimes C \otimes C)$ to use smaller multiplications?

To start with, $(I \otimes I \otimes X) \cdot (I \otimes X \otimes C) = I \otimes ((I \otimes X) \cdot (X \otimes C))$. We also know that $(I \otimes X) \cdot (X \otimes C) = X \otimes (X \cdot C)$ from our basis changing of controls identity.

$(I \otimes X) \cdot (X \otimes C)$

from basis change:

$= X \otimes (X \cdot C)$

$= X \otimes \bimat{0}{1}{\mu}{0}$

$= \bimat
{0 \otimes \bimat{0}{1}{\mu}{0}}{1 \otimes \bimat{0}{1}{\mu}{0}}
{1 \otimes \bimat{0}{1}{\mu}{0}}{0 \otimes \bimat{0}{1}{\mu}{0}}$

$= \begin{bmatrix}
0 & 0 & 0 & 1 \\\\
\mu & 0 & 0 & 0 \\\\
0 & 1 & 0 & 0 \\\\
0 & 0 & \mu & 0
\end{bmatrix}$

That's the increment matrix for 2 bits. Now we have to go back:

$(I \otimes I \otimes X) \cdot (I \otimes X \otimes C) \cdot (X \otimes C \otimes C)$

$= (I \otimes ((I \otimes X) \cdot (X \otimes C))) \cdot (X \otimes C^{\otimes 2})$

$= X \otimes (((I \otimes X) \cdot (X \otimes C))) \cdot C^{\otimes 2})$

$= X \otimes ((X \otimes (X \cdot C)) \cdot C^{\otimes 2})$

$= X \otimes \parens{\begin{bmatrix}
0 & 0 & 0 & 1 \\\\
\mu & 0 & 0 & 0 \\\\
0 & 1 & 0 & 0 \\\\
0 & 0 & \mu & 0
\end{bmatrix} \cdot C^{\otimes 2}}$

$= X \otimes \begin{bmatrix}
0 & 0 & 0 & 1 \\\\
\mu & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 \\\\
0 & 0 & \mu & 0
\end{bmatrix}$

$= \begin{bmatrix}
0 & 0 & 0 & 0 & 0 & 0 & 0 & 1 \\\\
\mu & 0 & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & \mu & 0 & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & 1 & 0 & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & \mu & 0 & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & \mu & 0 & 0 \\\\
0 & 0 & 0 & 0 & 0 & 0 & \mu & 0
\end{bmatrix}$

And that's correct!

You can kind of see how the magic is working.
You take the increment gate for (n-1) bits, scale every row except the last by $c$, the tensor an X on.
Each $c$ turns into an $I$, keeping that clean diagonal, and the hole in the middle is filled in by the bottom row becoming an X.

Notice that at the intermediate stage we had $X \otimes ((X \otimes (X \cdot C)) \cdot C^{\otimes 2})$. More generally, we started with

$Inc(n) = \Pi\_{i=1}^{n} \parens{I^{\otimes i-1} \otimes X \otimes C^{\otimes n-i}}$

and turned it into

$Inc(1) = X$

$Inc(n) = X \otimes (Inc(n-1) \cdot C^{\otimes n-1})$

So if you're computing the overall matrix of the simple increment circuit, you don't need to do $n-1$ matrix multiplications of size $2^n$ x $2^n$.
You can instead do one 2x2, one 4x4, one 8x8, and so forth until you get to $2^n$ x $2^n$, for a runtime speedup factor of $n$.
This would get trounced by anything specialized to notice the increment circuit and just re-index the amplitudes, but our optimization applies anytime there are operations with large numbers of controls.

# Impractical

So, I had fun working out all these facts about $\mu$ and $C$. But, ultimately, I have to admit they're not very useful.

Highly controlled operations are already very cheap to apply.

We've broken a bunch of nice rules about how the kronecker product interacts with matrix multiplication.

Controls break some of the rules of tensor products.
For example, it is no longer the case that $(X \otimes Y) \cdot (Z \otimes T) = (X \cdot Z) \otimes (Y \cdot T)$.
If $X$ has $c$s in it, then you can't break it out of the $X \otimes Y$.
Also, moving $T$ into the $Y$ can cause the $T$ to come under control.
So you have to "clean out" the controls.

So although we can represent a lot more things as matrices now, the way those matrices can be combined is much more restrictive.
Which might cause problems and inefficiencies.

# Summary

By introducing a special value with special tensor product semantics, the concept of "use this wire as a control" can be given a matrix (as if it was a typical gate).

