---
layout: post
title: "Why Quantum Measurement Commutes with Controlled Operations"
date: 2015-08-12 11:30:00 EST
categories: quantum
comments: true
---

In the [last post](), I appealed to the deferred measurement principle as part of claiming that [a paper by Younes et al.](http://arxiv.org/abs/1507.05061) was incorrect about providing a polynomial time quantum algorithm for an NP-complete problem.

One/some of the authors left a comment, saying that I was wrong to assume that the measurements could be moved backwards.

In this post, I'll explain when and why measurements can be moved around in a quantum circuit.

# Types of States

What *exactly* is the result of a measurement, in terms of of quantum computing? To explain that, I first need to introduce classical states, pure states, and mixed states.

A classical state is that thing you can store with everyday classical bits. Each bit can be assigned 0 or 1, and with $n$ bits this lets you pick out a single state amongst $2^n$ possibilities.

    classical0 = [True, True, False]
    classical2 = [False, True, False]
    classical7 = [True, True, True]

A pure state, also called a superposition, is a collection of weighted classical states. The weights are amplitudes: complex numbers whose squared magnitudes must sum up to 1.

    pure1 = {classical0: 1}
    pure2 = {classical0: -1}
    pure3 = {classical0: 0.6, classical1: 0.8}
    pure4 = {classical0: 0.5, classical1: -0.5, classical2: sqrt(0.5) * sqrt(-1)}

A mixed state is a collected of weighted pure states, but this time the weights are probabilities instead of amplitudes.

    mixed1 = {pure1: 1}
    mixed2 = {pure3: 0.7, pure4: 0.3}

So a mixed state is a probability distribution of superpositions of classical states.
It is mathematically convenient to represent mixed states as a density matrix, but I'll be avoiding such complications in this post.

# Effect of Measurement 

A measurement splits pure states into mixed states.
example

    def measurePure(pure, predicate):
    	off = pure.filter(lambda c, a: predicate(c))
    	on = pure.filter(lambda c, a: predicate(c))
    	pOff = off.map(lambda c, a: a*a.conj).sum()
		pOn = 1 - pOff        
        return {
        	off.mapValues(lambda a: a / pOff) : pOff,
        	on.mapValues(lambda a: a / pOn) : pOn
        }

    def measureMixed(mixed, index):
        return {
        	collapsed: p2 * p
        	for collapsed, p2 in measurePure(pure)
        	for pure, p in mixed
        }

Go in the opposite direction with purification.

    def purify(mixed):
        numNewBits = ceil(log(len(mixed)))
        ...

# Effect of Postselection

    def postselectPure(pure, predicate):
    	match = pure.filter(lambda c, a: predicate(c))
    	if not match:
    		return None
    	remainingWeight = match.map(e -> |e|**2).sum()
    	return match.mapVal(e -> e/sqrt(remainingWeight))

    def postselectMixed(mixed, predicate):
    	posts = [(postselectPure(pure, predicate), p) for pure, p in mixed]
    	return {pure, p for pure, p in posts if pure is not None}

# Effect of Operations

    def operateMixed(mixed, operation):


# Circuit
ac
Start in some mixed state M.

Apply an operation U conditional on bit #1.

Operation maps into mixed state keys, maps into superposition keys, then interference.

Bit 1 components are never mixed together by interference because it was not changed by the operation.

If measurement is performed first, then it goes

pure split into 0/1 parts and flattened into mixed state, operation applies within remainder

if performed second then it goes

operation applies within 0/1 split parts, then pure split into 0/1 parts and flattened into mixed state

    def test():
    	n = 4
        uniform = { {i: 1/sqrt(n) for i in range(n)}: 1}
        


