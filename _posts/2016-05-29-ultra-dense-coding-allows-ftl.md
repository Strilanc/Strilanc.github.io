---
layout: post
title: "Ultradense Coding would allow FTL Signalling"
date: 2016-05-29 12:10:10 am EST
---

The title spoils the question, but I'll ask it anyways:
how do we know that there's no clever way to pack more than 2 bits into a transmitted qubit?

Initially, people assumed that [Holevo's theorem](https://en.wikipedia.org/wiki/Holevo's_theorem) implied the bit-per-sent-qubit limit was 1. (Roughly speaking, the theorem says that you can encode at most $n$ bits of retrievable information into $n$ qubits.)
But, in 1992, [Charles Bennett et al. figured out a way](http://journals.aps.org/prl/abstract/10.1103/PhysRevLett.69.2881) to sidestep the theorem: pre-shared entanglement.
By burning an EPR pair that was sent ahead of time, [superdense coding](https://en.wikipedia.org/wiki/Superdense_coding) can pack 2 bits into a single qubit.

So now we think the bit-per-sent-qubit limit is 2 (and there are theorems about it).
But, intuitively speaking, how do we know there's not *another* accidental assumptions being overlooked?
It happened once, so maybe it can happen again, right?

Well... probably not.
Things go kind of crazy if you can pack more than 2 bits into a qubit.

# Iterating $(2+\epsilon):1$ into $\infty:1$

Suppose you discovered an amazing ultradense coding scheme that packed 3 bits into 1 qubit of bandwidth.
You tell Alice and Bob about the scheme, and they decide to test it out.

Bob picks a million bits of information to send to Alice.
Using your ultradense coding scheme, he packs the million bits-to-be-sent into 333334 qubits.
But he doesn't stop there, we're just getting started.

Superdense coding turns quantum bandwidth into classical bandwidth, but there's also a process for turning classical bandwidth into quantum bandwidth: [quantum teleportation](https://en.wikipedia.org/wiki/Quantum_teleportation).
Using quantum teleportation, Bob can encode the 333334 ultradense-coded qubits into 666668 bits.
Then, using your ultradense coding scheme *again*, Bob can pack those 666668 bits into into 222223 qubits.
Follow it up with another teleportation, and those 222223 qubits become 444446 bits.
Hmm.

One more cycle of ultradense coding and quantum teleportation, and we're down to 296298 bits.
Then 197532 bits.
Then 131688 bits.
Then 87792 bits.
And so forth all the way down to a mere 4 bits (where we hit a floor because $2 \lceil \frac{4}{3}\rceil = 4$).
With one last application of ultradense coding, Bob has 2 qubits that, when transmitted, allow Alice to recover the entire million bit message.

Alice will burn megabits of entanglement while unpacking the message, but the point is that the reasonable $3:1$ advantage has grown into a crazy $500000:1$ advantage.
*Any* advantage greater than $2:1$, including tiny advantages like $2.1:1$, become arbitrarily large when repeatedly alternated with quantum teleportation.

But it's not just that we can send arbitrarily many bits per qubit: we can send arbitrarily many bits **per bit**.
Bob can use iterative ultradense-coding/teleportation to send a million bit message to Alice by only sending 4 seed bits.

... Yeah, there's *no way* that's not going to lead to insane powers.

# Guessing the Message

Because the seed message is only 4 bits, Alice has decent odds of just guessing it.
She'll guess wrong and trash the message the majority of the time but, by using an error correcting code, she can *tell* whether or not the guess was correct or she trashed the message.
And by repeating the protocol enough times, we can increase the odds of the message being received arbitrarily close to certainty.

(*Side note: I'm implicitly assuming that, if Alice uses the wrong seed, she gets a totally random message.
Or at least a message that isn't guaranteed to follow the error correction scheme better than chance would.
The alternative, where Alice receives noise that's uncorrelated with the message and yet somehow satisfies arbitrary error correction schemes, is waaay too magical for me to even consider.*)

Suppose Alice and Bob perform the iterated-ultradense-encode-and-guess process 100 times.
That gives a failure rate of $\left( \frac{15}{16} \right)^{100} \approx 0.2$%.
Sure it's a hundred times more work than just sending the 4 bits, and less likely to succeed to boot, but the new protocol *doesn't require any bits to be physically transmitted*.
There's no signalling delay!

(*Hell, Alice could even perform the decoding process before Bob did the encoding.
But we're already so far into 'everything is clearly broken' territory that creating time travel paradoxes is overkill.*)

Basically, any ultradense coding scheme gives us a way to communicate using only entanglement.
And that violates the no-communication theorem, which is embedded *deep* in quantum mechanics (it's a trivial consequence of the fact that $A \otimes I$ commutes with $I \otimes B$).
A lot of math would have to break for that theorem to be wrong.

# Summary

A $(2+\epsilon):1$ bit-per-qubit coding scheme can be bootstrapped into an $\infty:1$ bit-per-**bit** coding scheme.

An $\infty:1$ bit-per-bit coding scheme, combined with error correcting codes, allows the receiver to guess at the message and find out whether they got the guess right.
This creates a faster than light communication mechanism.

Therefore there is no $(2+\epsilon):1$ bit-per-qubit coding scheme.
