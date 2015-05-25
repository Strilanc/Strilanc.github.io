---
layout: post
title: "Impractical Experiments #3: Treating Controls Like Values"
date: 2015-05-17 11:30:00 EST
categories: impractical-experiments
---

Every operation on a circuit, whether the circuit is classical, probabilistic, or quantum, can be represented as a matrix.

Representing operations as matrices makes it easy to compile the overall effect of a circuit into a single operation: just multiply the matrices together.
It also makes it straightforward to combine operations that apply to different wires: just use the [Kronecker product](http://en.wikipedia.org/wiki/Kronecker_product).

Intuitively, the Kronecker product $A \otimes B$ works by tiling $B$ inside of $A$, then scaling each tile by the coefficient it was paired with.
For example, suppose you want to apply a [Hadamard gate](http://en.wikipedia.org/wiki/Quantum_gate#Hadamard_gate) $H$ to one wire and a [NOT gate](http://en.wikipedia.org/wiki/Quantum_gate#Pauli-X_gate) $X$ to the other wire, like this:

    ──H──
    ──X──

The circuit's overall matrix is computed like this:

$H = \frac{1}{\sqrt{2}} \bimat{1}{1}{1}{-1}$

$X = \bimat{0}{1}{1}{0}$

$X \otimes H
= \frac{1}{\sqrt{2}} \bimat{0 \otimes H}{1 \otimes H}{1 \otimes H}{0 \otimes H}
= \frac{1}{\sqrt{2}} \bimat{0\_2}{H}{H}{0\_2}
= \frac{1}{\sqrt{2}} \begin{bmatrix}
0 & 0 & 1 & 1 \\\\
0 & 0 & 1 & -1 \\\\
1 & 1 & 0 & 0 \\\\
1 & -1 & 0 & 0
\end{bmatrix}$.

When the other wire doesn't have an operation, you kronecker-product against an identity matrix (a no-op) instead.
This expands the operation's matrix so it can be applied to larger circuits' larger state vector, without affecting the state of the other wires.

Another way to make an operation apply to more wires is control it.

# The Control Matrix

Controlled operations are operations conditioned to only occur if a designated control wire is ON.
In diagrams the control wire is indicated by covering it with a small black circle, and a connecting line.

Sometimes, when making minimalist circuit diagrams, I omit the connecting line.
A side effect of this is that the control looks a little bit like an independent operation:

    ──•──
    ──X──

When I look at the above diagram, my first uninformed instinct is "What's the matrix for that weird • operation?".

Of course there is no matrix for •, because controls aren't operations. Controls are *operation modifiers*.
Trying to compute the matrix for a controlled operation by evaluating $X \otimes $• is simply a type error.
It's *not even wrong*.

... *But* ...

What if we tweaked the rules of arithmetic a bit, so that there *was* a matrix for this so-called "• gate"?
When I wrote my quantum circuit simulator, that's exactly what I did.

The hack I used was to introduce a special value, which I'll call $\mu$ in this post.
In the code, $\mu$ was just an instance of the `Complex` class.
It had real part 1, and complex part 0, so it would act just like a normal 1 everywhere. That is, except in the code for the Kronecker product which explicitly special cased it:

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
In other words, $\mu \otimes U$ has been defined (unusually) to be different from $\mu \cdot U$.
Instead of $\mu \otimes U = \mu \cdot U$, we have $\mu \otimes U = \mu \cdot I$.
For example, $H \otimes \mu = \bimat{\mu}{0}{0}{\mu}$.

Given this new $\mu$ value, it's easy to make a "• gate".
When the input wire is OFF we want operations to be replaced by the identity matrix, so we'll kronecker-scale by $\mu$.
When the input wire is ON, we want operations to apply, so we'll kronecker-scale by 1.
Thus we define the control gate's matrix to be:

$C = \bimat{\mu}{0}{0}{1}$

Introducing $\mu$ and $C$ is a useful hack, because the tweaks to the tensor product are small compared to having to add logic for noticing and generating controlled operations.
Maybe $\mu$ is good for other things, too?

# Tainted Numbers

I want to do more things with this $\mu$ value.
I want to add it, multiply it, square it, you name it.
Maybe it has more tricks up its sleeves.

A lot of interesting number systems start by introducing some new value, with special rules related to squaring.
If you introduce a value $i$ whose square is -1, you get the [complex numbers](http://en.wikipedia.org/wiki/Complex_number).
Complex numbers are super useful when dealing with rotating quantities in 2d.
If you instead introduce a value $\epsilon$ whose square is 0, you get the [dual numbers](http://en.wikipedia.org/wiki/Dual_number#Linear_representation).
Dual numbers make numeric differentiation really easy, because $f(x+\epsilon) - f(x) = \epsilon \frac{d}{dx} f(x)$.
Introduce a value $j$ whose square is +1 and you'll get the [split-complex numbers](http://en.wikipedia.org/wiki/Split-complex_number).
Split-complex numbers behave like [time and space in special relativity](http://mathematics-abound.blogspot.com/2012/10/calculus-on-split-complex-plane.html).

So squaring seems like a good place to go when defining behavior.
In the case of $\mu$, I think the semantics we want are "sticking around".
We want to use $\mu$ as a marker, something that sticks around when things are multiplied together so we can later tell what was controlled and what wasn't.
With that in mind, we'll define $\mu^2$ to just be $\mu$ again.

I don't know of any standard name for the number system created by adding a $\mu$ such that $\mu^2 = \mu$.
The lack of name probably has to do with the fact that it's a basis change away from being [isomorphic to the split-complex numbers](http://math.stackexchange.com/a/1293724/3820).
Regardless, in this post I'll be calling $\mu$-ified numbers *tainted numbers* (because $\mu$ taints values in a way that can't be removed).

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

That turned out to simplify really well!
(I enjoy this kind of thing far too much.)

Another good operation to test is the exponential function.
The way to do that is to pick a definition of $e^x$, usually the Taylor series definition $e^x = \Sum{n=0}{\infty} \frac{x^n}{n!}$ works pretty well, and see what happens when you apply that definition to $e^{a + \mu b}$.
This is the same thing Euler did to show that $e^{\pi i} = -1$.
Unfortunately we won't come anywhere near that level of awe-inspiring surprise.
$e^{a + \mu b}$ expands into:

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

Anyways, that ends the tangent into basic abstract algebra.
Let's get back to operations on circuits.

# Merging Operations Into Controls

When we have a circuit like this:

    ──H─X─H──
        │
    ──H─•─H──

We definitely can't merge the Hadamard gates on the top wire into the NOT gate.
That would cause the Hadamards to also be controlled by the bottom wire, changing the behavior of the circuit.
But what if we tried to multiply the *bottom* Hadamards into the *control*? Then we would get:

$H \cdot C \cdot H$

$= \frac{1}{2} \bimat{1}{1}{1}{-1} \cdot \bimat{\mu}{0}{0}{1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{1 \cdot \mu + 1 \cdot 0}{1 \cdot 0 + 1 \cdot 1}{1 \cdot \mu - 1 \cdot 0}{1 \cdot 0 - 1 \cdot 1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{\mu}{1}{\mu}{-1} \cdot \bimat{1}{1}{1}{-1}$

$= \frac{1}{2} \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}$

Okay, so we get a "weird control" that has tainted numbers for all of its entries.
What happens if we combine that weird control with X, using the kronecker product with $\mu$ special-cased?

$X \otimes (H \cdot C \cdot H)$

Let's start by tiling our known solution inside of the $X$ gate's matrix:

$= \frac{1}{\sqrt{2}} \bimat{0 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}{1 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}{1 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}{0 \otimes \bimat{\mu+1}{\mu-1}{\mu-1}{\mu+1}}$

Flattening the above expression into a single matrix is a bit tricky.
The $\mu$ are on the right-hand side this time, so the diagonal we should put $\mu$s on is bit harder to see.
Basically, any $\mu$s in the top-left and bottom-right sections stay $\mu$s while $\mu$s in the top-right and bottom-left get replaced with 0s.
It's also a bit confusing that the $1$s being added/subtracted from the $\mu$s follow the normal kronecker product rules, instead of the special-case follow-the-diagonal rule.
Carefully put it all together and you'll find:

$= \frac{1}{2} \begin{bmatrix}
\mu & \mu & 1 & -1 \\\\
\mu & \mu & -1 & 1 \\\\
1 & -1 & \mu & \mu \\\\
-1 & 1 & \mu & \mu
\end{bmatrix}$

We don't need to keep track of what's controlling what anymore, so we can clean up the $\mu$s by applying the function $clean(a + b \mu) = a + b$:

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

To get the matrix for the whole circuit, we just need to multiply in those last two Hadamard gates:

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


Which means... surrounding a controlled-not with Hadamards on all sides swaps which wire the control and the NOT are on!
This is actually a well known trick, but the fact that we computed it correctly indicates that merging operations into controls is safe.
We have not-rigorously-at-all shown that $(C \otimes U) \cdot (V \otimes I) = (C \cdot V) \otimes U$ (and this holds when you reverse all the $\otimes$ terms and/or all the $\cdot$ terms).

Intuitively, merging operations into the controls can be thought of as modifying the controls to apply in a *different basis*.
For example, because the Hadamard gate swaps between the X basis and Z basis, merging in a Hadamard operation on each side of a control causes the control to apply to the X observable instead of the Z observable (i.e. the computational basis).

# Multiple Controls

What happens when there's multiple controls, like in a Toffoli gate:

    ──X──
      │
    ──•──
      │
    ──•──

Let's see. We can start by computing $C \otimes C$:

$C \otimes C$

$= C^{\otimes 2}$

= $\bimat{\mu \otimes \bimat{\mu}{0}{0}{1}}{0 \otimes \bimat{\mu}{0}{0}{1}}{0 \otimes \bimat{\mu}{0}{0}{1}}{1 \otimes \bimat{\mu}{0}{0}{1}}$

= $\begin{bmatrix}
\mu & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 \\\\
0 & 0 & \mu & 0 \\\\
0 & 0 & 0 & 1
\end{bmatrix}$

Note that the entire diagonal is made up of $\mu$s, except for the bottom-right value (a 1).
This pattern continues for all kronecker powers $C^{\otimes n}$ of $C$.
(The resulting matrix can be stated succinctly in bra-ket notation: $C^{\otimes n} = \mu I_{2^n} + (1 - \mu) \ket{2^n-1} \bra{2^n-1}$.)

Getting back to computing the matrix of a Toffoli gate:

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

Which is the correct matrix for the Toffoli gate (or, it would be after applying $clean(a + \mu b) = a + b$ anyways).
So it appears that things continue to work when there are multiple controls.
Let's try merging larger operations into larger controls, and see if that works.

# Merging Multiple Operations into Multiple Controls Multiple Times

A task you're likely to run into a lot when computing is *incrementing*.
Fortunately, circuits that increment are quite simple to make out of controlled-NOTs.
Here's one that increments three bits (with wraparound on overflow):

    ──•─•─X──
      │ │
    ──•─X────
      │
    ──X──────

The pattern continues exactly like you're suspecting.
Just keep adding slightly larger controlled-NOTs in front.

This particular pattern of gates is interesting to us because the largest operation has controls on all wires affected by the smaller operations.
That suggests we can merge those smaller operations into the controls, that we can we simplify $(I \otimes I \otimes X) \cdot (I \otimes X \otimes C) \cdot (X \otimes C \otimes C)$ to use fewer large matrix multiplications.

To start with, note that matrix multiplication distributes over the tensor product.
This let's us simplify the sub-expression $(I \otimes I \otimes X) \cdot (I \otimes X \otimes C)$ into $I \otimes ((I \otimes X) \cdot (X \otimes C))$.
Also, from what we figured out earlier about merging single operations into single controls, we can guess that $(I \otimes X) \cdot (X \otimes C)$ simplifies into $X \otimes (X \cdot C)$.

Let's evaluate that simplified sub-expression:

$X \otimes (X \cdot C)$

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

Notice how, in the above matrix, the output (row with non-zero entry) is always one more than the input column.
It's the increment matrix for 2 bits (or, it would be after cleaning)!

Knowing the 2-bit case, we can now evaluate the 3-bit case from the start:

$(I \otimes I \otimes X) \cdot (I \otimes X \otimes C) \cdot (X \otimes C \otimes C)$

Pull out the distributed $I$:

$= (I \otimes ((I \otimes X) \cdot (X \otimes C))) \cdot (X \otimes C^{\otimes 2})$

Pull the $X$ out by merging operations into its controls:

$= X \otimes (((I \otimes X) \cdot (X \otimes C)) \cdot C^{\otimes 2})$

Pull the inner $X$ out by merging operations into its controls:

$= X \otimes ((X \otimes (X \cdot C)) \cdot C^{\otimes 2})$

Expand the 2-bit increment gate:

$= X \otimes \parens{\begin{bmatrix}
0 & 0 & 0 & 1 \\\\
\mu & 0 & 0 & 0 \\\\
0 & 1 & 0 & 0 \\\\
0 & 0 & \mu & 0
\end{bmatrix} \cdot C^{\otimes 2}}$

Evaluate the matrix multiplication:

$= X \otimes \begin{bmatrix}
0 & 0 & 0 & 1 \\\\
\mu & 0 & 0 & 0 \\\\
0 & \mu & 0 & 0 \\\\
0 & 0 & \mu & 0
\end{bmatrix}$

Evaluate the kronecker product:

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

And we're done.
The same row-one-more-than-column pattern is back, meaning we do in fact have the three-bit increment matrix.

Thinking about what's happening more abstractly, the original construction for the matrix was "make a triangle of controlled-NOTs".
More specifically: $Inc(n) = \Pi\_{i=1}^{n} \parens{I^{\otimes i-1} \otimes X \otimes C^{\otimes n-i}}$.

Our new construction is "do a smaller increment, but merged into a new controlled-not".
More specifically: $Inc(n) = X \otimes (Inc(n-1) \cdot C^{\otimes n-1})$

The reason this works all comes down to $\mu$, of course.
Merging the increment gate with the controls causes all of the values on the off-by-one diagonal to become $\mu$, but leaves the 1 in the top-right alone.
The kronecker product then expands all those $\mu$s into $\bimat{\mu}{0}{0}{\mu}$, effectively duplicating them into the top-left and bottom-right quadrants of the new larger matrix.
That leaves just one spot on the off-by-one diagonal unfilled, the top-right of the bottom-left quadrant, which is filled by the top-right 1 being expanded into $\bimat{0}{1}{1}{0}$.

The benefit of this evaluation strategy is that you don't need to do $n-1$ matrix multiplications of size $2^n$ x $2^n$.
You can instead do one 2x2 matrix multiplication, one 4x4 matrix multiplication, one 8x8 matrix multiplication, and so forth until you get to $2^n$ x $2^n$.
This is a runtime speedup factor of $n$ over the naive strategy, which you would get for free by automatically merging operations into controls.

# Impractical

So, I had fun working out all these facts about $\mu$ and $C$.
But, ultimately, I have to admit they're not very useful (beyond the initial hack).

For example, consider the "speedup" we achieved by using smaller matrix multiplications by merging operations into controls.
A better way to get that speedup would be to simply recognize that controlled operations apply to a small subset of the state vector.
An operation with $m$ controls affects at most $2^{n-m}$ amplitudes.
That optimization will always achieve the same speedup as merging.
(Of course if you were *really* trying, you'd notice a common pattern like the increment gate and reduce it into a rotate-by-1.)
Basically, the "optimization benefits" are trivially beatable.

The value $\mu$ also has issues.
Sure, it's convenient for representing controls, but the special-cased kronecker product obeys fewer mathematical identities.
For example, it is no longer the case that $(X \otimes Y) \cdot (Z \otimes T) = (X \cdot Z) \otimes (Y \cdot T)$.
Whenever you try to optimize the evaluation schedule of a circuit, you need special cases for $\mu$.
Whether or not those special cases would be more complicated than having custom logic for controls... I'm not sure.

All in all, this is *interesting* but probably not *useful*.
Which makes it an impractical experiment.

# Summary

By introducing a special value, that the kronecker product special-cases, the concept of "use this wire as a control for that operation" can be turned into an operation.
Doing this is quicker than having more typical custom logic for controls, but breaks some mathematical identities.

--------------------------
# Comments

{% include /comments/test.markdown %}

[Comment via Pull Request](https://github.com/Strilanc/Strilanc.github.io/edit/master/index.html)

