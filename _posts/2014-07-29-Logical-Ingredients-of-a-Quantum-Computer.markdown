---
layout: post
title: "Logical Ingredients of a Quantum Computer"
date: 2014-07-29 11:30:00 EST
categories: quantum-computing
---

In classical computers, some sets of basic operations are [functionally complete](http://en.wikipedia.org/wiki/Functional_completeness). By combining and recombining operations from such a set, you can make *any* operation. You don't even need a large set of operations, because the [NAND gate is functionally complete all by itself](http://en.wikipedia.org/wiki/NAND_logic)!

Does this also hold for quantum computers? Can every possible quantum operation be reduced to a common set of ingredients? [Well, sort of.](http://en.wikipedia.org/wiki/Quantum_gate#Universal_quantum_gates) The space of possible quantum operations is actually continuous, and we're asking for a discrete set of operations, so the cardinalities won't quite match up. However, we can *approximate* arbitrary quantum operations to whatever accuracy is needed, using only a few types of gates.

In this post, I'll review the controlled-not, Hadamard, and 45° phase gates and briefly cover why they form a universal quantum gate set. I like this particular gate set because a few of the tricky concepts required to understand quantum computing get distributed somewhat evenly amongst the gates. Roughly speaking: the CNOT gate controls measurement and entanglement, the Hadamard gate controls superposition, and the phase gate controls interference.

**The Controlled-Not Gate**

The controlled not (CNOT) gate applies to two qubits: a target and a control. If the control qubit is $\text{true}$, the target qubit is toggled between $\text{true}$ and $\text{false}$. If the control qubit is $\text{false}$, nothing happens. Importantly, *the gate works even when qubits are in superposition or entangled*: the target qubit is inverted only in the parts of the superposition where the control qubit is set.

Suppose we're CNOT-ing $q\_1$ into $q\_2$ (meaning $q\_1$ is the control and $q\_2$ is the target). If the state of the system is $\left| q\_1=\text{false}, q\_2=\text{false} \right> - \left| q\_1=\text{true}, q\_2=\text{true} \right>$ then CNOT-ing $q\_1$ into $q\_2$ changes the state to $\left| q\_1=\text{false}, q\_2=\text{false} \right> - \left| q\_1=\text{true}, q\_2=\text{false} \right>$.

The CNOT gate's role in this gate set is *interaction*. Without it, you're just doing a bunch of single-qubit computations. You wouldn't even be able to do interesting classical computations, nevermind entangling qubits. (One way you might simplify this gate set, at least pedagogically, is by replacing the CNOT gate with a [CCNOT gate](http://en.wikipedia.org/wiki/Toffoli_gate). That would allow all the classical stuff to be done by one gate.)

I find the CNOT gate *philosophically* interesting because understanding its effects basically amounts to understanding quantum measurement. Measuring a qubit has *exactly* the same effects on a quantum computation as CNOT-ing that qubit into some otherwise-unused-by-the-computation qubit. Whether or not this resolves the [measurement problem](http://en.wikipedia.org/wiki/Measurement_problem) in quantum mechanics is debatable, since taking it literally basically amounts to the [MWI](http://en.wikipedia.org/wiki/Many-worlds_interpretation), but there's definitely insight to be had here. (Still waiting for a chance to use the tongue-in-cheek line "You see, consciousness is basically an unused qubit..." on someone who thinks consciousness causes collapse.)

**The Hadamard Gate**

The Hadamard gate is applied to single qubits, and is used to create and interfere superpositions. If the target qubit's state is $\left| \text{false} \right>$, applying a Hadamard gate changes its state to $\left| \text{false} \right> + \left| \text{true} \right>$. If the target qubit's state is $\text{true}$, the state changes to $\left| \text{false} \right> - \left| \text{true} \right>$ instead (see the difference?). Once again, when the qubit is in superposition, you apply the gate to each part of the superposition separately.

For example, to evaluate $H(\left| \text{false} \right> - \left| \text{true} \right>)$, we apply the $H$ to each part like $H(\left| \text{false} \right>) - H(\left| \text{true} \right>)$, which expands to $(\left| \text{false} \right> + \left| \text{true} \right>) - (\left| \text{false} \right> - \left| \text{true} \right>)$, and that simplifies to $2 \left| \text{true} \right>$, which is actually $\left| \text{true} \right>$ when you don't completely leave out the normalizing factors of $\sqrt{\frac{1}{2}}$ like I've been doing.

Not surprisingly, the role of the Hadamard gate in this gate set is *superposition*. Without it, you're just doing a classical computation. Actually, you're not even doing that because the CNOT gate is not functionally complete classically and phase gates literally do nothing of any consequence if you can't cause interference. So the Hadamard gate is pretty crucial to this set.

**45° Phase Gate**

Like the Hadamard gate, the 45° phase gate applies to single qubits. But it has a much simpler function: changing the relative phase between the amplitudes of the $\left| \text{false} \right>$ and $\left| \text{true} \right>$ states of a qubit. It does this by doing nothing to the qubit when it's $\text{false}$, but multiplying its amplitude by $\frac{1+i}{\sqrt{2}}$ when the qubit is $\text{true}$.

An example. We can evaluate $P\_{45°}(\left| \text{false} \right> - \left| \text{true} \right>)$ by doing the usual apply-to-single-components thing to get $P\_{45°}(\left| \text{false} \right>) - P\_{45°}(\left| \text{true} \right>)$, and that evaluates to $\left| \text{false} \right> - \frac{1+i}{\sqrt{2}} \left| \text{true} \right>$.

The role of the 45° degree phase gate is *controlling interference*. The Hadamard gate interferes things, but the phase gate affects whether that interference is constructive, destructive, or something in between. This is actually really important because, without this control, we lose a lot of power. If we remove the 45° phase gate from the set, or even if we replace it with the 90° phase gate, we end up limited to what's known as [stabilizer circuits, which can be simulated efficiently classically](http://en.wikipedia.org/wiki/Gottesman%E2%80%93Knill_theorem).

**Universality**

At a high level, showing that the CNOT/Hadamard/45° gate set is universal is done in two steps.

First, we determine that the Hadamard and 45° gates can approximate any single-qubit operation. This is actually really easy to demonstrate, because every single-qubit operation [corresponds to a rotation in 3d](http://en.wikipedia.org/wiki/Pauli_matrices). The Hadamard operation is a 180° rotation around the X+Z axis, or equivalently a 90° rotation around the X then Z then X axies. The 45° degree phase gate is a 45° rotation around the Z axis.

(You might think it's funny that I bothered repeating that 45°, or that I've been avoiding radians, but I think it's funny that [Wikipedia says](http://en.wikipedia.org/wiki/Quantum_gate#Phase_shift_gates) an example of a phase gate is "the $\frac{\pi}{8}$ gate, where $θ = \frac{\pi}{4}$". And *that's the correct definition*.)

Grab something cube-shaped and, with a bit of experimentation, you can see that combining those two rotations lets you make all kinds of other rotations. You can get arbitrarily close to any target rotation, although you may need a long sequence of the two allowed rotations. (You can also check that the 90° phase gate is less powerful than the 45° phase gate here, because there's no way to end up with a tilted cube!)

Second, we need to factor quantum operations into single-qubit operations and CNOTs. Every quantum operation corresponds to a [unitary matrix](http://en.wikipedia.org/wiki/Unitary_matrix), so this ends up being really similar to the way you break a matrix down into scaling, swapping, and adding rows when inverting it by [Gaussian elimination](http://en.wikipedia.org/wiki/Gaussian_elimination). You may end up with exponentially many factors, because these matrices are exponentially huge, but you can [always](http://staffhome.ecm.uwa.edu.au/~00043886/humour/invalid.proofs.html#1.3Proofbyvigoroushandwaving) do the factoring.

Factoring causing an exponential blowup in the number of operations is a bit troubling, but actually the same thing happens with classical circuits. Classically, there are $2^{(2^N)}$ operations that take $N$ bits as input and return a single bit of output, but there are only $\approx G^G$ ways to wire $G$ NAND gates together. We're trying to match a super-exponential in $N$ with an exponential in $G$, so $G$ ends up having to be exponentially large in the worst case. The blowup is *worse* in the quantum case, but not *new*. (In a sense, these blowups are the only reason computational complexity exists as a discipline.)

**Summary**

Every quantum operation can be approximately factored into 45° phase, CNOT, and Hadamard operations.

Measurement and entanglement are controlled-nots in disguise, superposition and interference are Hadamard operations in disguise, and *complicated* interference is phase gates in disguise.

(*Author's Note: Sorry if this post is a bit too fast for people with no exposure to quantum computing, yet too simple for people who already know the basics. It could also use a little playground where you hit the three operations against a quantum state... but writer's block is a hell of a thing.*)
