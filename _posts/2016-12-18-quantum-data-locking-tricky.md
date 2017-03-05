---
layout: post
title: "Quantum Data Locking vs Recognizable Data"
date: 2016-12-18 12:10:10 am EST
permalink: post/1632
---

Quantum information theory differs from classical information theory in many interesting ways.
The ability to perform "data locking", where the amount of classical information that you have access to can go up dramatically as you receive clarifying information, is one of those differences.

The [original quantum data locking paper, by DiVincenzo et al](https://arxiv.org/abs/quant-ph/0303088), gives a simple protocol for locking data.
Alice generates a random $n$-bit key, stores the key either on the X axes of $n$ qubits or on the Z axes of $n$ qubits, then gives those qubits to Bob.
Because Bob doesn't know which axis to measure along, and he can't try both options (since X and Z don't commute), he performs poorly at "figure out the secret key encoded into your qubits" games.
But as soon as Alice tells Bob "it's X" or "it's Z", a single bit of information, his performance jumps from terrible to perfect.

(*Note: The specific variant of the key-guessing game we care about is the one where Bob's guess is a probability distribution, and his score is the base-2 logarithm of the probability he assigned to the correct answer.
Classically, giving him one more bit of information can only increase his score by 1 in expectation.
With superdense coding, it can increase by 2.
With quantum data locking, it can increase by $O(n)$.*)

# Useful?

When I first read about quantum data locking, I thought it sounded pretty useful.
Not just as [something to carefully consider when doing security proofs](http://journals.aps.org/prl/abstract/10.1103/PhysRevLett.98.140502), but as a cryptographic primitive.
I was thinking that you could quantum-data-lock a document and then reveal it at a later time, and get a kind of information-theoretic encryption.
But, eventually, I realized that things were not quite so easy (even ignoring the fact that no one is going to use an encryption scheme that's defeated half of the time by random guessing).

First, notice that if I gave you a long document made up of English text, quantum-data-locked using the X-or-Z scheme, you would have an easy time unlocking most of it.
Just measure the qubits corresponding to the first thirty characters along the Z axis, and see if what comes out looks like English or like noise.
That reveals whether the Z axis is the right choice or not, allowing you to measure the correct axis on the rest of the document.

That problem is pretty serious, but maybe there's a workaround.
Let's encrypt and prepend the data with a random 256-bit AES key.
That way, any given part of the document+key will look like the random noise you get when you guess the axis wrong.
Maybe this AES+X-or-Z scheme is good enough?...

...

...

Ha!
Fat chance!
It falls to the easiest of all quantum attacks: the **"Just do it under superposition, dummy!"** attack.
Okay, it's not so much an "attack" as it is a reminder about the basic capabilities of quantum computers.
But, historically speaking, the ability to simply not measure intermediate data was often overlooked.
For example, see any of the old proposed quantum protocols for oblivious transfer or precommitment.

To break the AES+X-or-Z method, Bob starts by writing an `is_valid_document` function.
The function takes the *unlocked* data, performs the AES decryption, and applies a simple statistical test to see if the result looks like English.
Bob then compiles `is_valid_document` into a quantum circuit that does the whole computation under superposition, runs his key+document qubits through this circuit, and measures the function's result.
Note that uncomputation is used, so there are no ancilla left behind except for the "did it work?" result.

If the document was encoded in the computation basis, i.e. onto the Z axis, then he gets a "Yup! Valid! Use the Z axis!" result.
Based on that, he measures everything on the Z axis, decrypts, and wins.

If the document was encoded onto the X axes, then something more complicated happens.
X-axis states are uniform superpositions of all the Z-axis states, so basically the circuit will be using all possible AES keys to decrypt all possible payloads.
But the chances of a random key decrypting random bits into something that looks like English is *incredibly* low, especially if the document is long.
So the vast majority of the superposition will be cases that fail validation, and when Bob measures the result he gets "Nope! Don't use the Z axis!" with high probability.

Furthermore, although measureming the is-valid result caused a collapse that destroyed any states that happened to pass validation, those states made up such a small fraction of the whole so this is only a tiny perturbation to the overall state.
That means we can expect the X-axis measurements to have been essentially unchanged by running the validation process.

So Bob wins in both the Z-axis and X-axis cases (with high probability).
And clearly this approach of performing the verification under superposition is going to work on any quantum data locking protocol.
If Bob has *any* way to say "Yup, that data looks right!", then quantum-data-locking that data is not secure in the information-theoretic sense.
And if you're not going to get information-theoretic security, you might as well just use AES and "unlock" the data by revealing the key.

# Summary

Quantum data locking is interesting, but dangerous in situations that involve compressible data.
This limitation makes it hard to imagine quantum data locking as a useful cryptographic primitive.

Quantum computing adds a whole new dimension to "Don't roll your own crypto!".
