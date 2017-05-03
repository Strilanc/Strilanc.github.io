---
layout: post
title: "Density Matrices are a Monad"
date: 2017-05-01 6:10:10 EST
comments: true
---

Years ago, I wrote the post [What isn't a Monad](http://twistedoakstudios.com/blog/Post5485_what-isnt-a-monad), and gave quantum superpositions as an example of a data structure that didn't follow the rules that qualify something as a monad.
Turns out that's not *quite* right.

# Monads

['Monad'](https://en.wikipedia.org/wiki/Monad_%28functional_programming%29) is a contract that data structures can satisfy.
Like being iterable, or comparable.
To be a monad, three basic operations must be supported: wrapping values, transforming values, and flattening.

For example, the list data type is a monad because you can create a list containing an item (wrapping), apply a function to every item in a list (transforming), and concatenate a list of lists into a single list (flattening).
Another example of a monad is probability distributions:

```python
# Implementing wrapping/transforming/flattening of probability distributions.
# Using a raw value:probability dictionary representation.
def wrap(item):
    return {item: 1.0}
def map(distribution, transformation):
    result = defaultdict(0.0)
    for value, probability in distribution:
        result[transformation[value]] += probability
    return result
def flat(distribution_of_distributions):
    result = defaultdict(0.0)
    for distribution, distribution_probability in distribution_of_distributions:
        for value, value_probability in distribution:
            result[value] += distribution_probability * value_probability
    return result
```        

Given that probability distributions are monadic, and that quantum superpositions are similar to probability distributions, you might expect that quantum superpositions are also monadic.
But there's a problem: users might ask for transformations that aren't reversible, and amplitudes break in that situation.

Suppose a user asks you to transform the items in the superposition $\frac{1}{\sqrt 2} \ket{0} + \frac{1}{\sqrt 2} \ket{1}$ with the constant function $f(\ket{x}) = \ket{2}$.
You apply the function to the values $\frac{1}{\sqrt 2} f(\ket{0} + \frac{1}{\sqrt{2}} f(\ket{1})$ and find that the output is $\frac{1}{\sqrt 2} \ket{2} + \frac{1}{\sqrt 2} \ket{2} = \sqrt{2} \ket{2}$.
But this output is malformed!
The amplitudes that make up a superposition are supposed to become probabilities when you square them, and together the probabilities must add up to 100%.
The transformation created an amplitude of $\sqrt{2}$, corresponding to a total probability of 200%, breaking everything.

That's why I concluded that quantum superpositions weren't monadic.
But it turns out there is a way to make things work.

# Density Matrices

A [density matrix](https://en.wikipedia.org/wiki/Density_matrix) is a succinct representation for a probability distribution of superpositions.
When you know your system is in superposition, but you're not quite sure *which* superposition, a density matrix is an excellent way to represent the situation

To turn a superposition $\ket{\psi}$ into a density matrix, you just compute the column-vector-times-row-vector product of $\ket{\psi}\bra{\psi}$.
For example, the density matrix corresponding to the superposition $\frac{3}{5} \ket{0} + \frac{4i}{5} \ket{1}$ is:

$$\begin{align}
\ket{\psi}\bra{\psi}
&= \left(\frac{3}{5} \ket{0} + \frac{4i}{5} \ket{1}\right) \left(\frac{3}{5} \bra{0} + \frac{-4i}{5} \bra{1}\right)
\\\\
&=\begin{bmatrix} \frac{3}{5} \\\\ \frac{4i}{5} \end{bmatrix} \begin{bmatrix} \frac{3}{5} & \frac{-4i}{5} \end{bmatrix}
\\\\
&= \frac{1}{25} \bimat{9}{-12i}{12i}{16}
\end{align}$$

The *really* nice thing about density matrices is that the representation for "$p$ chance of $A$, $q$ chance of $B$" is just $pA + qB$.
If you're 60% sure your qubit is in the state $\ket{\psi\_1} = \frac{1}{\sqrt 2} \ket{0} - \frac{1}{\sqrt 2} \ket{1}$, but there's a 40% chance it's in the state $\ket{\psi\_2} = \ket{0}$, then that's represented as:

$$\begin{align}
0.6 \ket{\psi\_1} \bra{\psi\_1} + 0.4 \ket{\psi\_2} \bra{\psi\_2}
&= \frac{6}{10} \bimat{\frac 1 2}{-\frac 1 2}{-\frac 1 2}{\frac 1 2} + \frac{4}{10} \bimat{1}{0}{0}{0}
\\\\
&=\frac{1}{10}\bimat{5}{-3}{-3}{3}
\end{align}$$

You can also recover an explicit probability distribution of superpositions from a density matrix by computing its eigendecomposition.
Interestingly, it may not be the same distribution of superpositions that you put in!
This happens whenever two probability distibutions of superpositions are *observationally indistinguishable*.
It sounds like a problem, but it's actually hugely useful: you're not bothering to keep unobservable details.

This ability to represent uncertainty is just what we need to fix our monad problem.
When two values get collided into one value, we can output a state corresponding to "we're not sure which one" instead of inappropriately interfering the two values.

# Transforming Items in a Density Matrix

Suppose we have a density matrix $\rho$ over some items $A$, $B$, and $C$:

$$\rho = \begin{array}{c|cccc}
  & A\_1 & A\_2 & B
\\\\
\hline
A\_1 & 1/2 & 0 & 0 \\\\
A\_2 & 0 & 1/4 & 1/4 \\\\
B & 0 & 1/4 & 1/4 \\\\
\end{array}
$$

This corresponds to a 50% chance of $\ket{A\_1}$ and a 50% chance of $\frac{1}{2} \ket{A\_2} + \frac{1}{2} \ket{B}$.

So suppose I give you access to this quantum state, but I make sure that everything you is symmetric w.r.t. $A\_1$ and $A\_2$.

Now the user applies a transformation that leaves $B$ alone, but collapses $A\_1$ and $A\_2$ to just $A$.
What's the resulting density matrix?



However, the items are *also* density matrices:

$$
\begin{align}
A &= \begin{array}{c|cccc}
  & \`\text{arm'}
\\\\
\hline
\`\text{arm'} & 1
\end{array}
\\\\
B &= \begin{array}{c|cccc}
  & \`\text{bag'} & \`\text{bid'}
\\\\
\hline
\`\text{bag'} & 1/2 & i/2 \\\\
\`\text{bid'} & -i/2 & 1/2
\end{array}
\\\\
C &= \begin{array}{c|cccc}
  & \`\text{cat'} & \`\text{con'} & \`\text{cup'}
\\\\
\hline
\`\text{cat'} & 9/50 & 6/25 & 0 \\\\
\`\text{con'} & 6/25 & 1/2 & 6/25 \\\\
\`\text{cup'} & 0 & 6/25 & 8/25
\end{array}
\end{align}$$

Our goal is to *f*latten** $\rho$.
We have a density-matrix-of-density-matrices-of-strings, but we want a density-matrix-of-strings instead.
In other words, we want to fill in this density matrix:

$$\rho\_{\text{flat}} = \begin{array}{c|cccccc}
  & \`\text{arm'} & \`\text{bag'} & \`\text{bid'} & \`\text{cat'} & \`\text{con'} & \`\text{cup'}
\\\\
\hline
\`\text{arm'} & ? & ? & ? & ? & ? & ? \\\\
\`\text{bag'} & ? & ? & ? & ? & ? & ? \\\\
\`\text{bid'} & ? & ? & ? & ? & ? & ? \\\\
\`\text{cat'} & ? & ? & ? & ? & ? & ? \\\\
\`\text{con'} & ? & ? & ? & ? & ? & ? \\\\
\`\text{cup'} & ? & ? & ? & ? & ? & ? 
\end{array}
$$

Under the constraint that $\rho\_\text{flat}$ should be somehow "equivalent" to $\rho$.

The trick to making this work is to turn $\rho$, $A$, $B$, and $C$ into probability distributions (of superpositions), via eigendecomposition.
Nested probability distributions are easy to flatten, and after doing so we can recombine the various possibilities back into a single density matrix.

Performing the eigendecompositions, we find that:

$$\begin{align}
\rho &= 50\% [\rho\_1] + 50\% [\rho\_2]
\\\\
A &= 100\% [a\_1]
\\\\
B &= 100\% [b\_1]
\\\\
C &= 74\% [c\_1] + 26\% [c\_2]
\\\\
\rho\_1 &= A
\\\\
\rho\_2 &= \frac{1}{\sqrt{2}} B + \frac{1}{\sqrt{2}} C
\\\\
\ket{a\_1} &= \ket{\`\text{arm'}}
\\\\
\ket{b\_1} &= \frac{1+i}{2} \ket{\`\text{bag'}} + \frac{1-i}{2} \ket{\`\text{bid'}}
\\\\
\ket{c\_1} &= \frac{3}{\sqrt{74}} \ket{\`\text{cat'}} + \frac{7}{\sqrt{74}} \ket{\`\text{con'}} + \frac{4}{\sqrt{74}} \ket{\`\text{cup'}}
\\\\
\ket{c\_2} &= \frac{3}{\sqrt{26}} \ket{\`\text{cat'}} + \frac{1}{\sqrt{26}} \ket{\`\text{con'}} - \frac{4}{\sqrt{26}} \ket{\`\text{cup'}}
\end{align}$$

And we replace:

And now we can put together our density matrix:

$$\rho\_{\text{flat}} = \begin{array}{c|c|c|c}
  & \`\text{arm'} & \`\text{bag'} \text{ } \`\text{bid'} & \`\text{cat'} \text{ } \`\text{con'} \text{ } \`\text{cup'}
\\\\
\hline
\`\text{arm'} & \ket{A} \bra{A} & \ket{B} \bra{A} & \ket{C} \bra{A} \\\\
\hline
\`\text{bag'} \\\\
 & \ket{A} \bra{B} & \ket{B} \bra{B} & \ket{C} \bra{B} \\\\
\`\text{bid'} \\\\
\hline
\`\text{cat'} \\\\
\`\text{con'} & \ket{A} \bra{C} & \ket{B} \bra{C} & \ket{C} \bra{C} \\\\
\`\text{cup'}
\end{array}
$$

$$\rho\_{\text{flat}} = \begin{array}{c|c|c|c}
  & \`\text{arm'} & \`\text{bag'} \text{ } \`\text{bid'} & \`\text{cat'} \text{ } \`\text{con'} \text{ } \`\text{cup'}
\\\\
\hline
\`\text{arm'} & \frac{1}{2} A & 0 \ket{b\_1} \bra{a\_1} & 0 \left(74\% \ket{c\_1} + 26\% \ket{c\_2} \right) \bra{a\_1} \\\\
\hline
\`\text{bag'} \\\\
 & 0 \ket{a\_1} \bra{b\_1} & \frac{1}{4} B & \frac{1}{4} \left(74\% \ket{c\_1} + 26\% \ket{c\_2} \right) \bra{b\_1} \\\\
\`\text{bid'} \\\\
\hline
\`\text{cat'} \\\\
\`\text{con'} & 0 \ket{a\_1} \left(74\% \bra{c\_1} + 26\% \bra{c\_2} \right) & \frac{1}{4} \ket{b\_1} \left(74\% \bra{c\_1} + 26\% \bra{c\_2} \right)  & \frac{1}{4} C \\\\
\`\text{cup'}
\end{array}
$$

$$\rho\_{\text{flat}} = \begin{array}{c|c|c|c}
  & \`\text{arm'} & \`\text{bag'} \text{ } \`\text{bid'} & \`\text{cat'} \text{ } \`\text{con'} \text{ } \`\text{cup'}
\\\\
\hline
\`\text{arm'} & \frac{1}{2} A & 0 & 0 \\\\
\hline
\`\text{bag'} \\\\
 & 0 & \frac{1}{4} B & \frac{74}{400} \ket{c\_1}\bra{b\_1} + \frac{26}{400} \ket{c\_2}\bra{b\_1} \\\\
\`\text{bid'} \\\\
\hline
\`\text{cat'} \\\\
\`\text{con'} & 0 & \frac{74}{400} \ket{b\_1}\bra{c\_1} + \frac{26}{400} \ket{b\_1}\bra{c\_2}  & \frac{1}{4} C \\\\
\`\text{cup'}
\end{array}
$$

$$\rho\_{\text{flat}} = \begin{array}{c|c|cc|ccc}
  & \`\text{arm'} & \`\text{bag'} & \`\text{bid'} & \`\text{cat'} & \`\text{con'} & \`\text{cup'}
\\\\
\hline
\`\text{arm'} & 1/2 & 0 & 0 & 0 & 0 & 0 \\\\
\hline
\`\text{bag'} & 0 & 1/8 & i/8 & ? & ? & ? \\\\
\`\text{bid'} & 0 & -i/8 & 1/8 & ? & ? & ? \\\\
\hline
\`\text{cat'} & 0 & ? & ? & 9/200 & 6/100 & 0 \\\\
\`\text{con'} & 0 & ? & ? & 6/100 & 1/8 & 6/100 \\\\
\`\text{cup'} & 0 & ? & ? & 0 & 6/100 & 8/100 
\end{array}
$$

$\rho$ has a 50% chance of being just $A$, and a 50% chance of being a linear combination of $B$ and $C$.
$A$ is just always 'arm'.
$B$ is also a pure state (like $A$), but a linear combination.
$C$ has a 74% chance of being one linear combination, and a 26% chance of being a different linear combination.

Merging that together, we get:

$$\begin{align}
\rho\_{\text{flat}}
&=&+ 50\% [A]
\\\\
& &+ 50\% \left( \frac{1}{\sqrt{2}} [B] + \frac{1}{\sqrt{2}} [C] \right)
\\\\
&=&+ 50\% \cdot 100% \cdot [\text{arm}]
\\\\
& &+ 50\% \left( \frac{1}{\sqrt{2}} \left( \frac{1+i}{2} \ket{\text{bag}} + \frac{1-i}{2} \ket{\text{bid}} \right)^{\dagger 2} + \frac{1}{\sqrt{2}} \left[ \frac{37}{50} \left( \frac{3}{\sqrt{74}} \ket{\text{cat}} + \frac{7}{\sqrt{74}} \ket{\text{con}} + \frac{4}{\sqrt{74}} \ket{\text{cup}} \right)^{\dagger 2}
+
\frac{13}{50} \left( \frac{3}{\sqrt{26}} \ket{\text{cat}} + \frac{1}{\sqrt{26}} \ket{\text{con}} - \frac{4}{\sqrt{26}} \ket{\text{cup}} \right)^{\dagger 2} \right] \right)
\end{align}$$

**Wrapping**

    def wrap(v):
        return {(v,v): 1}
        
**Transforming**

The tricky thing about transforming the matrix is that distinct inputs may be merged into a single output.
We have to merge them in the matrix as well.

    def transform_values(density_matrix, transformation):
        result = defaultdict()
        for (v1, v2), p in density_matrix:
            t1 = transformation(v1)
            t2 = transformation(v2)
            result[(t1, t2)] += p
        return result

**Flattening**

    def flatten(density_matrix):
        result = DensityMatrixBuilder();
        for v1 in density_matrix.values:
            for v2 in density_matrix.values:
                vc = v1.matrix @ v2.matrix
                for a1 in v1.values:
                    for a2 in v2.values:
                        result[(a1, a2)] += 
            
        for (m1, m2), p in density_matrix:
            for (v1, K), q in m1:
                for (K, v4), r in m2:
                    result[(v1.v4)] += p*q*r
        return result
