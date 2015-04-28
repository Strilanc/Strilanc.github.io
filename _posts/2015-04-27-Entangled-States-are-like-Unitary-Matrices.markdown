---
layout: post
title: "Entangled States are like Unitary Matrices"
date: 2015-04-25 11:30:00 EST
categories: quantum
---

Quantum entanglement is legendarily anti-intuitive. Learning the actual math behind entanglement is infinitely more enlightening than reading or watching pop-sci expositions about it... but you're still left with the question of how to think about entanglement *usefully* when solving problems.

In this post, I describe one trick for thinking about entanglement. It is not an original trick, but I half-stumbled onto it on my own so I'm going to explain it anyways.

**Representing Qubits**

One of the hobby programs I work on from time to time is a quantum circuit simulator. It lets you drag and drop quantum gates onto a circuit, and shows representations of the output state (among other things).

Every quantum system is described by a bunch of complex weights, one for each basis state. You need $2^n$ weights to describe a system with $n$ qubits, because it has $2^n$ basis (i.e. classical) states. This makes visually representing quantum states with more than a few qubits difficult, because there's *so many numbers*.

The first thing I tried, for visually representing the weights of the circuit's output in my simulator, was just a column vector. Each complex number was represented with an oriented circle, and I arranged them vertically in binary order (i.e. from $\ket{0000}$ to $\ket{1111}$). This was problematic, even with just four qubits. Not only was it hard to figure out which weight was where, the available space was used poorly due to the column being thin. So I re-arranged the column into a grid.

Arranging things into a grid turned out better than I expected. Suddenly, operations on half of the qubits had row-wise effects while operations on the other half had column-wise effects. I started using this as a mnemonic tool. When playing with circuits that involved two parties, I'd make distinguishing Alice's effects from Bob's effects easy by giving Alice the row-wise qubits and Bob the column-wise qubits.

Eventually, I noticed that the state grid acted kind of like a matrix. If I had just created an entangled pair of qubits, and applied a gate to one of the qubits, the state would look like the matrix for that gate! And adding another gate multiplied the "matrix" by the next gate (sortof)! I even got some use out of this: it helped me guess what [symmetry breaking would look like](http://strilanc.com/quantum/2014/12/06/Perfect-Symmetry-Breaking-with-Quantum-Computers.html).

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

Personally, I find it fascinating and useful that the operations simplify like that. Thinking about the simplified operations makes it dead obvious why operations on different qubits must commute (they're accumulating on opposite sides). It also makes it much easier to reason about the states you can reach from some starting state... in fact, let's do that. Let's consider how the single-qubit operations behave when starting from two different states: an unentangled classical "lonely corner" state $\begin{bmatrix} 1 & 0 \\\\ 0 & 0 \end{bmatrix}$ and a completely entangled "shared diagonal" state $\begin{bmatrix} \sqrt{0.5} & 0 \\\\ 0 & \sqrt{0.5} \end{bmatrix}$.

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

**Case 2: Shared Diagonal**

Now let's try starting from the matrix state $S\_0 = \begin{bmatrix} \sqrt{0.5} & 0 \\\\ 0 & \sqrt{0.5} \end{bmatrix}$ and exploring.

If you check closely, you'll notice the system behaves differently in a lot of little ways. For example, there are still states where having both qubits rotating doesn't change the size of the circles much... but they're in a different place than they were in the lonely corner case (finding them is left as an exercise for the reader):

<canvas id="drawCanvas2" width="400px" height="410px" style="border:1px dotted #BBB;"/>

Let's analyze the situation algebraically, again. We apply $U\_1$ to the first qubit and $U\_2$ to the second qubit. We get:

$S\_f = U\_2 S\_0 U\_1^T$

$= U\_2 \begin{bmatrix} \sqrt{0.5} & 0 \\\\ 0 & \sqrt{0.5} \end{bmatrix} U\_1^T$

$= U\_2 \sqrt{0.5} I U\_1^T$

$= \sqrt{0.5} U\_2 U\_1^T$

Well, that's interesting. The starting state is a unitary matrix (times $\sqrt{0.5}$), and all the operations correspond to multiplying the state by a unitary matrix, so the final state is also going to be a unitary matrix (times $\sqrt{0.5}$).

Unlike in the lonely corner case, none of the operations' matrix coefficients are being discarded. Also, the effects of the operations are no longer orthogonal. Instead of one qubit controlling the horizontal, and the other the vertical, they both control it all. Anything Alice does to the first qubit, Bob can undo by applying the appropriate counter-operation to the second qubit. Or Bob can apply the same effect as Alice, effectively squaring the operation. Or Alice, if she knows what Bob will do, can put the system into any (unitary) final state she desires.

Given the above facts, what's something interesting we might be able to do in the shared diagonal case that we couldn't do in the lonely corner case? The first thing that jumps to my mind is that Alice can put *four* numbers into the state now, instead of *two*. That might let us encode more information... wait, that's [superdense coding](http://en.wikipedia.org/wiki/Superdense_coding)! Neat.

**Conclusions and Notes**

In 2 qubit non-entangled systems, the state acts like a matrix made by combining two complex ratios. The ratios are controlled independently and orthogonally by operations on either side.

In 2 qubit entangled systems, the state acts like a unitary matrix. All of the matrix coefficients are controlled by both sides, with overlapping effects. You can move effects between sides, if it's convenient, when designing circuits. Sides can undo or square each others' effects.

Systems that are partially entangled, e.g. $\begin{bmatrix} 0.8 & 0 \\\\ 0 & 0.6 \end{bmatrix}$, can be understood as a linear combination of non-entangled and entangled. The non-entangled and entangled states are kind of like "Singular-Value-Decomposition basis states". Larger systems, with multiple qubits per party (but still just two parties), have more SVD basis states. The SVD is useful as a measure of entanglement because unitary operations preserve it.

This all breaks down if you have more than two parties.

<script src="/assets/2015-04-27-Entangled-States-are-like-Unitary-Matrices.js"></script>

