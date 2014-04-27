---
layout: post
title: "The (not) Quantum Laplace Transform"
date: 2014-04-27 11:30:00 EST
categories: quantum
---

I've had a bit of writer's block over the past two weeks. Although I have a growing backlog of ideas to write about, I prefer to write about things I've tried recently. So mostly I blame my lack of posting on several tentative ideas falling flat.

One of these tentative ideas was to try to make a quantum algorithm for computing the Laplace transform.

**Laplace Transform**

The [Laplace transform](http://en.wikipedia.org/wiki/Laplace_transform) is a lot like the [Fourier transform](http://en.wikipedia.org/wiki/Fourier_transform), except instead of using sine waves or circles it uses exponential curves.

The discrete version of the Laplace transform, called the [Z transform](http://en.wikipedia.org/wiki/Z-transform) for some reason, can be defined like this: `$y_j = \sum_{i=1}^{len(x)} x_i \cdot j^{-i}$`. Here $x$ is the input vector and $y$ is the output vector. There are variations on this definition, and I find it surprising that it's $j^{-i}$ instead of $2^{-ij}$ or $e^{-ij}$, but it all works out the same for our purposes.

Let's do a quick example. What's the the Z transform of $[1,2,3]$? Well, the first element of the result is just the sum of the input elements. The second element of the result is the same sum except each entry is worth half as much as the previous. The third decays by thirds instead of halves. So our result is $[1+2+3, 1+\frac{2}{2}+\frac{3}{4}, 1+\frac{2}{3}+\frac{3}{9}] = [6, \frac{11}{4}, 2]$.

**Quantum Style**

I expected the Z transform to be amenable to quantum computation because it has a lot of similarities to the Fourier transform, and there is a *fast* [Quantum Fourier Transform](http://en.wikipedia.org/wiki/Quantum_Fourier_transform). Both the Fourier transform and the Z transform are linear transformations. And both can be reversed. And both are thought of as a change of basis to a frequency domain. And both are used as a way to make some intermediate operations faster. So things look promising from afar.

But the problem is obvious as soon as you write down the Z transform as a matrix: it doesn't preserve the length of vectors. For example, `[1, 0]` has length 1 but is mapped to `[1, 1]` which has length $\sqrt{1^2+1^2} = \sqrt{2}$. Quantum computers can only do unitary operations, which preserve length. So essentially we have to do the computation classically, working on the bits instead of the amplitudes, and we won't get our quantum speedup.

I tried fiddling with the transform to fix the problem, looking for something similar that *did* maintain length. You can't just scale the whole matrix, because different columns scale by different amounts. I tried scaling the columns/rows, but that just breaks things differently. I tried different sorts of exponential curves, like using $(2^j)^i$ instead of $j^i$, but that doesn't work for the same basic reason. I also tried to transform just the phases of the amplitudes instead of the whole things, which would trivially preserve lengths, but that's not a linear transform.

Defeated, I checked google scholar. Superficial searches like "quantum laplace transform" didn't bring up anything. If it was possible to get a huge speedup here then I would have expected it to be discovered soon after the QFT was. And for those papers to show up in the obvious searches. So my expectation is that the Laplace transform is not amenable to quantum speedups. At least not exponential ones.

**Summary**

The Laplace transform doesn't seem to get a quantum speedup, despite being similar to the Fourier transform (which does), because the Laplace transform doesn't preserve lengths.
