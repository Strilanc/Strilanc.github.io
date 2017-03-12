---
layout: post
title: "Unit Testing with Symbols"
date: 2015-07-20 11:30:00 EST
categories: programming
---

Recently, I tried out [SymPy](http://sympy.org), a symbolic math library for python.
SymPy can do (among other things) algebra:

    >>> import sympy
    >>> x, y = sympy.symbols(['x', 'y'])
    >>> print sympy.expand((x + 2)*(x + y))
    x**2 + x*y + 2*x + 2*y

It's a very handy tool to have around, especially if you're fed up with Wolfram Alpha being truly awful at parsing.

One use for SymPy, that I didn't expect at all ahead of time, is writing unit tests that cover general cases.

Suppose you've written a space-efficient single-pass function to compute the population variance of a collection.
You want to test this method.
You *could* check lots of cases for specific inputs... or you could use symbols to cover *every* input (of a fixed length) with a single test:

    def population_variance(u):
        """
        >>> import sympy
        >>> sympy.expand(population_variance(sympy.symbols(['a', 'b', 'c'])))
        2*a**2/9 - 2*a*b/9 - 2*a*c/9 + 2*b**2/9 - 2*b*c/9 + 2*c**2/9
        """
        n = 0
        s = 0
        t = 0
        for e in u:
            n += 1
            s += e**2
            t += e
        return s/n - (t/n)**2

Notice that the doc test's expected result is basically a *definition* of the standard deviation of three elements.
So if the symbolic inputs give a symbolic output that matches the expectation, it should work for *all* three element lists (as opposed to potentially only working for whatever specific numeric cases we test).

(You either generate the expected result by hand, or by using a known-to-be-correct reference method.
SymPy helps out by canonicalizing how it prints equations, with terms in lexicographic order.)

Tests with symbols don't just cover more cases, they're less susceptible to false positives where a test succeeds for the wrong reason.
It's still possible to create wrong implementations that pass the test, but they tend to need *bigger, easier to spot* mistakes than what's needed to fool specific tests.

The main downside of testing with symbols is its limited applicability.
First, you can't condition on symbols.
Interpreting `if a > 1:` raises an error when `a` is a symbol, and *lots* of functions branch based on their inputs.
Second, many standard and third party functions won't work on symbols (e.g. `math.cos` and `numpy.array`).
If the function you're testing uses an incompatible function, directly or indirectly, it won't give useful result.
Third, because testing with symbols relies so heavily on duck typing, it doesn't translate to (most) statically typed languages.

Another downside of testing with symbols is that it makes your tests less concrete.
There are some oversights that you'll just spot more easily when using actual values instead of abstract values.
You should still have some tests of concrete cases with actual numeric values... but maybe you won't need as many as before.

Overall, I'd say testing with symbols is an interesting trick to keep in mind.
