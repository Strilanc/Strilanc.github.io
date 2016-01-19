---
layout: post
title: "Unknowable, but Equal"
date: 2016-01-19 11:30:00 EST
categories: quantum
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Consider this apparent paradox.
The [uncertainty principle](https://en.wikipedia.org/wiki/Uncertainty_principle) applies to position and momentum.
A particle *can't* have both an exact position and an exact momentum *ever*.
But we can produce particles [with entangled momentums and positions](https://books.google.com/books?id=bsANMNMGvWUC&pg=PA71&lpg=PA71&dq=particle+entangled+position+velocity&source=bl&ots=3TblYV3CRD&sig=c6hGY-mB-3fQQtiroxXRDphnrCU&hl=en&sa=X&ved=0ahUKEwjvwbap1rTKAhXIMj4KHXqiAroQ6AEIQDAG#v=onepage&q=particle%20entangled%20position%20velocity&f=false).
Then we can measure the position of one particle, and the momentum of the other.
Which presumably tells us the position and momentum of both particles.
Which is impossible.

If you know some quantum mechanics (i.e. can do the math), I'd recommend thinking about this for awhile.
Why doesn't this punch a hole in the uncertainty principle?
What happens instead?

# Uncertainty in Qubit Land

Like many paradoxes, this one is easier to understand and resolve when thinking in terms of qubits.
Position and momentum are *complicated* in quantum mechanics.
They live in an [infinite dimensional vector space](https://en.wikipedia.org/wiki/Hilbert_space), evolve according to differential equations, and trigger intuitions that are fundamentally wrong.
By using qubits, we can avoid (or at least weaken) all those obstacles.

In qubit land, the uncertainty principle says that a qubit can't have both an exact value along the Z axis and an exact value along the X axis (of the [Bloch sphere](https://en.wikipedia.org/wiki/Bloch_sphere)).
Basically, this is because the exact-Z-value states are not aligned with the exact-X-value states.
Instead of being independent facts about the qubit, they are re-interpretations of the same data.

Consider that a Z-up qubit is in the state $\ket{0}$.
Conversely, a Z-down qubit is in the state $\ket{1}$.
But an X-up qubit is in the state $\frac{1}{\sqrt{2}} (\ket{0} + \ket{1})$, and an X-down qubit is in the state $\frac{1}{\sqrt{2}} (\ket{0} - \ket{1})$.
I hope you see the problem: the exact-X states are a mix of the exact-Z states (and vice versa)!
Asking for a state that is both Z-up and X-up is like asking for a line to be both aligned with and diagonal to your coordinate system.
It's simply impossible to satisfy both conditions.
There is no getting around this.
Ever.
By definition.
[Even if the line is drawn in red ink](https://www.youtube.com/watch?v=BKorP55Aqvg).

There is a mathematically elegant way to tell if two quantum values ("observables") are incompatible in this way: observables are defined by a matrix, and observables are compatible iff their matrices commute (i.e. $A \cdot B = B \cdot A$).
For example, the matrix defining the Z axis observable is $Z = \bimat{1}{0}{0}{-1}$ and the matrix defining the X axis observable is $X = \bimat{0}{1}{1}{0}$.
Compute the [commutator](https://en.wikipedia.org/wiki/Commutator) and you find that $\left[ X, Z \right] = XZ - ZX = (-iY) - (iY) = -2iY \neq 0$ (note: $Y$ is the other [Pauli matrix](https://en.wikipedia.org/wiki/Pauli_matrices)).
The commutator's not zero, so the $X$ and $Z$ values are incompatible.

(*Explaining [why the commutator tells you if values are compatible](http://physics.stackexchange.com/questions/9194/what-is-the-physical-meaning-of-commutation-of-two-operators) is outside the scope of this post.
We'll just be treating it as a magical "are they compatible?" oracle.*)

An example of observables that do commute is the X-value of one qubit and the Z-value of a second unrelated qubit.
In that case the system is larger and the observables are defined by the matrices $X \otimes I$ and $I \otimes Z$ respectively, where $\otimes$ is the [kronecker product](https://en.wikipedia.org/wiki/Kronecker_product).
Those matrices commute:

$\left[ X \otimes I, I \otimes Z \right]$

$= (X \otimes I) \cdot (I \otimes Z) - (I \otimes Z) \cdot (X \otimes I)$

$= (X \cdot I) \otimes (I \cdot Z) - (I \cdot X) \otimes (I \cdot Z)$

$= X \otimes Z - X \otimes Z$

$= 0$

This is why, when I tell you that I made a qubit and measured its X-value to be up, you don't get angry at me for messing up your qubit's Z-value.
The observables commute; they represent independent or compatible facts.

# Entangling Multiple Axes

All the observables I've mentioned so far tell you a value related to a single qubit, but there are also observables for joint values involving multiple qubits.
Notably, whether or not two qubits *agree* along the X axis is determined by the $X \otimes X$ observable.
Similarly, Z-agreement is measured by the $Z \otimes Z$ observable.

Now here comes the mind-bender.
Even though $X$ and $Z$ don't commute, $X \otimes X$ commutes with $Z \otimes Z$:

$\left[ X \otimes X, Z \otimes Z \right]$

$= (X \otimes X) \cdot (Z \otimes Z) - (Z \otimes Z) \cdot (X \otimes X)$

$= (X \cdot Z) \otimes (X \cdot Z) - (Z \cdot X) \otimes (Z \cdot X)$

$= (-iY) \otimes (-iY) - (iY) \otimes (iY)$

$= (-i)^2 (Y \otimes Y) - i^2 (Y \otimes Y)$

$= (-1) (Y \otimes Y) - (-1) (Y \otimes Y)$

$= 0$

So... we already knew that a qubit can't ever have both an exact X-value and an exact Z-value.
But now we see that *two* qubits can agree along the X-axis *and* agree along the Z-axis *at the same time*.
Thus the title of this post: Unknowable, but Equal.
The math prevents X and Z from both having an exact value, but allows for states where those impossible-to-have values simultaneously agree.

This brings us back to our paradox: if two qubits can agree along both the X-axis and the Z-axis, and measuring one along the X axis commutes with measuring the other along the Z axis, what's stopping us from learning both the X-value and Z-value of one of the qubits?
If you try the experiment you'll find you end up with one qubit having only an exact X-value and the other having only an exact Z-value.
Where did the agreement go?

Of course, the problem here ultimately comes down to some observables being incompatible.
But probably not the ones you're thinking of.

# Does Not Commute

Suppose we prepare two qubits into a [singlet state](https://en.wikipedia.org/wiki/Singlet_state) $\ket{01} - \ket{10}$.
In this state, the first qubit's value always disagrees with the second qubit's, if you measure them both along the same axis.
That is to say, both the X-agreement value $X \otimes X$ and the Z-agreement value $Z \otimes Z$ are set to "disagree".
We have an exact value for both $X \otimes X$ and $Z \otimes Z$.

Consider: is setting both of those observables to "disagree" *compatible* with the first qubit having an exact Z-value?
Do $Z \otimes Z$ and $X \otimes X$ commute with $Z \otimes I$?
Let's check.

Things start off seeming okay.
The $Z \otimes Z$ observable is compatible with the $Z \otimes I$ observable:

$\left[ Z \otimes Z, Z \otimes I \right]$

$= (Z \otimes Z) \cdot (Z \otimes I) - (Z \otimes I) \cdot (Z \otimes Z)$

$= (Z \cdot Z) \otimes (Z \cdot I) - (Z \cdot Z) \otimes (Z \cdot I)$

$= 0$

That makes sense.
Knowing the Z-value of both qubits clearly had to be compatible with knowing whether their Z-values agreed.
But the $X \otimes X$ observable causes a bit of a problem:

$\left[ X \otimes X, Z \otimes I \right]$

$= (X \otimes X) \cdot (Z \otimes I) - (Z \otimes I) \cdot (X \otimes X)$

$= (X \cdot Z) \otimes (X \cdot I) - (Z \cdot X) \otimes (I \cdot X)$

$= (-iY) \otimes X - (iY) \otimes X$

$= (-2iY) \otimes X$

$\neq 0$

Oh.
**Agreeing along X is incompatible with either qubit having an exact Z-value.**
The space of exact-X-agreement states runs diagonal to the space of exact-Z-value states.
The X-agreement direction *involves a mix of* the Z-value directions.
You can have one be exact, or the other, but not both.
(And vice versa: agreeing along Z is incompatible with either qubit having an exact X-value.)

The incompatibility between agreement along one axis and exact values along another axis means that, when we measure either of the qubits along the Z axis, we are necessarily destroying the X-agreement.
After we measure the other qubit along the X axis, also destroying the Z-agreement's exact value, there is no agreement left.
We end up with one qubit with an exact X-value, another qubit with an exact Z-value, and no correlation between them.

That's what always happens when you try to play tricks on Heisenberg's uncertainty principle.
You think you've backed it into a corner, but then you realize the uncertainty principle applies to the concept of backing things into a corner.
We tried to break the incompatibility between Z-value and X-value by using X-agreement, only to discover X-agreement is *also* incompatible with Z-value.

# Summary

The paradox is simpler in qubit land.
The resolution is that agreement along one axis is incompatible with having exact values along another axis.
There is an uncertainty relationship between exact-X-agreement and exact-Z-values (and vice versa).

Analogously, there is an uncertainty relationship between position-*agreement* and momentum, and also an uncertainty relationship between momentum-agreement and position.
If position and momentum are entangled to agree simultaneously, the individual values are necessarily uncertain.
Furthermore, measuring the positions destroys the agreement in momentums while measuring the momentums destroys the agreement in positions.

When you try to mess with Heisenburg, Heisenburg messes with you.