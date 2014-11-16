---
layout: post
title: "Interpolating Qubit Operations"
date: 2014-11-15 11:30:00 EST
categories: quantum
---

In this post: gradually transitioning between two single-qubit quantum operations.

**Interpolation**

Suppose you want to *ease into* the effects of a quantum operation, so you can animate what's happening without any jarring jumps. More generally, you want to be able to transition between any two operations without jumping. Can this be done?

A first instinct, based on the fact that a quantum operation is always just a [unitary matrix](http://en.wikipedia.org/wiki/Unitary_matrix), might be to just do a linear interpolation between the matrices:

$U\_t = U\_0 (1-t) + U\_1 t$

The problem with linear interpolation is that the intermediate matrices may not be valid operations. Linear interpolation will tend to create matrix entries that are too close to zero, meaning the resulting matrices will tend to shrink values instead of preserving their length (which kind of sucks, since the whole point of using unitary matrices is that they preserve length).

Basically, we want to do the interpolation without leaving the [space of 2x2 unitary matrices](http://en.wikipedia.org/wiki/Unitary_group). Can *that* be done?

**Inspiration**

What does the space of 2x2 unitary matrices even look like? Well, one compact way to parametrize it is:

$U = e^{\phi i} \left( I i \cos{\theta} + \hat{v} \sigma\_{xyz} \sin{\theta} \right)$

The above equation involves four constants and three variables. The constants are the identity matrix ($I$), the square root of negative one ($i$), Euler's constant ($e$), and the vector of [Pauli matrices](http://en.wikipedia.org/wiki/Pauli_matrices) ($σ\_{xyz}$). The three variables are the angle $\phi$, the angle $\theta$, and the unit vector $\hat{v}$.

Each of the variables plays a different role. $\phi$ is a global phase factor. It's what distinguishes the group of unitary matrices U(2) from the ["special" unitary group SU(2)](http://en.wikipedia.org/wiki/Special_unitary_group). $\hat{v}$ and $\theta$ correspond to a rotation. $\hat{v}$ is like an axis to rotate around, and $\theta$ is how much to rotate around said axis.

How are $\hat{v}$ and $\theta$ like a rotation? It becomes a bit clearer when you expand the compact parametrization from above. By inlining the Pauli matrices and splitting $\hat{v}$ into $\langle x, y, z \rangle$, we get:

$U = e^{\phi i} \left(
i \cos{\theta} \begin{bmatrix} 1 & 0 \\\\ 0 & 1 \end{bmatrix}
+ x \sin{\theta} \begin{bmatrix} 0 & 1 \\\\ 1 & 0 \end{bmatrix}
+ y \sin{\theta} \begin{bmatrix} 0 & -i \\\\ i & 0 \end{bmatrix}
+ z \sin{\theta} \begin{bmatrix} 1 & 0 \\\\ 0 & -1 \end{bmatrix} \right)$

Alright, maybe that's not *quite* enough clarity. We're missing the thing it looks like: the equation to convert [from an axis-angle style rotation to a unit quaternion style rotation](http://en.wikipedia.org/wiki/Axis%E2%80%93angle_representation#Unit_quaternions). That's:

$q = \cos(\frac{\theta}{2}) + x \sin(\frac{\theta}{2}) i + y \sin(\frac{\theta}{2}) j + z \sin(\frac{\theta}{2}) k$

See the resemblance? Ignoring that mysterious halving of the angles, the Pauli matrices are basically playing the roles of the [quaternion](http://en.wikipedia.org/wiki/Quaternion) constants $i$, $j$, and $k$. In fact, if we multiply each of the Pauli matrices by $i$, we get $(i \sigma\_{x})^2 = (i \sigma\_{y})^2 = (i \sigma\_{z})^2 = i^3 \sigma\_{x} \sigma\_{y} \sigma\_{z} = -I$. Which looks an awful lot like the way quaternions are defined: $i^2 = j^2 = k^2 = ijk = -1$.

Why is this similarity to rotations important? Because we are going to exploit it in order to interpolate. There are already existing methods to smoothly interpolate between quaternions, and we can use those to handle the rotation part of the unitary operation. Then, for the remaining phase part, we just have to interpolate between two angles.

**Demonstration**

Below is a demo of the method vaguely outlined above. You can enter start and end matrices into the text boxes, and (after it corrects the entered matrices to be unitary) a continuous transition between the two matrices is shown. It's a bit hard to check by eye if the intermediate matrices are unitary... you can see that the motion is smooth and the colored area is staying roughly constant, though.

<div style="width: 500px;">
    <div style="display: inline-block; float: left;">
        <div>
            <label>Start</label>
            <label id="matrix_fixes_1" style="color: red" />
        </div>
        <input type="text" id="matrix1" value="1, 0, 0, 1" style="width: 150px;" />
    </div>
    <div style="display: inline-block; float: right;">
        <div>
            <label>End</label>
            <label id="matrix_fixes_2" style="color: red" />
        </div>
        <input type="text" id="matrix2" value="-1, i, i, -1" style="width: 150px;" />
    </div>
</div>
<canvas id="drawCanvas" width="500px" height="200px" />

<script src="/assets/QubitOperationInterpolation.js"></script>

(Side note: The input correction is done by doing a [singular value decomposition](http://en.wikipedia.org/wiki/Singular_value_decomposition) and omitting the non-unitary factor. This turns out to be really, really effective.)

You can play with the [demo's source code on jsfiddle](http://jsfiddle.net/ezg6xn7u/1/).

But enough demo, let's see how it's done.

**Implementation**

First, we need a way to break a unitary operation into its quaternion and phase parts. Let's start by crushing our parametrization of the unitary group into a single matrix:

$U = e^{\phi i} \begin{bmatrix} i \cos{\theta} + z \sin{\theta} & (x + i y) \sin{\theta} \\\\ (x - i y) \sin{\theta} & i \cos{\theta} - z \sin{\theta} \end{bmatrix}$

The values we want to extract are the phase $\phi$, and the quaternion-esque components $i \cos(\theta)$, $x \sin(\theta)$, $y \sin(\theta)$, and $z \sin(\theta)$.

Notice that $x \sin(\theta)$ and $y \sin(\theta)$ only contribute to the top-right and bottom-left parts of the matrix. Additionally, $x \sin(\theta)$ contributes symmetrically while $y \sin(\theta)$ contributes anti-symmetrically. This lets us solve for their values, although still mixed with the phase, by taking the sum and difference along the diagonal. The same holds for $z \sin(\theta)$ and $i \cos(\theta)$ along the other diagonal.

To remove the phase factor $e^{\phi i}$ from the values we extracted, we use the fact that it should be the only contributor of complex values. We can pick any one of the four quaternion components we extracted (as long as it's not zero), and pick a phase factor that will make our chosen component real. Because we're guaranteed that the given matrix is unitary, this same phase factor should make all the other quaternion components real.

Here's some python code that does the described factoring:

```python
import numpy as np
import math

def unitary_breakdown(m):
    """
    Breaks a 2x2 unitary matrix into quaternion and phase components.
    """
    # Extract rotation components
    a, b, c, d = m[0, 0], m[0, 1], m[1, 0], m[1, 1]
    t = (a + d)/2j
    x = (b + c)/2
    y = (b - c)/-2j
    z = (a - d)/2

    # Extract common phase factor
    p = max([t, x, y, z], key=lambda e: abs(e))
    p /= abs(p)
    pt, px, py, pz = t/p, x/p, y/p, z/p

    q = [pt.real, px.real, py.real, pz.real]
    return q, p
```

Now that we can factor the problem into the rotation and phase parts, we can interpolate them separately.

For the rotation part, we're going to use [spherical interpolation](http://en.wikipedia.org/wiki/Slerp) (i.e. "slerping"). To slerp between two points, $p\_0$ and $p\_1$, you find an angle satisfying $\cos(\theta) = p\_0 \cdot p\_1$ and then return this:

$\text{Slerp}(p\_0, p\_1, t) = \frac{\sin(\theta (1-t))}{\sin(\theta)} p\_0 + \frac{\sin(\theta t)}{\sin(\theta)} p\_1$

One obstacle here is the division by zero when $\theta$ is zero. Fortunately, because the numerator approaches zero in basically the same way as the denominator, this is a case where the resulting value does not diverge. We can define a function that computes $\frac{\sin(x f)}{\sin(x)}$, but switches to an approximation that doesn't divide by zero or magnify floating point errors when near zero:

```python
def sin_scale_ratio(theta, factor):
    """
    Returns sin(theta * factor) / sin(theta), with care around the origin to avoid dividing by zero.
    """
    # Near zero, switch to a Taylor series based approximation to avoid floating point error blowup.
    if abs(theta) < 0.0001:
        # sin(x) = x - x^3/3! + ...
        # sin(f x) / sin(x)
        # = ((fx) - (fx)^3/3! + ...) / (x - x^3/3! + ...)
        # ~= ((fx) - (fx)^3/3!) / (x - x^3/3!)
        # = (f - f(fx)^2/3!) / (1 - x^2/3!)
        # = f (1 - f^2 x^2/6) / (1 - x^2/6)
        d = theta * theta / 6
        return factor * (1 - d * factor * factor) / (1 - d)
    return math.sin(theta * factor) / math.sin(theta)
```

We'll use the above method in the full interpolation method when slerping.

To do the angular interpolation, we do the obvious: figure out the difference between the two angles, watch out for going the long way around, and then do what is effectively a linear interpolation. Getting the sign of the difference correct is tricky, but I've [previously explained how do it](http://strilanc.com/math/2014/03/11/Ordering-Cyclic-Sequence-Numbers.html) so we'll just assume it's easy.

Putting it all together, we get:

```python
def unitary_lerp(u1, u2, t):
    """
    Interpolates between two 2x2 unitary numpy matrices.
    """
    # Split into rotation and phase parts
    q1, p1 = unitary_breakdown(u1)
    q2, p2 = unitary_breakdown(u2)

    # Spherical interpolation of rotation
    dot = sum(v1*v2 for v1,v2 in zip(q1, q2))
    if dot < 0:
        # Don't go the long way around...
        q2 *= -1
        p2 *= -1
        dot *= -1
    theta = math.acos(min(dot, 1))
    c1 = sin_scale_ratio(theta, 1-t)
    c2 = sin_scale_ratio(theta, t)
    u3 = (u1 * c1 / p1 + u2 * c2 / p2)

    # Angular interpolation of phase
    a1 = np.angle(p1)
    a2 = np.angle(p2)
    da = (a2 - a1 + math.pi) % (math.pi * 2) - math.pi  # smallest signed angle distance (mod 2pi)
    a3 = a1 + da * t
    p3 = math.cos(a3) + 1j * math.sin(a3)
    return u3 * p3
```

Which is the code used by the demo (except it's python instead of Javascript, hurray!).

**Summation**

Single qubit operations are a lot like rotations, but with an added phase factor. You can use this fact to create a method for interpolating between two 2x2 unitary matrices.

The method described in this post works, but is not optimal. For example, it doesn't guarantee a constant angular velocity. Also, in some cases it doesn't take the shortest possible path.
