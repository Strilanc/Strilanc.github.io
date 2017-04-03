---
layout: post
title: "Turning Detection into Correction with Quantum Teleportation"
date: 2016-12-12 12:10:10 pm EST
permalink: post/1631
---

Suppose we were in a world with good quantum computers, but not-so-good quantum networks.
Where qubits lived long malleable lives in the cool safety of dilution refrigerators, interspersed with torrid journeys through noisy fiber optic cable.

In that world, what kinds of strategies would be used to make sending qubits more reliable?
An obvious answer is [quantum error correcting codes](https://en.wikipedia.org/wiki/Quantum_error_correction), but I want to discuss a slight twist on that concept.
One based on the fungibility of EPR pairs and the ubiquity of classical communication.

# The Setup

Imagine Alice has sixteen qubits of important quantum information.
She wants to move these qubits to Bob.
However, the two are separated by eight lossy networks hops:

    A ~> 1 ~> 2 ~> 3 ~> 4 ~> 5 ~> 6 ~> 7 ~> B

Each hop will detect when a loss occurs, but losses occur a *lot*.
Each qubit sent over a hop has a **10%** chance of being ruined.
That means the odds of a qubit surviving all eight hops is roughly 40%, and the entire message surviving the trip would be a one in a million miracle.

Our goal is to come up with a strategy to fix this reliability problem.
We want to be able to get the qubits across the network with near certainty, instead of failing with near certainty.

If we were sending a classical message, this problem would be trivial.
We're told when part of the message doesn't arrive, so we can just resend resend resend.
*Eventually* we'd succeed.
But quantum information [can't be copied](https://en.wikipedia.org/wiki/No-cloning_theorem), so we can't have backups copies for retrying.
If we send the message and it's lost, it's *really lost*.

If we want to be able to send-and-retry, we need some kind of loophole in the no-cloning theorem.
For example, if the qubits-to-be-cloned are  the result of a computation, then we can produce a copy by simply performing the computation again.
The no-cloning theorem only applies when we don't know *anything* about the qubits, including details like "it was produced by computation X".
Another example of a reproducible state, and the one we'll be using, is fresh EPR halves.

An EPR half is a qubit that's part of an [EPR pair](https://en.wikipedia.org/wiki/Bell_state).
An EPR pair is two qubits in the entangled state $\frac{1}{\sqrt 2} |00\rangle + \frac{1}{\sqrt 2}|11\rangle$.
EPR pairs are easy to make: take two qubits in the $|0\rangle$ state, hit one of them with a [Hadamard](https://en.wikipedia.org/wiki/Quantum_gate#Hadamard_gate), then [CNOT](https://en.wikipedia.org/wiki/Controlled_NOT_gate) that qubit onto the other one.
EPR pairs are also *fungible*, like money.
If you send me a dollar in the mail, and the letter gets lost, you can just try again and mail another dollar.
It doesn't matter to me *which* dollar you send.
Analogously, if you send me an EPR half (1 bit of entanglement) and it gets lost, you can just send another EPR half.
We end up with a bit of entanglement either way.

What this all means is that Alice can reliably build up entanglement with Bob, even over the lossy network.
She just keeps producing EPR pairs and sending one of the EPR halves to Bob.
If one of the halves is lost is transit, she tosses her local corresponding half and tries again.

Once Alice and Bob are entangled, the game is over.
We can burn the entanglement to convert classical bandwidth (from the internet) into quantum bandwidth.
That is to say, we can [quantum-teleport](https://en.wikipedia.org/wiki/Quantum_teleportation) qubits from Alice to Bob.

# A Solution

Instead of directly sending the 16-qubit message across the lossy quantum network, Alice uses the quantum network to send sixteen EPR halves to Bob.
Whenever an EPR half is lost in transit (which we assumed the network could and would report) she sends a replacement.
Once Alice and Bob share 16 bits of entanglement, they use them to quantum-teleport the message over the classical internet.

This solution can be improved upon in two ways.

First, because the quantum network is so lossy, it's a bad idea for Alice to send EPR halves all the way to Bob.
Instead, we should build up entanglement at the link level, between each pair of nodes, then teleport the message across each hop.
This improves our throughput from $\Theta((1-L)^N)$ to $\Theta(1-L)$, where $N$ is the number of hops and $L$ is the proportion of lost messages.

Second, we can use [entanglement swapping](https://en.wikipedia.org/wiki/Quantum_teleportation#Entanglement_swapping) (i.e. teleporting EPR halves) to spread the link-level entanglement across longer and longer distances.
In the end Alice ends up entangled with Bob, but without the exponential losses incurred by trying to directly send the entanglement.
This improves the latency from $\Omega(R N)$ to $\Omega(R \lg N)$, where $R$ is a round-trip across the classical internet and $N$ is the number of hops.
(Note that the entanglement can be built-up ahead of time, in which case the latency would improve from $\Omega(R N)$ to $\Omega(R)$.)

Here's how things play out, with the two improvements applied.
We start with an 8-hop network with 10% loss per hop:

    A ~> 1 ~> 2 ~> 3 ~> 4 ~> 5 ~> 6 ~> 7 ~> B [10% loss per hop]
                                               
Instead of risking the message, we instead send fungible EPR halves.
We do this locally across each hop, in parallel, so that adjacent nodes become entangled.

    A ≈≈ 1 ≈≈ 2 ≈≈ 3 ≈≈ 4 ≈≈ 5 ≈≈ 6 ≈≈ 7 ≈≈ B
    
Now we remove intermediate hops via entanglement swapping.
We repeat this process, in a hierarchical fashion, until A and B are entangled:

    A ≈≈ 1 ≈≈ 2 ≈≈ 3 ≈≈ 4 ≈≈ 5 ≈≈ 6 ≈≈ 7 ≈≈ B
         ⇄         ⇄         ⇄         ⇄
    A ≈≈≈≈≈≈≈ 2 ≈≈≈≈≈≈≈ 4 ≈≈≈≈≈≈≈ 6 ≈≈≈≈≈≈≈ B
              ⇄                   ⇄
    A ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ 4 ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ B
                        ⇄
    A ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ B

Finally, we use the entanglement between A and B to quantum-teleport a qubit of the message.

    A --------> B

This approach gives ideal throughput and latency, but relies heavily on the classical internet and assumes we can detect losses.

# Summary

Instead of sending messages over an unreliable quantum network, use the network to build up entanglement.
Then use that entanglement to fuel quantum teleportation over the classical internet.
This allows you to use a mere error detecting code over the quantum network, instead of a full error correcting code.
