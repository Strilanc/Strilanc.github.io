---
layout: post
title: "Things I Can't Solve: Matrix Multiplication"
date: 2016-02-26 11:30:00 EST
categories: math
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Last time, we talked about integer multiplication.
This time we'll talk about matrix multiplication.

I don't know the coppersmith algorithm.

# Squaring is as expensive as multiplication

Integer multiplication is just as hard as integer squaring.
Is the same true for matrices?

Yes.

Squaring is no harder; it's easy to find a matrix whose square contains the result of a multiplication we want to compute:

$$\bimat{0}{U}{V}{0}^2 = \bimat{U \cdot V}{0}{0}{U \cdot V}$$

Transpose-squaring is also not easier.
Given $\mathfrak{G}$ that computes $\mathfrak{G}(U) = U \cdot U^T$, we can make a result that contains what we want:

$\mathfrak{G} \bimat{U}{V}{0}{0} = \bimat{U \cdot V}{0}{0}{0}$

Adjoint-squaring is also not easier.
Given an $\mathfrak{F}$ that computes $\mathfrak{F}(U) = U \cdot U^\dagger$ you can pull off a multiplication with [just three applications](http://cs.stackexchange.com/a/52010) of $\mathfrak{F}$:

$$U \cdot V = \frac{1-i}{4} \mathfrak{F}(U + V^\dagger) - \frac{1+i}{4} \mathfrak{F}(U - V^\dagger) + \frac{i}{2} \mathfrak{F}(U + i V^\dagger)$$

Because squaring seemed simpler, I focused on it.

But ultimately it comes down to the fact that you need 3 squarings to perform a multiplication, and when you recurse a squaring you need to do two multiplications.
You can share one of the squarings with finding the squares of A and B but that brings the total to 8.

Strassen did better than that already.

# Basis Transformations *Almost* Work

I tried to find ways to decompose the matrices into a basis that would be better for calculation.
The trivial basis is pretty good, since so many elements give 0 when multiplied.

I came up with three different ideas on this route.
They all failed.

Based on what I knew about quantum information, I knew that a unitary matrix could be decomposed into observables based on the pauli X and Z matrices.

Define $U^{\oplus b} = U^{\oplus b\_0 b\_1 b\_2 b\_3 ... b\_{n-1}} = \otimes\_{k=0}^{n-1} U^b\_k$ where $b\_k$ is the k'th binary digit of $b$.

Then the basis we are using is $B\_{i,j} = X^{\oplus i} Z^{\oplus j}$.

For 2 bits, that means

$$\begin{bmatrix}
1 &   &   &   \\\\
  & 1 &   &   \\\\
  &   & 1 &   \\\\
  &   &   & 1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\\\
  & 1 &   &   \\\\
  &   & -1 &  \\\\
  &   &   & -1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\\\
  & -1 &   &  \\\\
  &   & 1 &   \\\\
  &   &   & -1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\\\
  & -1 &   &  \\\\
  &   & -1 &  \\\\
  &   &   & 1
\end{bmatrix}$$

$$\begin{bmatrix}
  & 1 &   &   \\\\
1 &   &   &   \\\\
  &   &   & 1 \\\\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &    \\\\
1 &   &   &    \\\\
  &   &   & -1 \\\\
  &   & -1 &  
\end{bmatrix}
\begin{bmatrix}
  & -1 &   &   \\\\
1 &   &   &    \\\\
  &   &   & -1 \\\\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  & -1 &   &  \\\\
1 &   &   &   \\\\
  &   &   & 1 \\\\
  &   & -1 &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   & 1 &   \\\\
  &   &   & 1 \\\\
1 &   &   &   \\\\
  & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\\\
  &   &   & -1 \\\\
1 &   &   &   \\\\
  & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   \\\\
  &   &   & -1 \\\\
1 &   &   &   \\\\
  & -1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\\\
  &   &   & 1 \\\\
1 &   &   &   \\\\
  & -1 &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   & 1 \\\\
  &   & 1 &   \\\\
  & 1 &   &   \\\\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -1 \\\\
  &   & -1 &   \\\\
  & 1 &   &   \\\\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -1 \\\\
  &   & 1 &   \\\\
  & -1 &   &   \\\\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 \\\\
  &   & -1 &   \\\\
  & -1 &   &   \\\\
1 &   &   &  
\end{bmatrix}$$

We can get into this basis in $O(n lg n)$ time by separating the matrix into the various X-observable curves and then Hadamard transforming them.

The nice thing about this basis is how two decomposed matrices multiply together:

$U \cdot V$

$= (\sum\_{a,b}^n u\_{a,b} B\_{a,b}) \cdot (\sum\_{c,d}^n v\_{c,d} B\_{c,d})$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} B\_{a,b} B\_{c,d}$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} X^{\oplus a} Z^{\oplus b} X^{\oplus c} Z^{\oplus d}$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} X^{\oplus a} X^{\oplus c} Z^{\oplus b} Z^{\oplus d} (-1)^{b \land c}$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} X^{\oplus a \oplus c} Z^{\oplus b \oplus d} (-1)^{b \land c}$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} B\_{a \oplus c, b \oplus d} (-1)^{b \land c}$

$= \sum\_{a,b,i,j}^n u\_{a,b} v\_{i \oplus a, j \oplus b} B\_{i, j} (-1)^{b \land (i \oplus a)}$

$= \sum\_{a,b,i,j}^n u\_{a,b} v\_{i \oplus a, j \oplus b} B\_{i, j} (-1)^{b \land i + b \land a}$

$\rightarrow w\_{i,j} = \sum\_{a,b}^n u\_{a,b} v\_{i \oplus a, j \oplus b} (-1)^{b \land i + b \land a}$

The exciting thing about this definition is how incredibly similar it is to what you get when you do a point-wise product under a Hadamard transform:

$H(H(u) \cdot \cdot H(v))\_{i,j} = \sum\_{a,b}^n u\_{a,b} v\_{i \oplus a, j \oplus b}$

The problem, of course, is that darn $(-1)^{b \land i + b \land a}$.
We can get rid of the $b \land a$ part by twiddling $u$, but the $b \land i$ part is a huge obstacle.





Next attempt: instead of using the Hadmard transform, lets try to use the Fourier transform.
Let's switch from xoring to adding.

Instead of using X and Z observables, lets use a cobmination of shift matrices and clock matrices.

$[+]\_a = \sum\_k^n \left| k+a \pmod{n} \right\rangle \left\langle k \right| = [+]\_1^a$

$\Omega\_a = \sum\_k^n e^{i k \tau / n} \left| k \right\rangle \left\langle k \right| = \Omega\_1^a$

$C\_{a,b} = [+]\_a \Omega\_b$

$$\begin{bmatrix}
1 &   &   &   \\\\
  & 1 &   &   \\\\
  &   & 1 &   \\\\
  &   &   & 1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\\\
  & i &   &   \\\\
  &   & -1 &   \\\\
  &   &   & -i
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\\\
  & -1 &   &   \\\\
  &   & 1 &   \\\\
  &   &   & -1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\\\
  & -i &   &   \\\\
  &   & -1 &   \\\\
  &   &   & i
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   & 1 \\\\
1 &   &   &   \\\\
  & 1 &   &   \\\\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -i \\\\
1 &   &   &   \\\\
  & i &   &   \\\\
  &   & -1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -1 \\\\
1 &   &   &   \\\\
  & -1 &   &   \\\\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & i \\\\
1 &   &   &   \\\\
  & -i &   &   \\\\
  &   & -1 &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   & 1 &   \\\\
  &   &   & 1 \\\\
1 &   &   &   \\\\
  & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\\\
  &   &   & -i \\\\
1 &   &   &   \\\\
  & i &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   \\\\
  &   &   & -1 \\\\
1 &   &   &   \\\\
  & -1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\\\
  &   &   & i \\\\
1 &   &   &   \\\\
  & -i &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  & 1 &   &   \\\\
  &   & 1 &   \\\\
  &   &   & 1 \\\\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & i &   &   \\\\
  &   & -1 &   \\\\
  &   &   & -i \\\\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & -1 &   &   \\\\
  &   & 1 &   \\\\
  &   &   & -1 \\\\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & -i &   &   \\\\
  &   & -1 &   \\\\
  &   &   & i \\\\
1 &   &   &  
\end{bmatrix}$$

So let's decompose by fourier-transforming the shifted diagonals and then see what we need to do:

$U \cdot V$

$= (\sum\_{a,b}^n u\_{a,b} \cdot C\_{a,b}) \cdot (\sum\_{c,d}^n v\_{c,d} \cdot C\_{c,d})$

$= \sum\_{a,b,c,d}^n u\_{a,b} \cdot v\_{c,d} \cdot C\_{a,b} \cdot C\_{c,d}$

$= \sum\_{a,b,c,d}^n u\_{a,b} \cdot v\_{c,d} \cdot [+]\_a \cdot \Omega\_b \cdot [+]\_c \cdot \Omega\_d$

$= \sum\_{a,b,c,d}^n u\_{a,b} \cdot v\_{c,d} \cdot [+]\_a \cdot [+]\_c \cdot \Omega\_b \cdot \Omega\_d \cdot \omega^{bc}$

$= \sum\_{a,b,c,d}^n u\_{a,b} \cdot v\_{c,d} \cdot [+]\_{a + c} \cdot \Omega\_{b+d} \cdot \omega^{bc}$

$= \sum\_{a,b,i,j}^n u\_{a,b} \cdot v\_{i-a,j-b} \cdot [+]\_{i} \cdot \Omega\_{j} \cdot \omega^{b(i-a)}$

$\rightarrow w\_{i,j} = \sum\_{a,b}^n u\_{a,b} v\_{i-a,j-b} \omega^{bi - ba}$

Once again, we get an annoying twiddle factor that makes it slightly differ from the pointwise product.

$F^{-1}(F(U) \cdot \cdot F(V))\_{i,j} = \sum\_{a,b}^n u\_{a,b} v\_{i-a,j-b}$





Next attempt: keep the shift matrices, but combine them with striding instead of fourier transforming.

$[\times]\_a = \sum\_k^n \left| ka \pmod{n} \right\rangle \left\langle k \right|$

$D\_{a,b} = [+]\_a [\times]\_b$

$$\begin{bmatrix}
1 & 1 & 1 & 1 & 1 \\\\
  &   &   &   &   \\\\
  &   &   &   &   \\\\
  &   &   &   &   \\\\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\\\
  & 1 &   &   &   \\\\
  &   & 1 &   &   \\\\
  &   &   & 1 &   \\\\
  &   &   &   & 1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\\\
  &   &   & 1 &   \\\\
  & 1 &   &   &   \\\\
  &   &   &   & 1 \\\\
  &   & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\\\
  &   & 1 &   &   \\\\
  &   &   &   & 1 \\\\
  & 1 &   &   &   \\\\
  &   &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\\\
  &   &   &   & 1 \\\\
  &   &   & 1 &   \\\\
  &   & 1 &   &   \\\\
  & 1 &   &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\\\
1 & 1 & 1 & 1 & 1 \\\\
  &   &   &   &   \\\\
  &   &   &   &   \\\\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\\\
1 &   &   &   &   \\\\
  & 1 &   &   &   \\\\
  &   & 1 &   &   \\\\
  &   &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\\\
1 &   &   &   &   \\\\
  &   &   & 1 &   \\\\
  & 1 &   &   &   \\\\
  &   &   &   & 1
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\\\
1 &   &   &   &   \\\\
  &   & 1 &   &   \\\\
  &   &   &   & 1 \\\\
  & 1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\\\
1 &   &   &   &   \\\\
  &   &   &   & 1 \\\\
  &   &   & 1 &   \\\\
  &   & 1 &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\\\
  &   &   &   &   \\\\
1 & 1 & 1 & 1 & 1 \\\\
  &   &   &   &   \\\\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\\\
  &   &   &   & 1 \\\\
1 &   &   &   &   \\\\
  & 1 &   &   &   \\\\
  &   & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\\\
  &   & 1 &   &   \\\\
1 &   &   &   &   \\\\
  &   &   & 1 &   \\\\
  & 1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\\\
  &   &   & 1 &   \\\\
1 &   &   &   &   \\\\
  &   & 1 &   &   \\\\
  &   &   &   & 1
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\\\
  & 1 &   &   &   \\\\
1 &   &   &   &   \\\\
  &   &   &   & 1 \\\\
  &   &   & 1 &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\\\
  &   &   &   &   \\\\
  &   &   &   &   \\\\
1 & 1 & 1 & 1 & 1 \\\\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\\\
  &   &   & 1 &   \\\\
  &   &   &   & 1 \\\\
1 &   &   &   &   \\\\
  & 1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\\\
  &   &   &   & 1 \\\\
  &   & 1 &   &   \\\\
1 &   &   &   &   \\\\
  &   &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\\\
  & 1 &   &   &   \\\\
  &   &   & 1 &   \\\\
1 &   &   &   &   \\\\
  &   & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\\\
  &   & 1 &   &   \\\\
  & 1 &   &   &   \\\\
1 &   &   &   &   \\\\
  &   &   &   & 1
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\\\
  &   &   &   &   \\\\
  &   &   &   &   \\\\
  &   &   &   &   \\\\
1 & 1 & 1 & 1 & 1
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\\\
  &   & 1 &   &   \\\\
  &   &   & 1 &   \\\\
  &   &   &   & 1 \\\\
1 &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\\\
  & 1 &   &   &   \\\\
  &   &   &   & 1 \\\\
  &   & 1 &   &   \\\\
1 &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\\\
  &   &   &   & 1 \\\\
  & 1 &   &   &   \\\\
  &   &   & 1 &   \\\\
1 &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\\\
  &   &   & 1 &   \\\\
  &   & 1 &   &   \\\\
  & 1 &   &   &   \\\\
1 &   &   &   &  
\end{bmatrix}$$


$U \cdot V$

$= (\sum\_{a,b}^n u\_{a,b} D\_{a,b}) \cdot (\sum\_{c,d}^n v\_{c,d} D\_{c,d})$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} D\_{a,b} D\_{c,d}$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} [+]\_a [\times]\_b [+]\_c [\times]\_d$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} [+]\_a [+]\_{bc} [\times]\_b [\times]\_d$

$= \sum\_{a,b,c,d}^n u\_{a,b} v\_{c,d} [+]\_{a + bc} [\times]\_{bd}$

$i = a + bc$, $j = bd$, $c = (i-a)b^{-1}$, $d = j b^{-1}$

$= \text{stuff-related-to-b=0} + \sum\_{a,b,i,j}^n u\_{a,b} v\_{(i-a)b^{-1},j b^{-1}} [+]\_{i} [\times]\_{j}$

Clearly we need to be using a prime field.

$\rightarrow w^\prime\_{i,j} = \sum\_{a,b}^n u\_{a,b} v\_{(i-a)b^{-1},j b^{-1}}$

Hey, we didn't end up with that annoying twiddle factor!
But now we have addition and multiplication happening in one of the indices.
If it was just multiplication, we could re-order the indices based on the discrete logarithm.

It's possible to play a lot here, turning the index multiplications into offsets by re-ordering $v$ using the logarithm permutation and so forth.
After a lot of trial and error I managed to get it into simpler and simpler forms.
One of the sums disappeared!
Finally, painfully, I had... accidentally undone my original transform and ended back at the matrix multiplication.

$$\rightarrow w^{\prime\prime\prime\prime}\_{i,j} = \sum\_{a,b}^n u^{\prime\prime\prime}\_{a-i,b} v^{\prime\prime\prime}\_{ab, j-b}$$

# Nearly-correct vectors

Consider the projector version of the problem.

We want to compute $\sum\_k^n \ket{u\_k} \bra{v\_k}$, but it takes us $O(n^2)$ time to query a linear combination projector like $\left(\sum\_i^n a\_i \ket{u\_i} \right) \left( \sum\_j^n b\_j \bra{v\_j} \right)$.
However, we can add various queries together, as long as there's a reasonable number $d$ of them:

$\sum\_k^n \left(\sum\_i^n a\_{i,k} \ket{u\_i} \right) \left( \sum_j^n b\_{j,k} \bra{v_j} \right)$

Rearrange:

$\sum\_{i,j}^n \ket{u\_i} \bra{v_j} \sum\_k^n a\_{i,k} b\_{j,k}$

It's just dot products:

$\sum\_{i,j}^n \ket{u\_i} \bra{v_j} \sum\_k^n a\_{i} \cdot b\_{j}$

Now notice that we want the dot product to be 0 when $i \neq j$, but we want it to be $1$ when $i \eq j$.
In other words, what we want is exactly $n$ mutually perpendicular vectors of dimension $d$.
But if $d < n$ then that's not possible.

But the idea I had is... what if they were only *approximately* perpendicular.
It's possible to pack exponentially many nearly-perpendicular vectors into a space.

I think the bound is something like being able to pack $O(\frac{\lg n}{\epsilon^2})$ vectors that overlap by at most $\epsilon$ into $n$ dimensional space.
You can get close to that bound using Reed-solomon codes: consider a 2d-plane in the finite field of size $\sqrt n$, and have the points hit by each polynomial of degree $\epsilon \sqrt n$ as your vectors.
These vectors have at most $\epsilon \sqrt n$ points in common our of $\sqrt n$, giving a max total overlap of $\epsilon$ for each of the $(\sqrt n)^{\epsilon \sqrt n}$ polynomials.
You can fit more nearly perpendicular basis vectors into the space (e.g. consider the individual columns, or fourier transforming all the columns for each polynomial), but the basis idea already hits the bound since if $m = \sqrt \lg n / \epsilon$ then we're fitting $\lg (\sqrt n)^{\epsilon \sqrt n}$ = $\sqrt n \lg \sqrt n \epsilon$ values in $\lg n$-dimensional space.

The reason this doesn't work is that, although each term does in fact end up damped by a factor of $\epsilon$, there are $n^2$ error terms.
In the worst case, where all the projectors are nearly parallel, those errors all point in roughly the same direction.
Even if they were somehow randomized, that would only drop the expectation to a $n$ multiplier.
And if we need $\epsilon \propto \frac{1}{n}$, that will increase the dimensionality of the space *past* $d = n$, so we might as well just do the full work.

# Summary

Matrix multiplication shows up in lots of places.

I can't solve it.
