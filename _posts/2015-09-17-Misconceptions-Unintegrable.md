---
layout: post
title: "My Misconceptions: The Unintegrable Function"
date: 2015-09-17 11:30:00 EST
categories: math
comments: true
---

Sometimes, I have ideas.
Dumb ideas.
Usually I catch them, but sometimes I don't.

In "My Misconceptions" posts, I poke fun at myself while discussing wrong things I've thought.

# From Undifferentiable to Unintegrable

Historically, there was a time when people thought that every continuous function was differentiable.
People realized their error when pathological counter-examples, such as the [Weierstrass_function](https://en.wikipedia.org/wiki/Weierstrass_function), were discovered.

For example, the function $f(x) = \Sum{n=0}{\infty} 2^{-n} \sin(4^n x)$ is continuous (due to higher terms in the sum being bounded between $\pm 2^{-n}$).
But, if you differentiate $f$, then the $2^{-n}$ term gets multiplied by the $4^n$ factor inside the $\sin$ and you end up with $f'(x) = \Sum{n=0}{\infty} 2^n \cos(4^n x)$.
*That* sum fails to converge, because later terms are multiplied by $2^n$ instead of $2^{-n}$ and so can be arbitrarily large.
The derivative does not exist.

When I learned about the above trick for breaking differentation, I had an idea: why not break integration with the same idea in reverse?
Just replace $\sin(4^n x)$ with $\sin(4^{-n} x)$, since integrating will divide by the internal $\sin$ factor instead of multiplying by it:

$g(x) = \Sum{n=0}{\infty} 2^{-n} \sin(4^{-n} x)$

$(\int g)(x)$
$= \int \Sum{n=0}{\infty} 2^{-n} \sin(4^{-n} x) dx$

$= \Sum{n=0}{\infty} \int 2^{-n} \sin(4^{-n} x) dx$

$= -\Sum{n=0}{\infty} 2^n \cos(4^{-n} x)$

Notice that the infinite sum in the resulting expression for $\int g$ fails to converge (it always diverges towards infinity).
And suppose for the moment that swapping the order of the infinite sum and the integral was justified.
Clearly $\int g$ doesn't exist.

At least, that's what I thought for an embarassingly long time.

# Fundamentally and Constantly Wrong

What's especially bone-headed about this mistake is how obvious it is, at least in hindsight.

How obvious?
Well, my conclusion violates a somewhat well-known theorem.
A theorem that says that every continuous function (e.g. $g$) has an integral.
You may have heard of it; it's called "The Fundamental Theorem of Calculus".

*Eventually* someone took pitty on me (or rather, got angry at me for being wrong on the internet) and pointed something out:

$h(x) = -\Sum{n=0}{\infty} 2^n (\cos(4^{-n} x) - 1)$

$h'(x) = g(x)$

Oh.

Well.

That's definitely the worst forgetting-the-integration-constant mistake I've ever made.

# Summary

If you're going to play fast and loose with the order of integrals and infinite sums, the consequences of forgetting your constant(s) of integation might get infinitely worse.
