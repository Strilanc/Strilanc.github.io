---
layout: post
title: "Using Quantum Gates instead of Ancilla Bits"
date: 2015-06-22 11:30:00 EST
categories: circuits
---

This post is the third, and final, part of an explanation of how to solve the following exercise:

![Exercise 4.29: Find a circuit containing a linear (used to say quadratic) number of Toffoli, CNOT, and single qubit gates which implements a NOT gate with n controls, using no work qubits.](http://i.imgur.com/T72YNVv.png)

In part 1, [Constructing Large Controlled Nots](/circuits/2015/06/05/Constructing-Large-Controlled-Nots.html), we figured out how to do the exercise but with an [ancilla bit](https://en.wikipedia.org/wiki/Ancilla_Bit). Quantum gates were not required.

In part 2, [Constructing Large Increment Gates](/circuits/2015/06/12/Constructing-Large-Increment-Gates.html), we did the same thing (one ancilla bit, no quantum gates) but for increment gates.

In this part, we're going to use quantum gates (and the constructions from the previous two parts) to avoid that pesky ancilla bit.
The basic progression will be as follows:

1. Use the fact that quantum operations have square roots to split operations with many controls into sub-operations with fewer controls.
2. Rewrite operations so that the only controlled operations are NOT gates.
3. Fix smaller and smaller phase errors resulting from the above processes.
4. Re-arrange the resulting mish-mash of controlled-nots into a couple increment and decrement operations.
5. Apply the constructions from the previous parts to reduce the remaining large operations into Toffoli-or-smaller operations.

(*Side note: It's a bit disconcerting to spill eight thousand words on such a short exercise, but I suppose that's the nature of having to explain one level back and noting nearby things instead of just putting the pieces together.*)

# Quantum Operations Have Roots

The fundamental property that will allow us to avoid using an ancilla bit, now that we have access to quantum gates, is that *every quantum operation has a square root and an inverse*.
Given an operation $U$, you can find an operation $\sqrt{U}$ such that applying $\sqrt{U}$ to a circuit *twice* has the same effect as applying $U$ *once*.
Similarly, applying $U$ and then its inverse $U^\dagger$ has the same effect as applying no operation at all.

Classically, not all operations had square roots.
For example, the NOT gate has no classical square root.
There's simply no boolean-to-boolean function $f$ such that $f(f(x)) = \overline{x}$. But, quantumly, the NOT gate *does* have a square root.

Every quantum operation is a [unitary matrix](https://en.wikipedia.org/wiki/Unitary_matrix), and every unitary matrix is a realizable quantum operation.
Unitary matrices always have square roots, and so quantum operations do too.
Let's compute a square root of the NOT gate, just to check that this is actually possible. Start with [its unitary matrix](https://en.wikipedia.org/wiki/Quantum_gate#Pauli-X_gate):

$X = \bimat{0}{1}{1}{0}$

Then compute the [eigenvalues and unit eigenvectors](https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors) of that matrix:

$\lambda\_1 = 1$, $v\_1 = \frac{1}{\sqrt{2}} \begin{bmatrix} 1 \\\\ 1 \end{bmatrix}$

$\lambda\_2 = -1$, $v\_2 = \frac{1}{\sqrt{2}} \begin{bmatrix} 1 \\\\ -1 \end{bmatrix}$

Which gives us the [eigendecomposition](https://en.wikipedia.org/wiki/Eigendecomposition_of_a_matrix) of the NOT gate:

$\bimat{0}{1}{1}{0}
= \lambda\_1 v\_1 v\_1^{\dagger} + \lambda\_2 v\_2 v\_2^{\dagger}
= \lambda\_1 \frac{1}{2} \bimat{1}{1}{1}{1} + \lambda\_2 \frac{1}{2} \bimat{1}{-1}{-1}{1}$

The eigendecomposition form of a matrix is very useful because most functions, when applied to a matrix, correspond to simply transforming the eigenvalues.
To find the square root of the matrix, we simply replace the eigenvalue coefficients with their square roots:

$\sqrt{\bimat{0}{1}{1}{0}}
= \sqrt{\lambda\_1} v\_1 v\_1^{\dagger} + \sqrt{\lambda\_2} v\_2 v\_2^{\dagger}
= \sqrt{1} \frac{1}{2} \bimat{1}{1}{1}{1} + \sqrt{-1} \frac{1}{2} \bimat{1}{-1}{-1}{1}$

And, by arbitrarily picking principal square roots, we find one of the square roots of NOT:

$\rightarrow \frac{1}{2} \bimat{1}{1}{1}{1} + i \frac{1}{2} \bimat{1}{-1}{-1}{1} = \frac{1}{2} \bimat{1+i}{1-i}{1-i}{1+i}$

You can check that squaring $\frac{1}{2} \bimat{1+i}{1-i}{1-i}{1+i}$ does in fact give you $\bimat{0}{1}{1}{0}$.
Turn that matrix into a quantum operation, apply it twice, and it will have the same effect as a NOT operation.

The inverse of a unitary matrix is even easier to find than its square root: simply take the [conjugate transpose](https://en.wikipedia.org/wiki/Conjugate_transpose).
For example, the inverse of the square root of NOT we found ($\frac{1}{2} \bimat{1+i}{1-i}{1-i}{1+i}$) is just $\frac{1}{2} \bimat{1-i}{1+i}{1+i}{1-i}$ (another square root of NOT).

# Removing a Control

Given a gate that is square root of an operation, and also a gate for the inverse of the square root, you can rewrite a controlled operation to use fewer controls.
The construction for doing so is detailed on page 182 of [Nielsen and Chuang's textbook](http://www.johnboccio.com/research/quantum/notes/QC10th.pdf).
Here it is:

![Reducing the maximum number of controls per operation by one, using square roots and inverses](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Reducing_Max_Controls_by_One.png)

Note that, in the above diagram, the top wire is actually a bundle of $n$ wires.
Let's convince ourselves that this control-reducing construction works, by case analysis.
We want there to be no effect if any of the control wires is OFF, but if all of the control wires are ON then the overall effect should be a $U$ applied to the target wire.

- **OFF, OFF**:
If any of the wires in the top wire bundle is OFF, and the middle control wire is OFF, then none of the operations happen.
Clearly this is a no-op.
- **ON, OFF**:
If all of the control wires in the top wire bundle are ON, but the middle control wire is OFF, then the middle wire will be temporarily toggled ON during the $\sqrt{U}^\dagger$ gate but back OFF for the $\sqrt{U}$ gate that depends it.
The $\sqrt{U}$ gate that depends on the top control wires also applies.
The net effect is no effect, because $\sqrt{U}^\dagger \cdot \sqrt{U} = I$.
- **OFF, ON**:
If any of the top wire bundle's wires are OFF, but the middle control wire is ON, then basically the same thing happens as in the **ON, OFF** case.
The $\sqrt{U}^\dagger$ gate applies, but only one of the $sqrt{U}$ gates applies, so they undo each other's effects and nothing happens overall.
- **ON, ON**:
If all of the control wire are ON, then the two $\sqrt{U}$ gates will happen, but the $\sqrt{U}^\dagger$ gate will not occur because the middle wire was temporarily toggled OFF.
So the net effect is $\sqrt{U}^2 = U$ on the target wire.

By case analysis, we see that the control-reducing construction does in fact apply a $U$ if and only if all the controls are ON (and nothing happens otherwise).

# Iteratively Removing Controls Hits a Wall

By nesting the control-reducing construction inside of itself, again and again, we can remove many controls instead of just one:

![Iteratively turning controls into square roots](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Iteratively_Turning_Controls_into_Square_Roots.gif)

Unfortunately, this stops working for the last control.
The construction will still be *correct* when there's one control, in that the resulting circuit will be equivalent to the input circuit, but we won't end up with a circuit using no controls:

![The Last Control Survives](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Last_Control_Survives.png)

This is a problem, because the surviving controls are on gates that aren't NOT gates, and according to the exercise we aren't allowed to do that.

We will definitely need to apply the control-reducing construction once, because we need an uninvolved bit in order to apply the constructions from the last two parts.
However, after that single application, we should switch to a construction that moves controls off of quantum gates and onto NOT gates.

# Moving Controls to NOT Gates

It's possible to factor a controlled quantum operation into pieces that only have controls on NOT gates.
The overall idea is to find matrices $A$, $B$, and $C$, plus a phase factor $e^{i\theta}$, such that $e^{i\theta} A \cdot X \cdot B \cdot X \cdot C = U$ and $A \cdot B \cdot C = I$, because then you can do this:

![Moving Controls to NOT Gates](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Moving_Controls_to_NOT_Gates.png)

There's a mechanical procedure for finding an appropriate set of $A$, $B$, $C$, and $\theta$ from a given $U$, but explaining how takes a lot of words.
If you're curious, see pages 176, 180, and 181 of [the textbook](http://www.johnboccio.com/research/quantum/notes/QC10th.pdf).
For the purposes of this post, I'll simply provide $A$, $B$, $C$, and $\theta$s that work.

We'll only be working with the roots of $X$ gates, and $Z$ gates, and they can be split as follows.
Note that, by $\sqrt[n]{Z}$, I always mean $\bimat{1}{0}{0}{e^{i \pi 2^{-n}}}$ instead of any of the other $n$'th roots of $Z$.

For [phase shift gates](https://en.wikipedia.org/wiki/Quantum_gate#Phase_shift_gates), i.e. Z-axis rotations, moving controls onto NOT gates is relatively simple.
You phase shift each of the two wires by half as much, phase shift in the opposite direction (also by half as much) when the wires differ, and that's all:

![Moving Controls off of Z axis Rotations](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Moving_Controls_off_of_Z_axis_Rotations.png)

To turn the Z-axis rotation construction into an X-axis rotation construction, we use the fact that bracketing with [Hadamard gates](https://en.wikipedia.org/wiki/Quantum_gate#Hadamard_gate) transforms X rotations into Z rotations, and vice versa:

![Moving Controls off of X axis Rotations](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Moving_Controls_off_of_X_axis_Rotations.png)

It's easiest to apply the Hadamard bracketing one time at the very top level before we've even applied the control-reducing construction, instead of doing it as part of each transformation we make to the circuit.

# Iterative Phase Corrections

The control-moving construction from the previous part has a problem: the top wire has an operation on it, instead of just controls.
When there are more control wires, that new operation (which is not a NOT) becomes a controlled operation:

![Leftover Phase Correction from Moving Controls](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Leftover_Phase_Correction_from_Moving_Controls.png)

Fortunately, because the new operation has one fewer control than the original operation, fixing the problem is just a matter of repeating the procedure again and again.
Eventually the resulting phase correction will have no controls:

![Iteratively moving controls from phase gates to not gates](http://i.imgur.com/VeWntBu.gif)

The start and end states:

![Moving Many Controls from a Z-axis Rotation to NOTs](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Moving_Many_Controls_from_a_Z_axis_Rotation_To_NOTs.png)

With the control-reducing and control-moving constructions figured out, we can start simplifying the large number of controlled-nots that came out of the repeated applications.

# Re-arranging into Increments

Starting from the result of iteratively moving controls from phase shift gates to NOT gates, we can simplify things by re-arranging the NOT gates.

Because phase shift gates don't affect whether or not a wire is ON on their own, we can move controlled-nots over them as long as the phase shift only touches the controls.
We can move controlled-NOTs over other controlled-NOTs under the same conditions, as long as the other controlled-NOT happens twice.
This freedom of movement is what we will use to simplify things:

![Merging controlled nots into an increment and decrement](http://i.imgur.com/dZTXUWu.gif)

The above movements rewrite the mish-mash of controlled-NOTs and phase shifts into a quite compact form, with a sweep of phase shift gates inside and outside of an area where the wires have been temporarily incremented:

![From Controlled Phase Shift to Incremented Phase Shifts](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/From_Controlled_Phase_Shift_to_Incremented_Phase_Shifts.png)

Let's consider why this incremented phase shifts construction acts like a controlled phase shift.
Think of each phase shift gate as adding or subtracting some value from a global counter, but the gate only fires when the wire the phase shift gate is on is ON:

![Incremented Shifts Pattern](/assets/2015-06-23-Using-Quantum-Gates-instead-of-Ancilla-Bits/Incremented_Shift_Pattern.png)

Note that the phase shift gates on each individual wire will undo each other, except for the top-most wire.
Also note that each phase shift gate inside the increment and decrement gates subtracts an amount equal to the sum of the amounts added by the phase shift gates that are higher-up and outside the increment and decrement gates.

Suppose the $k$'th wire is OFF, and all the wires for lesser bits are ON.
Then every wire up to and including the $k$'th wire will get toggled by the increment gates, the inside gate on the $k$'th wire will fire, and the outside gates on the lower bit wires will fire.
But the inside gate of the $k$'th subtracts the same amount that all of the outside gates on the lesser wires add.
Therefore the phase shift gates on the wires up to and including the first OFF bit have no net effect.

Suppose the $k$'th wire is OFF, but some lower bit wire is also OFF.
Then the increment's carry propagation will stop before reaching the $k$'th wire, and it will not be toggled.
Therefore the the phase shift gates on the $k$'th wire will either both fire, undoing each other, or neither will fire.
So the phase shift gates on wires *after* the first OFF bit have no net effect.

Together, the previous two paragraphs show that if there is *any* OFF bit, nothing happens.
Phase shift gates on each wire after the off-but will undo themselves, and the phase shift gate on that first OFF wire will undo the phase shift gates on previous wires.

That just leaves the case where all the bits are ON.
Incrementing the all-ON state gives the all-OFF state.
Therefore none of the inside gates will fire, but all of the outside gates will fire.
The sum of the outside gates is $a + a + 2a + 4a + ... + 2^{n-1}a$ where $n$ is the number of involved wires, meaning the net effect of the is to add $2^n a$ to the global counter.

So, by setting $a$ to $\frac{1}{2^n}$'th of the phase shift we want, the incremented phase shift construction acts like a controlled phase shift gate.

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

# Exponentially Precise Gates

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

