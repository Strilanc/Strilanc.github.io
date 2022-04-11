---
layout: post
title: "Inverting Clifford Tableaus"
date: 2020-08-30 10:10:10 am PST
permalink: post/2002
---

In quantum computing, the Cliffords are an extremely important class of operations.
Cliffords are simple enough to [simulate](https://arxiv.org/abs/quant-ph/0406196) [cheaply](https://arxiv.org/abs/quant-ph/0504117),
but expressive enough to represent important quantum protocols like error correction and teleportation.

A quantum operation $C$ is a Clifford operation if, for any operation $P$ from the Pauli group,
conjugating $P$ by $C$ produces an operation $P\_2 = C^\dagger P C^-1$ that is still in the Pauli group.
A quantum operation is in the Pauli group if it decomposes into applying only Pauli gates ($X$, $Y$, or $Z$) to qubits.
For example, $H$ is a Clifford operation, so conjugating $X$ by $H$ should produce a Pauli operation (or product of Pauli operations).
In fact it does: $H^\dagger X H = Z$.
Similarly, $CNOT$ is a Clifford operation and for example $CNOT\_{0 \rightarrow 1}^\dagger \cdot X\_0 \cdot CNOT\_{0 \rightarrow 1} = X\_0 X\_1$ is a product of Pauli operations.

Clifford operations don't just guarantee that they conjugate Pauli products into Pauli products, individual Cliffords are *defined* by how they conjugate Pauli products into Pauli products.
If I tell you I have a secret three qubit Clifford operation $C$, and I tell you how it conjugates a set of generators for the Pauli group over three qubits (e.g. $X\_0$, $Z\_0$, $X\_1$, $Z\_1$, $X\_2$, and $Z\_2$),
then you can figure out exactly which operation I'm talking about.
Putting the conjugated Paulis into a table produces a "Clifford tableau".
This tableau, this list of what the Pauli product generators get mapped to, defines the Clifford operation.

For example, here is the Clifford tableau of the $S$ gate:

```
      | q
------+-xz-
 q    | YZ
 sign | ++
```

The rightmost column (the $q\_z$ column) says that conjugating a $Z$ by an $S$ on the qubit $q$ will produce the Pauli operation $+Z$.
The column to the left of that one (the $q\_x$ column) says $X$ conjugated by $S$ is $+Y$.

The inverse $S$ gate has a very similar Clifford tableau, except that $X$ gets mapped to $-Y$ instead of $+Y$:

```
      | q
------+-xz-
 q    | YZ
 sign | -+
```

One more example.
Here is the Clifford tableau of the $CNOT\_{a \rightarrow b}$ gate:

```
      | a  b
------+-xz-xz-
 a    | XZ _Z
 b    | X_ XZ
 sign | ++ ++
```

This time the rightmost column of the table says that the $CNOT$ operation will conjugate a $Z$ on the target qubit into a $Z$ on both qubits.

When you're given a compound Pauli operation that's not explicitly listed in the Clifford tableau, you can decompose it into a product of columns that are in the tableau.
For example, you can figure out what $CNOT$ does to $X\_a Z\_b$ by multiplying the columns for $X\_a$ and $Z\_b$.
Similarly, you can figure out what the $S$ gate conjugates $Y$ into by decomposing $Y = iXZ$.
In detail: $S^\dagger Y S = S^\dagger (iXZ) S = i S^\dagger X (S^\dagger S) Z S = i (S^\dagger X S) (S^\dagger Z S) = iYZ = -X$.

# Operating on Tableaus

If we're given two tableaus $A$ and $B$, we can compose them by creating a new tableau $T = BA$ where each column is what you get when conjugating by $A$'s operation then by $B$'s operation.

Here is some pythonic pseudocode showing the general idea:

```python
def __matmul__(self, rhs: 'CliffordTableau') -> 'CliffordTableau':
    return CliffordTableau(mapping={
        generator: self(rhs(generator))
        for qubit in self.qubits() | other.qubits()
        for generator in [X(qubit), Z(qubit)]
	})
```

A more interesting problem is computing the inverse of a tableau.
When I first ran into this Clifford-tableau-inverse-computing problem, I found it rather tricky.
Ultimately, the solution was much simpler than I expected.
Instead of being similar to inverting an arbitrary complex matrix, inverting a Clifford tableau is like inverting a unitary matrix.
It's just a transpose with a few tweaks!

To see how this can possibly be, consider that conjugating two operations by a common Clifford operation will preserve commutation relationships between the operations.
If $A$ commutes with $B$, and $C$ is a Clifford operation, then $C^\dagger AC$ commutes with $C^\dagger BC$.
If $A$ anti-commutes with $B$, then $C^\dagger AC$ anti-commutes with $C^\dagger BC$.
(This is just a specific case of unitary operations [preserving the angle between states](http://vergil.chemistry.gatech.edu/notes/quantrev/node17.html).)

Now let's suppose that the operations $A$ and $B$ are single-qubit Pauli operations.
Suppose that the result of conjugating $A$ by $C$ commutes with $B$ in a particular way, i.e. the commutator $\\{C^\dagger A C, B\\} = rI$ for some scalar $r$.
Conjugating both sides of that commutator by $C^\dagger$ won't change its value, therefore $\\{A, C B C^\dagger\\} = rI = \\{C^\dagger A C, B\\}$.

We can specialize this commutation relationship to the generators of the Pauli group over two qubits $a, b$:

$$\\{X\_a, C^\dagger X\_b C\\} = \\{C X\_a C^\dagger, X\_b\\}$$

$$\\{X\_a, C^\dagger Z\_b C\\} = \\{C X\_a C^\dagger, Z\_b\\}$$

$$\\{Z\_a, C^\dagger X\_b C\\} = \\{C Z\_a C^\dagger, X\_b\\}$$

$$\\{Z\_a, C^\dagger Z\_b C\\} = \\{C Z\_a C^\dagger, Z\_b\\}$$

These four equalities are extremely useful to us.
The left hand side values can easily be determined using the Clifford tableau.
We can check in constant time if the column for $X\_a$ and/or $Z\_a$ has a term on $b$ that anti-commutes with $X\_b$ and/or $Z\_b$.
The right hand side values form a set of constraints that completely determine what the $a$ part of the output for the $X\_b$ and $Z\_b$ columns of the inverse tableau must be.
So, looking at only how $C$ turns Paulis on $a$ into Paulis on $b$ (ignoring the Paulis on other qubits), we can determine how the inverse of $C$ must turn Paulis on $b$ into Paulis on $a$ (ignoring Paulis on other qubits).
This "locality" property of the inverting operation was very surprising to me!
Even though the Clifford operation we're talking about may touch many qubits in a non-local entangling-the-qubits sort of way, local information about how Pauli terms flow between pairs of qubits is still local when switching to its inverse.

I wrote some python code that solves for the backward-flowing Pauli terms given the forward-flowing Pauli terms:

```python
import cirq

def _inverse_flow(image_x: cirq.Pauli, image_z: cirq.Pauli) -> Tuple[cirq.Pauli, cirq.Pauli]:
    c_xx = cirq.commutes(image_x, cirq.X)
    c_xz = cirq.commutes(image_x, cirq.Z)
    c_zx = cirq.commutes(image_z, cirq.X)
    c_zz = cirq.commutes(image_z, cirq.Z)

    matches_x = [
        px
        for px in [cirq.I, cirq.X, cirq.Y, cirq.Z]
        if c_xx == cirq.commutes(px, cirq.X)
        if c_zx == cirq.commutes(px, cirq.Z)
    ]

    matches_z = [
        pz
        for pz in [cirq.I, cirq.X, cirq.Y, cirq.Z]
        if c_xz == cirq.commutes(pz, cirq.X)
        if c_zz == cirq.commutes(pz, cirq.Z)
    ]

    assert len(matches_x) == len(matches_z) == 1

    return matches_x[0], matches_z[0]
```

Using this code, we can print out the substitution to apply (the local tweaks to use) after transposing when computing the inverse:

```python
import itertools
for a, b in itertools.product([cirq.I, cirq.X, cirq.Y, cirq.Z], repeat=2):
    a2, b2 = _inverse_flow(a, b)
    print(a, b, '->', a2, b2)
# I I -> I I
# I X -> I X
# I Y -> X X
# I Z -> X I
# X I -> I Z
# X X -> I Y
# X Y -> X Y
# X Z -> X Z
# Y I -> Z Z
# Y X -> Z Y
# Y Y -> Y Y
# Y Z -> Y Z
# Z I -> Z I
# Z X -> Z X
# Z Y -> Y X
# Z Z -> Y I
```

Using the above information, can you figure out what the inverse of this Clifford tableau is?

```
      | 0  1  2  3
------+-xz-xz-xz-xz-
 0    | ZY ZY XZ _X
 1    | _Y ZY Z_ ZZ
 2    | Y_ YX XX XX
 3    | ZZ ZZ _X XZ
 sign | -- -- -+ +-
```

It's quite easy.
First, you transpose the entries, then you go over each term and apply the Pauli pair mapping printed out above.
The result is:

```
      | 0  1  2  3
------+-xz-xz-xz-xz-
 0    | YX XX ZZ Y_
 1    | YX YX ZY Y_
 2    | XZ Z_ _Y _X
 3    | _X Y_ _Y XZ
 sign | ?? ?? ?? ??
```

However, note the question marks in the sign row.
How do we determine the signs of the inverted Pauli products?

Well... maybe there's some clever way to do it.
But what I do is just start by assuming the sign of a column is `+`, then check whether or not sending that colum through the original Clifford operation unpacks it back into the columns' input (or else its negation).
If it got negated, then I know the sign was wrong so I flip it:

```python
# Correct the signs.
for generator, output in list(columns.items()):
    columns[generator] *= original_operation(output).coefficient
```

Using this process, we can determine the signs:

```
      | 0  1  2  3
------+-xz-xz-xz-xz-
 0    | YX XX ZZ Y_
 1    | YX YX ZY Y_
 2    | XZ Z_ _Y _X
 3    | _X Y_ _Y XZ
 sign | ++ -+ +- -+
```

The method I just described for computing the signs has a time cost of $O(n^3)$ where $n$ is the number of qubits operated on by the Clifford operation.
The rest of the inversions process, the transposing-and-tweaking, has cost $O(n^2)$.
Is there an overall $O(n^2)$ algorithm, similar to how unitary matrices can be inverted in $O(n^2)$?
I don't know.

# Simple Python Implementation

As part of writing this post, I implemented a `CliffordTableau` class in python.
You can find it [on github at Strilanc/CliffordTableau](https://github.com/Strilanc/CliffordTableau).

Here's an example of using the code:

```python
import cirq
from clifford_tableau import CliffordTableau

a, b = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(b), cirq.CNOT(a, b), cirq.H(b))
tableau = CliffordTableau(circuit)
print(tableau)
#       | 0  1
# ------+-xz-xz-
#  0    | XZ Z_
#  1    | Z_ XZ
#  sign | ++ ++

print(tableau(cirq.X(a)))
# X(0)*Z(1)

print(tableau(cirq.X(a) * cirq.Y(b)))
# -Y(0)*X(1)

assert tableau == CliffordTableau(cirq.CZ(a, b))
s = CliffordTableau(cirq.S(a))
assert s.inverse() == CliffordTableau(cirq.S(a)**-1) != s
assert s.then(s) == CliffordTableau(cirq.Z(a))
```

**Caution**: the code is not performant, because a) it's in Python and b) there are quadratic overheads due to the internal use of immutable data structures.


# Closing remarks

If you often need the inverse of your Clifford operations, a workaround for the sign inversion costing $O(n^3)$ is to include a sign *column* in the tableau, corresponding to the sign row of the inverse tableau.
The new sign column can be kept up to date when composing tableaus at no additional cost (asymptotically speaking), and reduces the cost of inversion to $O(n^2)$.
Perhaps this indicates that Clifford tableaus are "supposed" to have a sign column, and one is left wondering what the new cell common to both the sign row and sign column is for.

If you include a sign column, and turn each Pauli pair term into four bits
(and arrange those four bits into a 2x2 square with just the right ordering),
the Clifford tableau becomes a boolean matrix where inverting is *exactly* transposing (no local tweaks needed).
Unfortunately, "just the right ordering" means the XZ ordering of the rows must be opposite to the XZ ordering of the columns.
It's so painfully close to being elegant.

[View r/algassert comment thread](https://www.reddit.com/r/algassert/comments/ijpxm6/inverting_clifford_tableaus/)
