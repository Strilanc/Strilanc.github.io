---
layout: post
title: "Things I Can't Solve: Matrix Multiplication"
date: 2016-02-24 11:30:00 EST
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

Squaring is no harder:

$$\begin{bmatrix}
0 & A \\ B & 0
\end{bmatrix}^2 = \begin{bmatrix}
A \cdot B & 0 \\
0 & A \cdot B
\end{bmatrix}$$

Adjoint-squaring is not easier:

$$\mathfrak{F}(U) = U \cdot U^\dagger$$

$$U \cdot V = \frac{1-i}{4} \mathfrak{F}(U + V^\dagger) - \frac{1+i}{4} \mathfrak{F}(U - V^\dagger) + \frac{i}{2} \mathfrak{F}(U + i V^\dagger)$$

Transpose-squaring is not easier:

$$\mathfrak{G}(U) = U \cdot U^T$$

$$U \cdot V = \mathfrak{G} \left( \begin{bmatrix}
U&V \\
0&0
\end{bmatrix} \right)_{0,0}$$

# Basis Transformations *Almost* Work

I tried to find ways to decompose the matrices into a basis that would be better for calculation.
The trivial basis is pretty good, since so many elements give 0 when multiplied.

I came up with three different ideas on this route.
They all failed.

Based on what I knew about quantum information, I knew that a unitary matrix could be decomposed into observables based on the pauli X and Z matrices.

Define $U^{\oplus b} = U^{\oplus b_0 b_1 b_2 b_3 ... b_{n-1}} = \otimes_{k=0}^{n-1} U^b_k$ where $b_k$ is the k'th binary digit of $b$.

Then the basis we are using is $B_{i,j} = X^{\oplus i} Z^{\oplus j}$.

For 2 bits, that means

$$\begin{bmatrix}
1 &   &   &   \\
  & 1 &   &   \\
  &   & 1 &   \\
  &   &   & 1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\
  & 1 &   &   \\
  &   & -1 &   \\
  &   &   & -1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\
  & -1 &   &   \\
  &   & 1 &   \\
  &   &   & -1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\
  & -1 &   &   \\
  &   & -1 &   \\
  &   &   & 1
\end{bmatrix}$$

$$\begin{bmatrix}
  & 1 &   &   \\
1 &   &   &   \\
  &   &   & 1 \\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   \\
1 &   &   &   \\
  &   &   & -1 \\
  &   & -1 &  
\end{bmatrix}
\begin{bmatrix}
  & -1 &   &   \\
1 &   &   &   \\
  &   &   & -1 \\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  & -1 &   &   \\
1 &   &   &   \\
  &   &   & 1 \\
  &   & -1 &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   & 1 &   \\
  &   &   & 1 \\
1 &   &   &   \\
  & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\
  &   &   & -1 \\
1 &   &   &   \\
  & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   \\
  &   &   & -1 \\
1 &   &   &   \\
  & -1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\
  &   &   & 1 \\
1 &   &   &   \\
  & -1 &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   & 1 \\
  &   & 1 &   \\
  & 1 &   &   \\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -1 \\
  &   & -1 &   \\
  & 1 &   &   \\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -1 \\
  &   & 1 &   \\
  & -1 &   &   \\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 \\
  &   & -1 &   \\
  & -1 &   &   \\
1 &   &   &  
\end{bmatrix}$$

We can get into this basis in $O(n lg n)$ time by separating the matrix into the various X-observable curves and then Hadamard transforming them.

The nice thing about this basis is how two decomposed matrices multiply together:

$U \cdot V$

$= (\sum_{a,b}^n u_{a,b} B_{a,b}) \cdot (\sum_{c,d}^n v_{c,d} B_{c,d})$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} B_{a,b} B_{c,d}$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} X^{\oplus a} Z^{\oplus b} X^{\oplus c} Z^{\oplus d}$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} X^{\oplus a} X^{\oplus c} Z^{\oplus b} Z^{\oplus d} (-1)^{b \land c}$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} X^{\oplus a \oplus c} Z^{\oplus b \oplus d} (-1)^{b \land c}$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} B_{a \oplus c, b \oplus d} (-1)^{b \land c}$

$= \sum_{a,b,i,j}^n u_{a,b} v_{i \oplus a, j \oplus b} B_{i, j} (-1)^{b \land (i \oplus a)}$

$= \sum_{a,b,i,j}^n u_{a,b} v_{i \oplus a, j \oplus b} B_{i, j} (-1)^{b \land i + b \land a}$

$\rightarrow w_{i,j} = \sum_{a,b}^n u_{a,b} v_{i \oplus a, j \oplus b} (-1)^{b \land i + b \land a}$

The exciting thing about this definition is how incredibly similar it is to what you get when you do a point-wise product under a Hadamard transform:

$H(H(u) \cdot \cdot H(v))_{i,j} = \sum_{a,b}^n u_{a,b} v_{i \oplus a, j \oplus b}$

The problem, of course, is that darn $(-1)^{b \land i + b \land a}$.
We can get rid of the $b \land a$ part by twiddling $u$, but the $b \land i$ part is a huge obstacle.





Next attempt: instead of using the Hadmard transform, lets try to use the Fourier transform.
Let's switch from xoring to adding.

Instead of using X and Z observables, lets use a cobmination of shift matrices and clock matrices.

$[+]_a = \sum_k^n \left| k+a \pmod{n} \right\rangle \left\langle k \right| = [+]_1^a$

$\Omega_a = \sum_k^n e^{i k \tau / n} \left| k \right\rangle \left\langle k \right| = \Omega_1^a$

$C_{a,b} = [+]_a \Omega_b$

$$\begin{bmatrix}
1 &   &   &   \\
  & 1 &   &   \\
  &   & 1 &   \\
  &   &   & 1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\
  & i &   &   \\
  &   & -1 &   \\
  &   &   & -i
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\
  & -1 &   &   \\
  &   & 1 &   \\
  &   &   & -1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   \\
  & -i &   &   \\
  &   & -1 &   \\
  &   &   & i
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   & 1 \\
1 &   &   &   \\
  & 1 &   &   \\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -i \\
1 &   &   &   \\
  & i &   &   \\
  &   & -1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & -1 \\
1 &   &   &   \\
  & -1 &   &   \\
  &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & i \\
1 &   &   &   \\
  & -i &   &   \\
  &   & -1 &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   & 1 &   \\
  &   &   & 1 \\
1 &   &   &   \\
  & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\
  &   &   & -i \\
1 &   &   &   \\
  & i &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   \\
  &   &   & -1 \\
1 &   &   &   \\
  & -1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & -1 &   \\
  &   &   & i \\
1 &   &   &   \\
  & -i &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  & 1 &   &   \\
  &   & 1 &   \\
  &   &   & 1 \\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & i &   &   \\
  &   & -1 &   \\
  &   &   & -i \\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & -1 &   &   \\
  &   & 1 &   \\
  &   &   & -1 \\
1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & -i &   &   \\
  &   & -1 &   \\
  &   &   & i \\
1 &   &   &  
\end{bmatrix}$$

So let's decompose by fourier-transforming the shifted diagonals and then see what we need to do:

$U \cdot V$

$= (\sum_{a,b}^n u_{a,b} \cdot C_{a,b}) \cdot (\sum_{c,d}^n v_{c,d} \cdot C_{c,d})$

$= \sum_{a,b,c,d}^n u_{a,b} \cdot v_{c,d} \cdot C_{a,b} \cdot C_{c,d}$

$= \sum_{a,b,c,d}^n u_{a,b} \cdot v_{c,d} \cdot [+]_a \cdot \Omega_b \cdot [+]_c \cdot \Omega_d$

$= \sum_{a,b,c,d}^n u_{a,b} \cdot v_{c,d} \cdot [+]_a \cdot [+]_c \cdot \Omega_b \cdot \Omega_d \cdot \omega^{bc}$

$= \sum_{a,b,c,d}^n u_{a,b} \cdot v_{c,d} \cdot [+]_{a + c} \cdot \Omega_{b+d} \cdot \omega^{bc}$

$= \sum_{a,b,i,j}^n u_{a,b} \cdot v_{i-a,j-b} \cdot [+]_{i} \cdot \Omega_{j} \cdot \omega^{b(i-a)}$

$\rightarrow w_{i,j} = \sum_{a,b}^n u_{a,b} v_{i-a,j-b} \omega^{bi - ba}$

Once again, we get an annoying twiddle factor that makes it slightly differ from the pointwise product.

$F^{-1}(F(U) \cdot \cdot F(V))_{i,j} = \sum_{a,b}^n u_{a,b} v_{i-a,j-b}$





Next attempt: keep the shift matrices, but combine them with striding instead of fourier transforming.

$[\times]_a = \sum_k^n \left| ka \pmod{n} \right\rangle \left\langle k \right|$

$D_{a,b} = [+]_a [\times]_b$

$$\begin{bmatrix}
1 & 1 & 1 & 1 & 1 \\
  &   &   &   &   \\
  &   &   &   &   \\
  &   &   &   &   \\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\
  & 1 &   &   &   \\
  &   & 1 &   &   \\
  &   &   & 1 &   \\
  &   &   &   & 1
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\
  &   &   & 1 &   \\
  & 1 &   &   &   \\
  &   &   &   & 1 \\
  &   & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\
  &   & 1 &   &   \\
  &   &   &   & 1 \\
  & 1 &   &   &   \\
  &   &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
1 &   &   &   &   \\
  &   &   &   & 1 \\
  &   &   & 1 &   \\
  &   & 1 &   &   \\
  & 1 &   &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\
1 & 1 & 1 & 1 & 1 \\
  &   &   &   &   \\
  &   &   &   &   \\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\
1 &   &   &   &   \\
  & 1 &   &   &   \\
  &   & 1 &   &   \\
  &   &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\
1 &   &   &   &   \\
  &   &   & 1 &   \\
  & 1 &   &   &   \\
  &   &   &   & 1
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\
1 &   &   &   &   \\
  &   & 1 &   &   \\
  &   &   &   & 1 \\
  & 1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\
1 &   &   &   &   \\
  &   &   &   & 1 \\
  &   &   & 1 &   \\
  &   & 1 &   &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\
  &   &   &   &   \\
1 & 1 & 1 & 1 & 1 \\
  &   &   &   &   \\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\
  &   &   &   & 1 \\
1 &   &   &   &   \\
  & 1 &   &   &   \\
  &   & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\
  &   & 1 &   &   \\
1 &   &   &   &   \\
  &   &   & 1 &   \\
  & 1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\
  &   &   & 1 &   \\
1 &   &   &   &   \\
  &   & 1 &   &   \\
  &   &   &   & 1
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\
  & 1 &   &   &   \\
1 &   &   &   &   \\
  &   &   &   & 1 \\
  &   &   & 1 &  
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\
  &   &   &   &   \\
  &   &   &   &   \\
1 & 1 & 1 & 1 & 1 \\
  &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\
  &   &   & 1 &   \\
  &   &   &   & 1 \\
1 &   &   &   &   \\
  & 1 &   &   &  
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\
  &   &   &   & 1 \\
  &   & 1 &   &   \\
1 &   &   &   &   \\
  &   &   & 1 &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\
  & 1 &   &   &   \\
  &   &   & 1 &   \\
1 &   &   &   &   \\
  &   & 1 &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\
  &   & 1 &   &   \\
  & 1 &   &   &   \\
1 &   &   &   &   \\
  &   &   &   & 1
\end{bmatrix}$$

$$\begin{bmatrix}
  &   &   &   &   \\
  &   &   &   &   \\
  &   &   &   &   \\
  &   &   &   &   \\
1 & 1 & 1 & 1 & 1
\end{bmatrix}
\begin{bmatrix}
  & 1 &   &   &   \\
  &   & 1 &   &   \\
  &   &   & 1 &   \\
  &   &   &   & 1 \\
1 &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   & 1 &   \\
  & 1 &   &   &   \\
  &   &   &   & 1 \\
  &   & 1 &   &   \\
1 &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   & 1 &   &   \\
  &   &   &   & 1 \\
  & 1 &   &   &   \\
  &   &   & 1 &   \\
1 &   &   &   &  
\end{bmatrix}
\begin{bmatrix}
  &   &   &   & 1 \\
  &   &   & 1 &   \\
  &   & 1 &   &   \\
  & 1 &   &   &   \\
1 &   &   &   &  
\end{bmatrix}$$


$U \cdot V$

$= (\sum_{a,b}^n u_{a,b} D_{a,b}) \cdot (\sum_{c,d}^n v_{c,d} D_{c,d})$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} D_{a,b} D_{c,d}$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} [+]_a [\times]_b [+]_c [\times]_d$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} [+]_a [+]_{bc} [\times]_b [\times]_d$

$= \sum_{a,b,c,d}^n u_{a,b} v_{c,d} [+]_{a + bc} [\times]_{bd}$

$i = a + bc$, $j = bd$, $c = (i-a)b^{-1}$, $d = j b^{-1}$

$= \text{stuff-related-to-b=0} + \sum_{a,b,i,j}^n u_{a,b} v_{(i-a)b^{-1},j b^{-1}} [+]_{i} [\times]_{j}$

Clearly we need to be using a prime field.

$\rightarrow w^\prime_{i,j} = \sum_{a,b}^n u_{a,b} v_{(i-a)b^{-1},j b^{-1}}$

Hey, we didn't end up with that annoying twiddle factor!
But now we have addition and multiplication happening in one of the indices.
If it was just multiplication, we could re-order the indices based on the discrete logarithm.

It's possible to play a lot here, turning the index multiplications into offsets by re-ordering $v$ using the logarithm permutation and so forth.
After a lot of trial and error I managed to get it into simpler and simpler forms.
One of the sums disappeared!
Finally, painfully, I had... accidentally undone my original transform and ended back at the matrix multiplication.

$$\rightarrow w^{\prime\prime\prime\prime}_{i,j} = \sum_{a,b}^n u^{\prime\prime\prime}_{a-i,b} v^{\prime\prime\prime}_{ab, j-b}$$

