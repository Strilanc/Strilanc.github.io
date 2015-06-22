---
layout: post
title: "Using Quantum Gates instead of Ancilla Bits"
date: 2015-06-22 11:30:00 EST
categories: circuits
---

This post is part 3 of solving the following exercise:

![Exercise 4.29: Find a circuit containing a linear (used to say quadratic) number of Toffoli, CNOT, and single qubit gates which implements a NOT gate with n controls, using no work qubits.](http://i.imgur.com/T72YNVv.png)

In part 1, [Constructing Large Controlled Nots](/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html), we figured out how to do the exercise but with an ancilla bit. Quantum gates were not required.

In part 2, [Constructing Large Increment Gates](/circuits/2015/06/12/Constructing-Large-Increment-Gates.html), we did the same thing (one ancilla bit, no quantum gates) but for increment gates.

In this part, we're going to use quantum gates (and the constructions from the previous two parts) to avoid that pesky ancilla bit.

# Quantum Operations Have Roots

Every quantum gate $U$ has a square root $\sqrt{U}$ and an inverse $U^\dagger$. Applying $\sqrt{U}$ twice has the same effect as applying $U$ once. Applying both $U$ and $U^\dagger$ is the same as applying no operation at all.

Classically, not all operations have square roots. A good example is the NOT gate. There's simply no single-boolean-to-single-boolean function $f$ such that $f(f(x)) = \overline{x}$.

Quantumly, the NOT gate does have a square root. Every quantum operation is a [unitary matrix](https://en.wikipedia.org/wiki/Unitary_matrix), and every unitary matrix is a quantum operation, and unitary matrices always have square roots.

I'll do a worked example, just to convince you that these square roots actually exist. To compute the square root of the NOT gate, we simply start with [its unitary matrix](https://en.wikipedia.org/wiki/Quantum_gate#Pauli-X_gate):

$X = \bimat{0}{1}{1}{0}$

Then compute the [eigenvalues and unit eigenvectors](https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors) of that matrix:

$\lambda\_1 = 1$, $v\_1 = \frac{1}{\sqrt{2}} \begin{bmatrix} 1 \\\\ 1 \end{bmatrix}$

$\lambda\_2 = -1$, $v\_2 = \frac{1}{\sqrt{2}} \begin{bmatrix} 1 \\\\ -1 \end{bmatrix}$

Which gives us the [eigendecomposition](https://en.wikipedia.org/wiki/Eigendecomposition_of_a_matrix) of the NOT gate:

$\bimat{0}{1}{1}{0}
= \lambda\_1 v\_1 v\_1^{\dagger} + \lambda\_2 v\_2 v\_2^{\dagger}
= \lambda\_1 \frac{1}{2} \bimat{1}{1}{1}{1} + \lambda\_2 \frac{1}{2} \bimat{1}{-1}{-1}{1}$

The eigendecomposition is incredibly convenient, because most functions that you apply to a matrix correspond to simply transforming the eigenvalue coefficients with said function.
The square root is no exception:

$\sqrt{\bimat{0}{1}{1}{0}}
= \sqrt{1} \frac{1}{2} \bimat{1}{1}{1}{1} + \sqrt{-1} \frac{1}{2} \bimat{1}{-1}{-1}{1}$

And, by arbitrarily picking principal square roots, we find one of the square roots of NOT:

$\rightarrow \frac{1}{2} \bimat{1}{1}{1}{1} + i \frac{1}{2} \bimat{1}{-1}{-1}{1} = \frac{1}{2} \bimat{1+i}{1-i}{1-i}{1+i}$

You can check that squaring $\frac{1}{2} \bimat{1+i}{1-i}{1-i}{1+i}$ does in fact give you $\bimat{0}{1}{1}{0}$.
Apply this quantum operation twice, and you get a NOT.

The inverse of a unitary matrix is even easier to find: simply take the [conjugate transpose](https://en.wikipedia.org/wiki/Conjugate_transpose) of the matrix.
For example, the inverse of the square root of NOT $\frac{1}{2} \bimat{1+i}{1-i}{1-i}{1+i}$ is just $\frac{1}{2} \bimat{1-i}{1+i}{1+i}{1-i}$ (another square root of NOT).

Because quantum operations have square roots, we can often break them into smaller sub-pieces.
For example, we can use the square roots of a gate to decrease the maximum number of controls needed to simulate that gate.

# Removing a Control

Page 182 of [Nielsen and Chuang's textbook](http://www.johnboccio.com/research/quantum/notes/QC10th.pdf) has the following construction, which turns an operation with $n+1$ controls into several operations with $n$ controls by using square roots and inverses:

![Removing a control using square roots and inverses](http://i.imgur.com/vlVVCtj.png)

Let's make sure this works works by going through the cases.
We want there to be no effect if any of the control wires is OFF, and for a $U$ to be applied if all the control wires are ON.

- If all of the control wires are OFF, then none of the operations happen.
Clearly this is a no-op.
- If the top control wire(s) are all ON, but the middle control wire is OFF, then the $\sqrt{U}^\dagger$ gate will happen but one of the $sqrt{U}$ gates won't.
The net effect will be $\sqrt{U} \cdot \sqrt{U}^\dagger = I$, i.e. a no-op.
- If any of the top control wire(s) is OFF, but the middle control wire is ON, then basically the same thing as the last case happens. The $\sqrt{U}^\dagger$ gate happens and only one of the $sqrt{U}$ gates happens, and they undo each other for a net no-op.
- If the top control wire(s) are all ON, and the middle control wire is ON, then the two $\sqrt{U}$ gates will happen, but the $\sqrt{U}^\dagger$ gate will not occur because the middle wire was temporarily toggled OFF.
So the net effect is $\sqrt{U}^2 = U$ on the target wire.

Therefore the construction is correct.

By nesting this construction inside of itself, again and again, we can iteratively reduce the number of controls being used:

![Iteratively replacing controls with square roots](http://i.imgur.com/exGpJur.gif)

Unfortunately, we will hit a wall once we get down to one control.
The construction will still be *correct*, in that the resulting circuit will be equivalent to the input circuit, but we won't reduce the number of controls by one:

![The Last Control Survives](http://i.imgur.com/I4EjWKP.png)

This is a problem, because the surviving controls are on gates that aren't NOT gates, and according to the exercise we aren't allowed to do that.
We can have special gates, but they need to be single-qubit gates instead of controlled gates.

Fixing this problem requires a second construction.

# Moving a Control

The trick to removing controls from a fancy gate $U$ is to factor it into three pieces $A$, $B$, and $C$ plus a phase factor $e^{i\theta}$ such that $e^{i\theta} A \cdot X \cdot B \cdot X \cdot C = U$ but $A \cdot B \cdot C = I$.
It's always possible to do this, and there's an mechanical way to do it, but it's a bit complicated to explain.
If you're curious, see pages 176, 180, and 181 of [the textbook](http://www.johnboccio.com/research/quantum/notes/QC10th.pdf).

Once you've factored your gate $U$ into $A$, $B$, $C$, and $e^{i\theta}$ you can apply this construction:

![Moving Controls to the Nots](http://i.imgur.com/BS14Dti.png)

We'll only be working with the roots of $X$ gates, and $Z$ gates, so I'll just give the solution for those:

![Moving Controls off of X and Z Roots](http://i.imgur.com/q8I6sT6.png)

(Note that, in this post, $\sqrt[n]{Z}$ will always to refer to $\bimat{1}{0}{0}{e^{i \pi 2^{-n}}}$ instead of any of the other $n$'th roots of $Z$.)

An important fact to know, exemplified by the above diagram, is that surrounding a $Z$ rotation with Hadamard operations turns it into the equivalent $X$ rotation (and vice-versa).
So, because moving controls off of roots of Z creates fewer intermediate gates than moving controls off of roots of X, we might as well just work entirely in Z-land and then switch to X-land only at the outside.

The control-moving construction also works when there are multiple controls, but it has the unfortunate side effect of creating gates with controls so you have to apply it iteratively:

![Iteratively moving controls from phase gates to not gates](http://i.imgur.com/VeWntBu.gif)

It seems like anytime we apply these constructions iteratively, we create a series of increasingly smaller controlled-nots.
Is there a way to simplify them?

# Increment Style

By starting with the result of iteratively moving controls from phase gates to not gates, we can turn the NOTs into increments:

![Merging controlled nots into an increment and decrement](http://i.imgur.com/dZTXUWu.gif)

Finally, we get this:

![Controlled Z Root from Increments](http://i.imgur.com/Q8urtNK.png)

Let's think for a moment about why the above circuit works.

Suppose the $k$'th wire is OFF, and all the wires for lower bits are ON.
Then every wire up to and including the $k$'th wire will get toggled by the increment gates, the inside gate on the $k$'th wire will fire, and the outside gates on the lower bit wires will fire.
But the inside gate of the $k$'th wire is equal to the inverse of the product of the outside gates on the lower wires.
Therefore the is no effect on the wires up to and including the first OFF bit.

Suppose the $k$'th wire is OFF, but some lower bit wire is also OFF.
Then the $k$'th wire will not be toggled.
Therefore there is no effect on wires after the first OFF bit either.
If there is *any* OFF bit, nothing happens.

That just leaves the case where all the bits are ON.
Every bit will toggle to be OFF for the inside gates, meaning they have no effect, and ON for the outside gates.
The product of all of the outside gates is $Z^{\frac{1}{32}+\frac{1}{32}+\frac{1}{16}+\frac{1}{8}+\frac{1}{4}} = Z^{\frac{1}{2}$.

Therefore the above circuit adjust the phase of the all-ON state by $i$, and has no effect on any other state.

# Putting it All Together

Start with a controlled-Z that depends on every wire, reduce the maximum number of controls by one by applying the square root construction, then iteratively move the controls onto NOT gates, then re-arrange things into increments, and you get:

![Controlled-Z reduced to single-qubit operations and controlled NOTs leaving at least one borrowed ancilla bit free](http://i.imgur.com/gVaSljr.png)

Let's go over the cases to be sure.
We know that the increment-decrement part acts like a controlled-$\sqrt{Z}$.
It adds a phase factor of $i$ to the `ON, ON, ON, ON, ON, ON` and `ON, ON, ON, ON, ON, OFF` states.
The starting part is arranged so that it undoes itself if any of the control bits are off.
When all the control wires are ON, and the target wire is OFF, both $\sqrt{Z}^\dagger$ gates fire and the `ON, ON, ON, ON, ON, OFF` state gains a phase factor of $-i$.
When all the wires are ON, both $\sqrt{Z}$ gates fire and the `ON, ON, ON, ON, ON, ON` state gains a phase factor of $i$.

Because $i^2 = -1$ and $i \cdot -i = 1$, the net effect of the combined circuit is to add a phase factor of $-1$ to the `ON, ON, ON, ON, ON, ON`.
Therefore this is a controlled-Z operation that depends on every wire.

We can turn the controlled-Z into a controlled-X by surrounding the bottom wire with Hadamard gates.
We can reduce the large controlled-nots and increments into a linear number of Toffoli-or-smaller gates by using the constructions from the last two posts (use the uninvolved wire as the borrowed ancilla bit).

This solves the exercise.
I'd show a full example, if it weren't for the fact that the construction for $n$ controls uses something like $\tilde 100 n$ Toffoli gates.
(The increment construction uses $\tilde 32n$, and we have two large increments. Also the controlled-not construction uses $\tilde 16n$ and we have two of those...)

# Avoiding Small Gates

When I look at my solution, the first through that jumps to mind is "can I avoid using exponentially small gates?".
This is bad, because in practice you only have a finite gate set.
It's possible to *approximate* exponentially small gates, by using irrational rotations, but I'd like an *exact* solution.

I lost a lot of time trying to make this work without the exponentially small phase gates.
I found *some* interesting things.

Just *not doing* the phase correction gives you the operation $e^{i Z \pi / 2}$.

![Operation that doesn't need ever smaller phase corrections](http://i.imgur.com/1rggl3f.png)

If you apply *two* full-controlled operations, you can have the phase errors cancel each other out:

![Cancelling Phase Corrections with a Second Controlled Operation](http://i.imgur.com/PidIy8k.png)

If your controlled operation is a $p$'th root of the identity matrix, and $p$ is not even, then you can do it.
For example, $Z^{2/3}$ is a cubic root of the identity matrix and is its own fourth root.
Because it is its own fourth root, you can use a cycle the phase corrections instead of an ever decreasing sequence:

![Operation with Cycling Corrections](http://i.imgur.com/0qKbqhx.png)

If we're only allowed to apply NOT gates to the control wires, it is definitely impossible.
Think of each possible state as having a phase counter, and $Z$ gates increase the counter.
The counter wraps around after doing a full turn.

Suppose we have $n$ wires and the counters range from $0$ to $m$.
An uncontrolled $Z$ gate will increase $2^{n-1}$ of the $2^n$ counters by $\frac{m}{2}$.
A $\sqrt{Z}$ gate with two controls will increase $2^{n-3}$ of the counters by $\frac{m}{8}$.
In general, a $\sqrt[p]{Z}$ gate with $c$ controls will increase $2^{n-1-c}$ of the counters by $\frac{m}{2p}$.

Our goal is to make a $Z$ with $n-1$ controls, meaning we want to increase $1$ of the counters by $\frac{m}{2}$.
But if our most precise $Z$ gate is fixed at some constant $\sqrt[p]{Z}$, then the smallest amount we can add into the counters is $2^{n-1} \cdot \frac{m}{2p}$.
Unless $m$ is coprime to $2p$, which it can't be if we can add $\frac{m}{2}$ into one of the counters, we can't get to the right equivalence class!

I suspect that you actually can't do this exactly without exponentially small gates.
Partial rotations tend not to cancel each other out.

(Side note: this is an alternative way to do the halving from before. Put half of the controls on the Zs and the other half on the Xs. Put hadamard gates on the control wire that you want to be the target wire. It seems much more elegant to me.)

# Summary

Unlike classical computers, quantum computers don't need an ancilla bit to perform a controlled NOT that depends on every wire.
However, exponentially precise single qubit gates are required if the operation is going to be done exactly instead of approximately.

It's significantly cheaper to just have the extra working bits available.
If you have $n$ zeroed ancilla bits available to use, you can perform the controlled-not with $\tilde 2n$ Toffoli gates.
The you have no ancilla bits available, it takes more like $\tilde 100n$.

