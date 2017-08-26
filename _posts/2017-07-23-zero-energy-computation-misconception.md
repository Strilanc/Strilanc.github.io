---
layout: post
title: "Reversible Computation isn't Free"
date: 2017-07-23 12:10:20 pm PST
permalink: post/1714
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

[Landauer's principle](https://en.wikipedia.org/wiki/Landauer%27s_principle) puts a lower limit on the cost of irreversible computations.
Basically: clearing a bit requires a minimum amount of energy (that depends on the ambient temperature), so a computation must consume an amount of energy proportional to how many bits it clears.
(The energy efficiency of current computers is many orders of magnitude away from this limit.)

But now suppose we did computation *without* clearing bits.
[Reversible computation](https://en.wikipedia.org/wiki/Reversible_computing) only ever toggles bits, and is in principle just as powerful as irreversible computation.
Quantum computation also involves (mostly) reversible operations.
So maybe reversible computation doesn't require energy?

There are certainly people and sites on the internet who claim that reversible computation can be done without consuming energy.
Even the [Wikipedia article on Landauer's principle](https://en.wikipedia.org/wiki/Landauer%27s_principle) makes a note of this:

> If no information is erased, computation may in principle be achieved which is thermodynamically reversible, and require no release of heat.
> This has led to considerable interest in the study of reversible computing.

However, this is actually not true.
I mean, okay, the above quote isn't *technically* wrong.
But only because the first sentence has a get-out-of-jail-free "in principle" right in the middle.

Bypassing one limit doesn't mean you bypassed all limits.
In practice there's several reasons that reversible computers and quantum computers must consume energy.
Let's go over three.

# Error Correction

Unless you build a computer that is literally perfect, and totally isolated from the environment, noise is going to leak into the physical system making up your computer.
The nature of computation will then tend to mix that noise all over the computer's state, until the whole system is off-track.

Keeping the computer on track requires pumping the noise leaking into the system back out into the environment.
And "pumping out noise" is just another way of saying "clearing bits".
So Landauer's principle actually *does* apply to reversible computers.
It's just that the bound ends up being proportional to the amount of noise leaking in, rather than to the number of times the computation performs a particular operation.

# Input / Output

In order to be useful, your quantum computer or reversible computer has to interface with the rest of the world.
You have to be able to put raw information in, and get processed information out.
But both those things require energy.

When entering information into the computer, you're replacing the existing state with a specific desired state.
You're clearing the old state's bits.
Landauer's principle applies.
Conversely, extracting information from the computer requires amplifying bits or qubits into states large enough that they're convenient for you to work with.
Amplification involves overwriting bits in the environment, so it also requires energy.

For long computations the cost of input work and output work being irreversible processes is negligible (compared to the hypothetical cost of the whole computation being irreversible).
But the cost still isn't *zero*, and many computational tasks involve a lot of input/output work.

# Supporting Hardware

I can't speak to reversible computers, but quantum computers (or at least early quantum computers) don't stand on their own.
They need a lot of supporting hardware.

You need a dilution refrigerator to keep the qubits cold enough that noise isn't leaking in faster than it can be pumped back out.
You need a powerful classical computer to run the error correcting code that's pumping noise out of the system.
You also need the classical computer to instruct the quantum computer about which operations to apply.
You need microwave generators to produce the signals that control the qubits (this is specific to superconducting qubits, but other types of qubits have their own equivalents e.g. lasers for trapped ions).
You need coffee machines to power the humans responsible for maintenance.
You just generally need a lot of *other stuff*.

Even if the quantum computer proper wasn't consuming energy, all this side stuff needed to keep the computer running would be consuming energy.

# Summary

Unless your reversible computer is perfectly isolated from the world, doesn't produce results, and doesn't need any supporting hardware... it's going to require energy to run.

[Discuss on reddit](https://www.reddit.com/r/algassert/comments/6p6p6u/comment_thread_reversible_computation_isnt_free/)
