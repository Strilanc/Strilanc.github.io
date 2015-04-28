---
layout: post
title: "Entangled States are like Unitary Matrices"
date: 2015-04-25 11:30:00 EST
categories: quantum
---

(Currently testing why github is choking on this post by binary searching the content. Content may be missing.)

Quantum entanglement is legendarily anti-intuitive. Learning the actual math behind entanglement is infinitely more enlightening than reading or watching pop-sci expositions about it... but you're still left with the question of how to think about entanglement *usefully* when solving problems.

In this post, I describe one trick for thinking about entanglement. It is not an original trick, but I half-stumbled onto it on my own so I'm going to explain it anyways.

**Representing Qubits**

One of the hobby programs I work on from time to time is a quantum circuit simulator. It lets you drag and drop quantum gates onto a circuit, and shows representations of the output state (among other things).

Every quantum system is described by a bunch of complex weights, one for each basis state. You need $2^n$ weights to describe a system with $n$ qubits, because it has $2^n$ basis (i.e. classical) states. This makes visually representing quantum states with more than a few qubits difficult, because there's *so many numbers*.

The first thing I tried, for visually representing the weights of the circuit's output in my simulator, was just a column vector. Each complex number was represented with an oriented circle, and I arranged them vertically in binary order (i.e. from $\ket{0000}$ to $\ket{1111}$). This was problematic, even with just four qubits. Not only was it hard to figure out which weight was where, it used the available space very poorly because it was so thin. So I re-arranged the column into a grid.

Arranging things into a grid turned out better than I expected. Suddenly, operations on half of the qubits had row-wise effects while operations on the other half had column-wise effects. I started using this as a mnemonic tool. When playing with circuits that involved two parties, I'd make distinguishing Alice's effects from Bob's effects easy by giving Alice the row-wise qubits and Bob the column-wise qubits.

Eventually, I noticed that the state grid acted kind of like a matrix. If I had just created an entangled pair of qubits, and applied a gate to one of the qubits, the state would look like the matrix for that gate! And adding another qubit multiplied the "matrix" by the next gate (sortof)! I even got some use out of this: it helped me guess what [symmetry breaking would look like](http://strilanc.com/quantum/2014/12/06/Perfect-Symmetry-Breaking-with-Quantum-Computers.html).

Months later, thanks to learning from [Nielsen and Chuang](http://www.amazon.com/Quantum-Computation-Information-Anniversary-Edition/dp/1107002176) how the [Schmidt Decomposition](http://en.wikipedia.org/wiki/Schmidt_decomposition) related to the [Singular Value Decomposition](http://en.wikipedia.org/wiki/Singular_value_decomposition) and entanglement, I came to understand what was going with my "matrix states".

**State Times Operation**

Consider the state $S\_0 = a \ket{00} + b \ket{10} + c \ket{01} + d \ket{11}$, represented as the matrix $Grid(S\_0) = \begin{bmatrix} a & b \\\\ c & d \end{bmatrix}$. What happens when we apply an operation $U = \begin{bmatrix} e & f \\\\ g & h \end{bmatrix}$ to the first qubit of $S\_0$? (The first qubit is the row-wise one.)

Running the math:

$S\_1 = (U \otimes I) \cdot S\_0$

$= \parens{ U \begin{bmatrix} a \\\\ b \end{bmatrix} } \otimes \ket{0} + \parens{ U \begin{bmatrix} c \\\\ d \end{bmatrix} } \otimes \ket{1}$

$= \begin{bmatrix} ea + bf \\\\ ag + bh \end{bmatrix} \otimes \ket{0} + \begin{bmatrix} ec + df \\\\ cg + dh \end{bmatrix} \otimes \ket{1}$

$= (ea + bf) \ket{00} + (ag + bh) \ket{10} + (ec + df) \ket{01} + (cg + dh) \ket{11}$

Rearranging the final state into a matrix, we find that $Grid(S\_1) = \begin{bmatrix} ea + bf & ag + bh \\\\ ec + df & cg + dh \end{bmatrix}$. This also happens to be equal to $Grid(S\_0) \cdot U^T$. We can compute the results of applying the single-qubit operation while avoiding the tensor product! The same phenomenon occurs when applying $U$ to the second qubit, except there's no transpose and the multiplication happens on the other side: $Grid(S\_2) = U \cdot Grid(S\_0)$.

By representing the state as a matrix, we've simplified how we apply operations. Operating on the first qubit (the row-wise one) is equivalent to post-multiplying the state matrix by the transpose of the operation. Operating on the second qubit (the column-wise one) is equivalent to pre-multiplying the state matrix by the operation. We can even represent some multi-qubit operations (e.g. controlled-nots correspond to flipping the bottom row or right column), but we won't be using any in this post.

Personally, I find it fascinating that the operations simplify like that. It makes it much easier to reason about the states you can reach from some starting state... so let's do that. Let's consider how the single-qubit operations behave when starting from two different states: an unentangled classical "lonely corner" state $\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \end{bmatrix}$ and a completely entangled "shared diagonal" state $\begin{bmatrix} \sqrt{0.5} & 0 \\\\ 0 & \sqrt{0.5} \end{bmatrix}$.

**Case 1: Lonely Corner**

When starting in the matrix state $S\_0 = \begin{bmatrix} 1 & 0 \\\\ 0 & 0 \end{bmatrix}$, what kinds of states can we reach by operating independently on the first and second qubits?

I made a little javascript widget for you to experiment with. See what you can reach by rotating and phasing both qubits. In particular, see if you can reach the entangled shared diagonal state:

<canvas id="drawCanvas1" width="400px" height="410px" style="border:1px dotted #BBB;"/>

Alright, enough toying around, let's analyze things algebraically.

If we apply $U\_1 = \begin{bmatrix} a & b \\\\ c & d \end{bmatrix}$ to the first qubit and $U\_2 = \begin{bmatrix} e & f \\\\ g & h \end{bmatrix}$ to the second qubit (we can always merge multiple operations by multiplying them together, so this is w.l.o.g), we'll get:

$S\_f = U\_2 S\_0 U\_1^T$

$= \begin{bmatrix} e & f \\\\ g & h \end{bmatrix} \begin{bmatrix} 1 & 0 \\\\ 0 & 0 \end{bmatrix} \begin{bmatrix} a & c \\\\ b & d \end{bmatrix}$

$= \begin{bmatrix} e & 0 \\\\ g & 0 \end{bmatrix} \begin{bmatrix} a & b \\\\ c & d \end{bmatrix}$

$= \begin{bmatrix} ae & be \\\\ ag & bg \end{bmatrix}$

$= \begin{bmatrix} e \\\\ g \end{bmatrix} \begin{bmatrix} a & b \end{bmatrix}$

We find that 1) two of the four coefficients from each operation get discarded, and that 2) the resulting state matrix can be described with just two complex ratios (plus a global phase factor that doesn't matter). The horizontal ratio is determined by operations on the first qubit, the vertical ratio is determined by the operations on the second qubit, and that's it.

Examples of the kinds of states we can reach include $\begin{bmatrix} \sqrt{0.5} & \sqrt{0.5} \\\\ 0 & 0 \end{bmatrix}$, $\begin{bmatrix} 0.6 & 0.8 \\\\ 0 & 0 \end{bmatrix}$, $\begin{bmatrix} \sqrt{0.5} & 0 \\\\ -\sqrt{0.5} & 0 \end{bmatrix}$, and $\begin{bmatrix} 0.5 & 0.5i \\\\ 0.5i & -0.5 \end{bmatrix}$.

It's impossible to reach the shared diagonal state from the lonely corner state via independent operations, because the shared diagonal state can't be factored into vertical and horizontal ratios.


