---
layout: post
title: "The French have the Quantum Circuits"
date: 2026-06-01 10:10:10 am PST
permalink: post/2602
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Almost exactly one year ago, I found a way to make quantum attacks on elliptic curve cryptosystems ten times cheaper.
Specifically, I found a better way to perform [elliptic curve point addition](https://en.wikipedia.org/wiki/Elliptic_curve_point_multiplication#Point_addition) on a quantum computer.
I wanted to publish these improved point addition circuits, to enable cryptographers to make informed decisions about when they'd need to transition away from quantum-vulnerable cryptosystems.
I've done this [several](https://arxiv.org/abs/1905.09749) [times](https://arxiv.org/abs/2505.15917) over the past decade.
However, this time, something new happened: I got pushback on publishing.

The estimated cost of quantum attacks has plummeted over the past decade.
It seems [possible](https://arxiv.org/abs/2603.28627) that cryptographically relevant quantum computers (CRQCs) could exist within years.
Now, to be clear, I don't think that's *likely* (as in >50% chance).
But it's *possible* (as in >10% chance), and if your job is security then [that's dispositive](https://words.filippo.io/crqc-timeline/).
Anyways, a short timeline is really inconvenient, because it means some companies (especially hardware companies) could fail to transition in time.
Consequently, in a short CRQC timeline world, releasing information about quantum attacks might be a bad idea.
It might help attackers more than defenders.
And the sheer scale of the problem makes traditional disclosure mechanisms questionable.

Eventually, a compromise was reached.
Instead of publishing the details of the point addition circuits, we'd publish [zero knowledge proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof) (ZKPs) that they existed.
This would provide defenders the information they need for planning, without providing attackers the information they need for attacking.
I have to admit, it wasn't very hard to convince me to go the ZKP route.
I think zero knowledge proofs are cool as fuck and I've always wanted to publish one.

In March 2026, we published [the paper with the zero knowledge proofs](https://arxiv.org/abs/2603.28846).

...but we didn't expect the proofs to survive the year.


# Secrets Revealed

The problem with secrets is that, like lies, they're contagious.
To keep one secret, you have to keep another.
Elliptic curve circuits are built out of the same basic ingredients as other circuits: adders, multipliers, table lookups, and so forth.
This commonality means that techniques used to improve one circuit inevitably improve another.

The most expensive thing that happens during a quantum elliptic curve point addition is a multiplication (a quantum-quantum inplace modular multiplication, to be specific).
Multiplication is also a key cost in an algorithm called Decoded Quantum Interferometry (DQI).
Four months earlier, we'd published [a paper on DQI](https://arxiv.org/abs/2510.10967v1) that explained a new technique for making multiplication more space efficient...
are you seeing the glaring problem?
We knew that all anyone had to do, to unmask our ZKPs, was read over our prior papers and put two and two together.

Today, almost exactly two months after we published the ZKPs, André Schrottenloher
(a researcher at [le Centre Inria de l'Université de Rennes](https://www.inria.fr/fr/centre-inria-universite-rennes) in France)
published [a preprint showing how to construct circuits with similar costs to ours](https://arxiv.org/abs/2606.02235).
He read our prior papers, and he put two and two together.
The exact details of his construction are a bit different, but the key ideas are the same.

My congratulations to André on being the first to match our circuits.
Not only did he get it done in two months, he improved the Toffoli count a little bit!
Seriously, congratulations.


# The Problem with ZKPs

Even if the key ideas hidden behind the zero knowledge proofs weren't betrayed by our prior papers, I wouldn't have expected the secrets to last any substantial amount of time.
I wanted to try the experiment, but there are clear reasons to expect ZKPs to fail for this use case in the future.
Here's three big ones.

The first big problem with sharing research by ZKP is the [Streisand effect](https://en.wikipedia.org/wiki/Streisand_effect).
Saying you have a solution, but that you won't share it, is a great way to draw attention.
Compared to computer science as a whole, or even to just cryptography, quantum computing is a tiny field.
Drawing wide attention to a quantum computing problem could easily increase the number of people working on it by *two orders of magnitude*.
For example, [the secp256k1 Point-Addition Challenge](https://github.com/gpsanant/quantum_ecc_add/) is being created as a direct consequence of our paper.
This is not the kind of environment where techniques stay secret for long.

The second big problem with sharing research by ZKP is that, sometimes, just knowing a solution exists is enough to solve the problem.
The famous case of George Dantzig [cracking two unsolved problems in statistics because he thought they were homework](https://en.wikipedia.org/wiki/George_Dantzig#Education) comes to mind.
Knowing that you don't even need to consider that a solution won't exist can be very helpful.
Often the hard part is just knowing to work on a problem at all!

The third big problem with sharing research by ZKP is [rubber-hose cryptanalysis](https://www.schneier.com/blog/archives/2008/10/rubber_hose_cry.html).
This refers to beating someone with a rubber hose until they tell you their secrets ([relevant xkcd](https://xkcd.com/538/)).
Publishing a ZKP doesn't reveal what your solution is, but it does reveal who to apply the hose to.
In a world where CRQCs already existed, it would be idiotic to publish a ZKP that you and only you knew a way to make quantum attacks drastically cheaper.


# Closing Remarks

I enjoyed publishing some cheeky ZKPs, but I don't think it's the right strategy moving forward.
The benefits are negligible, and the costs are many.
We should just publish openly.

Congrats again to André.
Oh, and since I haven't yet mentioned it here on the blog, congrats to Keegan Ryan for [finding (now fixed) bugs in our public ZKP code that made it possible to accept invalid circuits](https://blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/).

