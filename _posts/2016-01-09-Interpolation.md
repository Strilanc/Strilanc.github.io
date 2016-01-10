---
layout: post
title: "Interpolation Addendum - Use Eigendecomposition"
date: 2016-01-07 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

This post is an addendum to [Interpolating Qubit Operations](/quantum/2014/11/15/Interpolating-Qubit-Operations.html) and [Converting Rotations into "Nice" Qubit Operations](/quantum/2014/11/24/Converting-Rotations-into-Nice-Qubit-Operations.html).
They're not *wrong*, but they share the same massive omission (because I didn't know about it at the time): just using the [eigendecomposition](https://en.wikipedia.org/wiki/Eigendecomposition_of_a_matrix).

Whenever you want to apply a function to a matrix, such as computing the square root or the logarithm, the first thing to try is to break it into its eigenvalues and vectors, apply the functions to the eigenvalues, then put the matrix back together.

If $M = \sum\_{\lambda,v} \lambda \ket{v}\bra{v}$, where the $\lambda$ are the eigenvalues and the $\ket{v}$ are the eigenvectors, then $f(M) = \sum\_{\lambda,v} f(\lambda) \ket{v}\bra{v}$.
This doesn't *always* work, but a notable case where it does is those posts.

# Simplified Rotations

In the 'nice rotations' post, it turns out I'm just talking about the difference between $e^{iUs}$ and $U^s$.

One of the benefits of thinking in terms of $X^{0.5}$ instead of in terms of "rotating around the X axis by 90 degrees" is that you get to sidestep that whole degree halving thing that makes everything horribly confusing.
$X^{0.5}$ is unambiguous; it can only refer to a quarter turn.
I guess it could correspond to a clockwise or mathwise quarter turn, but it's easy to define a principle root.
Angles can suck it.

# Simplified Interpolation

In the interpolation post I give numerically stable code that works with 2x2 matrices, but here's a much more general strategy: $U\_s = U\_0 \cdot \left( U\_0^{\dagger} \cdot U\_1 \right)^s$.

The matrix $D = U\_0^{\dagger} \cdot U\_1$ is a product of unitary matrices, so $D$ is also unitary and thus has an eigendecomposition and is amenable to cheat codes.

Or, in python:

    import numpy
    
    def eigenterpolate(U, V, s):
        """Interpolates between two matrices."""
        return U * eigenpow(U.H * V, s)

    def eigenpow(M, t):
        """Raises a matrix to a power."""
        return eigenlift(lambda b: b**t)(M)

    def eigenlift(f, M):
        """Lifts a numeric function to apply it to a matrix."""
        w, v = numpy.linalg.eig(M)
        T = numpy.mat(numpy.zeros(M.shape, numpy.complex128))
        for i in range(len(w)):
            eigen_val = w[i]
            eigen_vec = numpy.mat(v[:, i])
            eigen_mat = numpy.dot(eigen_vec, eigen_vec.H)
            T += f(eigen_val) * eigen_mat
        return T

The old code only worked with 2x2 matrices.
This code works with matrices of arbitrary size, as long as numpy can accurately compute the eigenvalues.

# Testing it out

Let's see how well the interpolation works.
We can use it to find the square root of incrementing:

<img src="/assets/{{ loc }}/identity-to-increment.gif" title="Interpolating between no-op and increment"/>

Or we can interpolate between incrementing and applying a fourier transform:

<img src="/assets/{{ loc }}/fourier-to-increment.gif" title="Interpolating between fourier transform and increment"/>

Or we can apply partial fourier transforms. Although, I must admit, there seems to be some kind of numerical accuracy problem here:

<img src="/assets/{{ loc }}/identity-to-fourier.gif" title="Interpolating between no-op and fourier transform"/>

The numerical stability problem was much worse with my original interpolation function, $U\_s = e^{\ln(U\_0^\dagger U\_1) \cdot s}$.
That function should work just as well, but when I use it in numpy the interpolation stutters horribly.

# Summary

Using the spectral decomposition is cheating.
