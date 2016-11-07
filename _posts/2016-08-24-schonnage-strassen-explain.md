---
layout: post
title: "Schönhage-Strassen Multiplication"
date: 2018-08-26 12:10:10 pm EST
permalink: post/1652
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Back in elementary school, you learned how to multiply numbers with more than one digit: split the problem into a sum of shifted single-digit multiplications.
For example, to multiply $234$ by $567$ you can split $234$ into $234 = 2 \cdot 100 + 3 \cdot 10 + 4$ then distribute that over the multiplication by $567$ to get $234 \cdot 567 = 567 \cdot 2 \cdot 100 + 567 \cdot 3 \cdot 10 + 567 \cdot 4$.
Adding, multiplying by powers of 10, and multiplying by a single digit are all straightforward so all that's left to do is crank the gears until the answer pops out.

But this way of multiplying gets very expensive for large numbers.
An $n$-digit input creates $n$ sub-problems, each of which involves scaling/shifting/adding numbers that have $n$ digits.
So, when the number of digits doubles, you have twice as many sub-problems and also the sub-problems are twice as big.
Doubling the digits *double doubles* the amount of work.
The algorithm scales quadratically, like $\Theta(n^2)$.

There was a time when people thought that it wasn't possible to find a sub-quadratic multiplication algorithm.
Then [Karatsuba multiplication](https://en.wikipedia.org/wiki/Karatsuba_algorithm) was discovered (less than a week after it was publicly conjectured that no such algorithm existed, funnily enough).
Karatsuba multiplication splits a multiplication into three half-sized multiplications (instead of four), and has a corresponding asymptotic complexity of $O(n^{1.585})$ instead of $\Theta(n^2)$.

People found cleverer and cleverer ways to multiply, all of which I'm going to gloss over because the focus of this post is the culmination of all that: the [Schönhage-Strassen algorithm](https://en.wikipedia.org/wiki/Sch%C3%B6nhage%E2%80%93Strassen_algorithm).
It deftly and elegantly combined several tricks into a single package, and stood for decades as the fastest known multiplication algorithm (... for sufficiently large inputs) (... as in [past thirty thousand digits](https://gmplib.org/manual/Multiplication-Algorithms.html)).

In this post, I'm going to try to explain Schönhage-Strassen multiplication.
As in, if you read all the way through, you should understand the algorithm well enough to do it by hand on paper.
Of course I wouldn't recommend *actually* performing Schönhage-Strassen multiplication by hand, unless you have a perverse [Matt Parker-esque](https://www.youtube.com/watch?v=HrRMnzANHHs) enjoyment for that kind of thing.

# The Goal

Before we get started, let's get a glimpse of where we're headed.
Below this paragraph, there is an interactive demo of the Schönhage-Strassen algorithm.
You can enter any whole number you want into the textbox, and watch it get squared Schönhage-Strassen-style.

I don't expect the demo to make sense to you yet, I just want to give the general flavor.
For example, you might get an inkling for why I think a good name for the algorithm is "split 'n slide multiplication".

[[widget]]

Note that the demo does *squaring* instead of *multiplying*.
Is that cheating?
Not really.
Squaring is basically exactly the same problem as multiplying.
You can turn any fast squaring function $S$ into a fast multiplier: to multiply $a$ by $b$, just compute $\frac{1}{4} \left( S(a+b) - S(a-b) \right)$.
Multiplication is at most twice as expensive as squaring.

For most algorithms, including Schönhage-Strassen, the core conceptual ideas needed to understand squaring are the same ones you need to understand multiplying.
So all of my examples and explaining are going to be in terms of squaring, because it cuts the number of details in half.

So let's get started.

# Wraparound Squaring

An important idea behind <span style="text-decoration: line-through;">split-n-slide</span> Schönhage-Strassen multiplication, perhaps even *the* important idea, is *forcing the output to wrap instead of letting it get larger*.

Normally, squaring an $n$-digit number would produce a $2n$-digit number.
Instead of allowing that to happen, we're going to take anything that pokes past the $n$-digit boundary and wrap it around: add it back at the bottom.

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/squaring-vs-wraparound-squaring.png"/>

If you're familiar with [modular arithmetic](https://en.wikipedia.org/wiki/Modular_arithmetic), you'll recognize this as working modulo $10^n - 1$.
A very useful fact about this kind of arithmetic is that, for all intents and purposes, $10^n \equiv 1$.
Anytime we see a $10^n$ we can replace it with a $1$, without changing the wrapped-around result.

This wrapping business might seem like a pointless change to make.
Sure we can turn a normal squaring problem into a wraparound-squaring problem by zero-padding the input, but why would we?
What do we gain?

What we gain is some very nice properties when splitting the input into pieces that follow simple patterns.

Suppose we want to perform a 16-digit wrap-around squaring of the number $v=1234 \; 5678 \; 1234 \; 5678$.
Notice that this number repeats itself.
It has a structure like $v = [A \;\; A]$.
Algebraically speaking, the input factors into the form $(1 + 10^8) \cdot A$ where $A$ is an 8-digit number.

Something interesting happens when you square a $v$ of this form.
Keeping in mind that $10^{16} \equiv 1$, we find that:

$$
\begin{align}
v^2
&= (10^8 + 1)^2 \cdot A^2
\\\\
&= (10^{16} + 2 \cdot 10^8 + 1) \cdot A^2
\\\\
&= (1 + 2 \cdot 10^8 + 1) \cdot A^2
\\\\
&= 2 \cdot (10^8 + 1) \cdot A^2
\end{align}
$$

The prefactor $(10^8 + 1)$ didn't go away!
And the presence of this prefactor has a simplifying effect on the output, due to its high part is being added into its low part.

Do you see it?
How to use the repetition to reduce 16-digit wraparound-squaring problems into an 8-digit wraparound-squaring problem?

Okay, maybe it's not quite so obvious.
Here's a diagram that shows the general idea:

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/repetition-wraparound-halving.png"/>

Both the low part and the high part of the output end up containing the same value, and this is exactly equivalent to each half independently wrapping around into itself instead of affecting the other half.
Algebraically, this is caused by the fact that $x \cdot (10^8+1)$ is congruent to $(x \text{ mod } (10^8-1)) \cdot (10^8+1)$, when working modulo $10^{16}-1$.

# Splitting into Repetition

Most inputs won't have the form $[A \;\; A]$, but one thing we can always do is *split* inputs into an $[A \;\; A]$ part and a complementary $[B \;\; -B]$ part.
It's not even hard!
Given an input $[U \;\; V]$, set $A = U + V$ and $B = U - V$.
We then have $[U \;\; V] = \frac{1}{2} [A \;\; A] + \frac{1}{2} [B \;\; -B]$.

Admiteddly, the $B$ part is a bit weird.
It's kind of like it has negative digits.
But everything is going to work out, so we're just going to roll with it.

This splitting of a $2n$-digit number $v$ into two $n$-digit parts $v = \frac{1}{2} (10^n + 1) \cdot A + \frac{1}{2} (10^n - 1) \cdot B$ has an **extremely important property**.
I can't emphasize how important it is that this happens: when you square $v$, there's no cross-talk between the pieces.
We're in a situation where $(x+y)^2 = x^2 + y^2$, where the $xy$ part cancels out.

Let's prove this algebraically, keeping in mind that $10^{2n} \equiv 1$:

$$
\begin{align}
v^2
&= \frac{1}{4} \big( (10^n + 1) \cdot A + (10^n - 1) \cdot B \big)^2
\\\\
&= \frac{1}{4} \big( (10^n + 1)^2 \cdot A^2 + (10^n - 1)^2 \cdot B^2 + 2 \cdot (10^n + 1) \cdot (10^n - 1) \cdot A \cdot B \big)
\\\\
&= \frac{1}{4} \big( 2 \cdot (10^{2n} + 2 \cdot 10^n + 1) \cdot A^2 + 2 \cdot (10^{2n} - 2 \cdot 10^n + 1) \cdot B^2 + 2 \cdot (10^{2n} - 1^2) \cdot A \cdot B \big)
\\\\
&= \frac{1}{4} \big( 2 \cdot 10^n \cdot (10^n + 1) \cdot A^2 + 2 \cdot 10^n \cdot (10^n - 1) \cdot B^2 + 2 \cdot 0 \cdot A \cdot B \big)
\\\\
&= \frac{1}{4} \big( 2 \cdot 10^n \cdot (10^n + 1) \cdot A^2 + 2 \cdot 10^n \cdot (10^n - 1) \cdot B^2 \big)
\\\\
&= \frac{10^n}{2} \big( (10^n + 1) \cdot A^2 + (10^n - 1) \cdot B^2 \big)
\end{align}
$$

See how the $A \cdot B$ part got killed off by the $(10^n + 1)(10^n - 1) \equiv 0$ factor?
That's ultimately what makes Schönhage-Strassen, and other FFT-based multiplication algorithms, so fast.
You end up with two half-sized sub-problems instead of one.

But there's a bit of a catch here.
One of our half-sized problems is slightly different.
Let's look a bit closer at what happens when we square the $[B \;\; -B]$ piece:

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/negated-repetition-wraparound-halving.png"/>

Oh.
Our sub-problem is slightly different from the starting problem: when we wrap around we have to *subtract* instead of *adding*.
We're not working modula $10^n - 1$ in the sub-problem, we're working modulo $10^n + 1$.
That is to say, when working modulo $10^{2n}-1$, it's no longer the case that $x \text{ mod } (10^n-1)$ is made congruent to $x$.
Instead, the multiplication by $10^n+1$ makes $x \text{ mod } (10^n+1)$ congruent to $x$.
Not -1, +1.

This slight difference ends up being quite the annoyance.

# Dealing with Wrap Factors

All of my arguments so far have relied on the fact that wrapping around was a simple addition.
It's how I justified splitting the input $v$ into $[A \;\; A] + [B \;\; -B]$: because the wraparound cancelled out any cross-talk between the two pieces.
That breaks when the wraparound is negated, so we need to pick different pieces.

So how do we pick our pieces?
It turns out that the correct split is now $v = [A \;\;\; iA] + [B \;\;\; -iB]$ where $i$ is the square root of -1.

"Okay", I hear you saying, "now things are getting unacceptbly weird. Negative digits was bad enough, but now we have *imaginary* digits? No. Unacceptable.".
But hold on for just a bit longer; I promise that we won't be using any imaginary numbers.
This is where the sliding parts come from.
We'll get to that.
For now, just assume that we have some magic square root of -1 and that it won't introduce unexpected costs.

The general idea here is that, anytime we have a wraparound factor of $f$, we want to use the two square roots $\pm y$ when splitting: $v = [A \;\; \sqrt{f}A] + [B \;\; -\sqrt{f}B]$.
But we also have a *third* square root: since multiplying by ten $n$ times causes the value to gain a wraparound factor of $f$, multiplying by ten $n/2$ times acts like a square root of $f$.
So we have an $x$ based on multiplying by 10, and a $y$ based on I'll-get-to-that, where $f = x^2 \equiv y^2$ yet $x \neq \pm$.

(Analogy: rotating around the X axis by 180 degrees is different from rotating around the Y axis by 180 degrees, but they have the same effect if you repeat them twice respectively.)

Given such an $x$ and a $y$, we can factor $v$ into $(x+y) \cdot A + (x-y) \cdot B$.
And we can check that, yes, this does cause the third factor to cancel away:

$$
\begin{align}
v^2
&= \big( (x+y) \cdot A + (x-y)\cdot B \big)^2
\\\\
&= (x+y)^2 \cdot A^2 + (x-y)^2 \cdot B^2 + 2 \cdot (x+y) (x-y) \cdot A \cdot B
\\\\
&= (x^2 + 2 xy + y^2) \cdot A^2 + (x^2 - 2xy + y^2) \cdot B^2 + 2 \cdot (x^2 - y^2) \cdot A \cdot B
\\\\
&= (2 x^2 + 2 xy) \cdot A^2 + (2 x^2 - 2xy) \cdot B^2 + 2 \cdot 0 \cdot A \cdot B
\\\\
&= 2 x \big( (x+y) \cdot A^2 + (x-y) \cdot B^2 \big)
\end{align}
$$

Furthermore, we once again have the property that the individual wraparound squarings become half-sized wraparound squarings.
But the sub-problems will end up using the square roots of $f$, i.e. $y$ and $-y$ as their wraparound factors.
So we can keep applying this trick again and again... until we run out of finer and finer wrap-around factors.

Here's a diagram showing the general outline of how a wraparound squaring gets turned into two half-sized wraparound squarings:

<img style="max-width:100%; border: 1px solid gray;" src="/assets/{{ loc }}/halving-step.png"/>

First we split the input into two orthogonal pieces, then there's no cross-talk during the squaring, then each piece contains a simple repetition pattern that lets us cut it in half.

# Finding Roots

There's one big open question I've been avoiding until now: what are these wraparound factors *exactly*?

In some algorithms, they would be complex roots of unity.
For example, the complex number $\sqrt{2} (1 + i)$ is an 8'th root of unity.
The problem with complex roots of unity is that to scale by one you have to do a multiplication, and the problem we're trying to solve is *doing multiplication*.
(The multiplications would be smaller, but there's so many of them that the recursive costs would dominate the algorithm.)
We want roots that are somehow easy to multiply by.

What's easy to multiply by, when working in decimal?
*Really* easy?

Well... how about powers of 10?
Multiplying $v$ by $10^r$ is as easy as writing $r$ zeroes after $v$.
The only problem is that we need a square root of -1, and powers of 10 tend to kinda... go off in the other direction.
... except we can wrap them back around!

If we wrap $10^n$ onto -1, then $10^{n/2}$ is a great square root of -1.

This actually works for any base, and even for polynomials.
Declare $x^n$ congruent to -1, and suddenly $x$ is a $2n$'th [principal root of unity](http://mathworld.wolfram.com/PrincipalRootofUnity.html).
And as long as $n$ is a power of two, we can keep halving and halving until we get down to a single multiplication by $x$.

In the previous section I was talking as if we were working with numbers made up of decimal digits.
But the arguments were regardless of what base you pick, even polynomial bases and even if you don't do carrying.
And if we work in base $10^n + 1$ then each "digit" is actually a list of $n$ digits.
Arrange those digits into a column and... ah, that's why the animation is arranged into a table!

Each column is a "big-digit".
The wraparound factor $y$ represents a rotation of that column.
The two square roots of $y$ are the rotation by half as much, and the opposite-direction rotation by half as much.

But... what happens when $y$ hits the quanta of rotation, a single multiplication by 10?
Then it has no square roots, or at least not simple ones.

Yeah... that's where the $\lg \lg n$ factor comes from.
We have to repackage the problem.

# Resplitting




---



---

If this goes on for much longer, we're going to have to do complicated multiplications as part of the splitting process itself!


force the output to also have size $n$ by adding the top $n$ digits into the bottom $n$ digits.
We can still use a wrap-around squaring algorithm to do normal squaring (just pad the input with a bunch of zero digits), but the wrapping will make cutting the problem into pieces easier.

Let me go over two exampls of how wrapping can make it easy to cut a squaring problem in half.

First example: suppose we're asked to square-and-wrap a number that repeats itself, like $v=1234 \; 5678 \; 1234 \; 5678$.
This is a 16-digit input, so we wrap after the 16'th digit.
Anything times $10^{16}$ gets pushed 16-digits to the right and added in, so any multiplication by $10^{16}$ can be replaced with a multiplication by 1.
In effect, within the wrap-around number system we've set up, $10^{16} \equiv 1$.
They are congruent.

Now rewrite $v$ into $v = (1+10^8) \cdot (1234 \; 5678)$ and square it.
You get $v^2 = (1+10^8)^2 \cdot (1234 \; 5678)^2$.
Focusing on just the $(1+10^8)^2$ part, we find that $(1+10^8)^2 = 1 + 2 \cdot 10^8 \cdot 10^{16}$.
Using the fact that $10^{16} \equiv 1$, this reduces to $(1+10^8)^2 = 2 \cdot (1 + 10^8)$.
Which means that $v^2 = (1 + 10^8) (1234 \; 5678)^2$.

Now I want you to think about what it means to multiply a number $x$ by $1 + 10^8$ when $10^{16} \equiv 1$.
Basically it amounts to taking the number, rotating the digits left by 8 (with wraparound), then adding the rotated version into itself.
In the top half, the rotated bottom digits get added into the top digits.
In the bototm half, the rotated top digits get addded into the bottom digits.
Wait... *exactly* the same thing is happening in the bottom and top halves.
So we only need to focus on one of them!
In fact, it's exactly as if we were rotating on the 8-digit boundary instead of on the 16-digit boundary!

So when we get an input that repeats itself, we can cleanly cut the problem in halve.

So that was the first example, numbers of the form $v = (1+ 10^8) x$ with $x$ only being 8 digits long.
For the second example, we're just going to turn that $+$ into a $-$ and focus on inputs like $v = (1 - 10^8) x$.
I find it helpful to think of these inputs as having negative digits, as if we were asked to square $v=1234 \; 5678 \; (-1)(-2)(-3)(-4) \; (-5)(-6)(-7)(-8)$ where the $(-d)$ parts are part of the positional notation not multiplications.
Or, being a bit more abstract with our notation, $v=[A \;\; (-A)]$ with the sub-chunk $A=1234 \; 5678$.

When we square $v = (1 - 10^8) x$ we get $v^2 = (1 - 10^8)^2 x^2$ which expands to $v^2 = (1 - 2 \cdot 10^8 + 10^{16}) x^2$ and then promptly simplifies, via $10^{16} \equiv 1$, into $v^2 = 2 \cdot (1 - 10^8) x^2$.
Notice how similar this is to the $1+10^8$ case: we start with an input times some pre-factor ($1 - 10^8$), square it, and get a doubled output times that same prefactor.
Also, once again, the structure of the pre-factor is going to cut the problem in half... but there's a catch this time.
Because the bottom half is the negation of the top half, when we rotate and add we end up effectively substracting each half from the other half.
We're still wrapping, but there's now a *wrap-around factor*.
Our sub-problem isn't $x^{\ast 2}$, it's $x^{\ast 2}\_{-1}$.
We're working modulo $10^8 + 1$ instead of modulo $10^8 - 1$.

We'll get to dealing with the wrap-around factor, but first I want to call out the fact that giving a problem that *doesn't* repeat, we can *always* split it into a repeating part and a negated-repeat part.
Given an input $[A \;\; B]$, you can find chunks $C$ and $D$ such that $[A \;\; B] = [C \;\; C] + [D \;\; -D]$.
It's not even hard: just set $C = A + B$ and $D = A - B$.
There's an extra factor of 2 hiding in there, but we'll fix that later.

This particular splitting of the problem has one other *really really important property*: **there's no cross-talk between the two parts**.
We split $x^2$ into $(y+z)^2$, but our choice of $y$ and $z$ happens to have the property that $y \cdot z = 0$ so that $(y+z)^2 = y^2 + 2yz + z^2 = y^2 = z^2$.
Why?
Because $(1+10^8)(1-10^8) = 1 - 10^{16} = 1-1 = 0$.
Which means that splitting $[A \;\; B]^{\ast 2}$ into $([C \;\; C] + [D \;\; -D])^{\ast 2}$ simplifies into $[C \;\; C]^{\ast 2} + [D \;\; -D]^{\ast 2}$ and we can then break the sum into $[C]^{\ast 2}$ and $[D]^{\ast 2}_{-1}$.
We divided our problem into halves; time to conquer the pieces.

# Wrapping with Factors

When there's a wraparound factor present, we need to use different pieces to avoid cross-talk.
If you split $[A \;\; B]^{\ast 2}\_f$ into $([C \;\; C] + [D \;\; -D])^{\ast 2}_f$, you'll find that the $C \cdot D$ part doesn't cancel out to zero.
For example, $(1+10^8)(1-10^8)$ becomes $1-10^{16}$ and then, since $10^{16} \equiv f$, you get $1-f$ which is... not zero.

The efficiency of our algorithm depends vitally on us cutting the problem into *two* half-sized pieces.
We can't afford the third piece created by the cross-talk.

So start thinking, we need something better.
What pieces can we split $[A \;\; B]$ into that won't have cross-talk when the wrap-around factor is -1?

Well, when the wrap-around factor was 1 we used pieces whose repetition was multiplied by +1 and -1 respectively.
Those are the square roots of 1.
What if we used square roots of -1?
That is: given an input $[A \;\; B]$, split it into parts $[C \;\; +\sqrt{-1} C] + [D \;\; -\sqrt{-1} D]$.

Now I know what you're thinking: "negative digits was bad enough, now we're adding *imaginary* digits?!".
I will explain later what exactly these square roots of -1 are.
In some other algorithm they are imaginary numbers, but in Schonnage Strassen they actually aren't.
I promise I'll get to it; for now just accept that we can *somehow* do this scaling and that it won't be horribly expensive.

So we've split our 8-digit input $v$ into two 4-digit parts: $v = (1+10^4 \sqrt{-1})c + (1-10^4 \sqrt{-1})d$.
Let's see what happens when we square $v$, when $10^8 \equiv -1$ and $i = \sqrt{-1}$:

$$
\begin{align}
v^2
&= \big( (1+10^4 i)c + (1-10^4 i)d \big)^2
\\\\
&= (1+10^4 i)^2c^2 + (1-10^4 i)^2 d^2 + 2 \cdot (1+10^4 i) (1-10^4 i) c d
\\\\
&= (1+ 2 \cdot 10^4 i - 10^8) c^2 + (1- 2 \cdot 10^4 i - 10^8) d^2 + 2 \cdot (1 - (10^4 i)^2) c d
\\\\
&= 2 \cdot (1 + 10^4 i) c^2 + 2 \cdot (1 - 10^4 i) d^2 + 2 \cdot (1 + 10^8) c d
\\\\
&= 2 \cdot (1 + 10^4 i) c^2 + 2 \cdot (1 - 10^4 i) d^2 + 2 \cdot (1-1) c d
\\\\
&= 2 \cdot (1 + 10^4 i) c^2 + 2 \cdot (1 - 10^4 i) d^2
\end{align}
$$

Hey, it worked!
The $c \cdot d$ part got dropped, and we ended up with squared outputs multiplied by the same pre-factors that we started with!

And these pre-factors will once again let us cut the problem in half, though our sub-problems will now have even more complicated wrap-around factors: $i$ and $-i$ respectively.

Since the wrap-around factors keep getting more complicated, and you've probably got the hang of it from dealing with +1 and -1 special, we should probably solve the general problem instead of focusing on one after another.

Suppose that we have a wrap-around squaring problem where the wrapping happens at $x^2$ with a wrap-around factor of $y^2$.
That is to say, $x^2 \equiv y^2$.
Note that, despite their squares being the same, we're going to be using cases where $x \neq \pm y$.
Normally that wouldn't be possible, but we're going to be working in a number system where it is.
For example, in the -1 case we just went over, we had $x=10^4$ and $y=\sqrt{-1}$.

(Another example of two unrelated things having the same square is rotations: "flip 180 degrees around the X axis" and "flip 180 degrees around the Y axis" are distinct operations, but repeat them twice and you get the same net effect.)

To reduce this wrap-around squaring problem, we split the number to square $v$ into two parts: an $(x+y)$ part and an $(x-y)$ part.
So $v = (x+y) c + (x-y) d$.
Now just turn the crank:

$$
\begin{align}
v^2
&= \big( (x+y)c + (x-y)d \big)^2
\\\\
&= (x+y)^2c^2 + (x-y)^2 d^2 + 2 \cdot (x+y) (x-y) c d
\\\\
&= (x^2 + 2 xy + y^2) c^2 + (x^2 - 2xy + y^2) d^2 + 2 \cdot (x^2 - y^2) c d
\\\\
&= (2 x^2 + 2 xy) c^2 + (2 x^2 - 2xy) d^2 + 2 \cdot 0 \cdot c \cdot d
\\\\
&= 2 x \big( (x+y) c^2 + (x-y) d^2 \big)
\end{align}
$$

And, furthermore, $(x+y) c^{\ast 2}\_{y^2} = [c \;\; y c]^{\ast 2}\_{y^2}$ can be computed by instead computing $[c]^{\ast 2}\_{y}$.
This also applies to the $d$ part, but with $-y$ instead of $y$.

So, given a wrap-around factor $f$ we can cut the problem in half as long as we can find three distinct square roots for $f$: $x$, $y$, and $-y$ such that $x^2=y^2=f$.
Our setup gives us the $x$ root for free: because rotating by a full turn applies the wrap-around factor $f$, rotating by a *half turn* acts exactly like a square root.
As for the $y$s...

# Rotated Roots of Unity

Here comes the second big trick that SS uses: we got one square root by rotating, so why not just repeat that trick?
*Add a direction to rotate digits along*.
Our "digits" won't be just individual digits, they'll be whole *groups* of digits.
To give ourselves a way to multiply by -1, we'll use a wraparound factor of -1 for the *group*.
So if you multiply the group by 10 $m$ times, you end up sliding all of the digits up and wrapping them all around and they all get negated.
Then our square root of -1 is just... multiplying by 10 half as many times.

Yes, this really all works out.
Basically, we've replaced our base-10 digits with base-$(10^h + 1)$ digits and it just so happens that $10$ is a $2n$'th [principal root of unity](http://mathworld.wolfram.com/PrincipalRootofUnity.html) when working modulo $10^n + 1$.
I like to imagine it as a big table: the columns are our big base-$(10^h + 1)$, and the cells within each column are the decimal digits making up that big-digit.

The height of the column, $h$, determines how many times we can keep cutting the problem in half before we hit our quanta of rotation (multiplying by 10).
We will run out of finer-grained rotations before we reduce the multiplication to a constant size, but when that happens we can do a repackaging step that turns each column into a sub-squaring.

The repackaging step is the least efficient part of the algorithm: it doubles the amount of data we're working with.
It's the reason we have that ugly factor of $\lg \lg n$ on the asymptotic complexity of the algorithm.
But, all things considered, that's a pretty good version of "not very efficient".

# Repackaging

Now we get into what I consider to be the most complicated part of the algorithm: carefully choosing the size of sub-problems.

You see, when we create a sub-problem we need to leave space for carry bits and if we use $u$ digits in each column and there are $w$ columns then we will need at least $2u + w + 1$ digits for the result (actually, that bound is for bits not digits).
The killer complicating factor here is the $w+1$ part: our column height has to be a power of 2, so if we were naive it would force us to quadruple the size of the columns.

But it turns out that we can use a padding factor on each cell within the column, and as long as we make that padding factor roughly track the logarithm of the column size then everything will work out: we'll double instead of quadrupling.

# Overview

So, to recap, the algorithm works by:

1. Transforming the squaring problem into a wraparound squaring problem based on a grid.
2. Divide-and-conquering using parts created by finer and finer rotations.
3. Repacking the problem when we run out of rotations, causing a factor-of-2 blowup.
4. Using some other algorithm once we're down to sub-problems of size 16.

Usually people think of the many halvings in step 2 as just "the convolution theorem applied to Z mod bla".


# Some Things to Ponder

- We keep cutting the grid vertically, creating skinnier and skinnier halves.
But initially there's no real difference between the rows and columns; we could cut horizontally instead of vertically.
Why can't we alternate between horizontal and vertical cuts, thereby avoiding the eventual extreme asymmetry that forces the repackaging steps?

- There are systems where square roots cycle instead of getting finer and finer, such as $4$ being a square root of $2$ and vice versa when working modulo $7$.
What stops us from using such cycles for our wraparound factors, thereby avoiding the 'need smaller and smaller rotations' problem?

- We were working in the integers modulo $10^n + 1$, but we could also work with polynomials modulo $x^n + 1$.
That would simplify a few things, but also be less asymptotically efficient despite having essentially exactly the same structure.
Where does the inefficiency come from when using polynomials?

# Summary

-


---



It's no longer the case that



Squaring an $n$ digit number gives you a $2n$ digit result, 


Suppose you want to square a number, but you don't have a lot of space to work with.
Squaring an $n$-digit number creates a result with $2n$ digits, but you only want to keep $n$ of them.
What kind of compromise can you make?

In many programming languages, squaring a number doesn't

When you square a number, the output has about twice as many digits as the input.


More improvements were made.
Toom-Cook hit $O(n^{1+\epsilon})$ for any desired $\epsilon$

When it comes to multiplying large numbers, things get complicated.

As a typical five year old, you learned how to multiply in grade 3.
(Uh...)d

The method you learned basically goes like this: make a copy of one input for each digit in the other input, shift, and do digit-wise multiplication.

This works fine for small numbers, but for long numbers working with all those copies starts to get pretty crazy.
Every time you make the inputs twice as long, you have to do four times as much work.

To keep things simple, lets focus on squaring instead of on multiplying.
They're basically the same thing, since a fast way to do one gives you a fast way to do the other.
If you can square fast, and you want to multiply $a$ by $b$ fast, just square $a+b$ and $a-b$ then subtract $(a+b)^2 - (a+b)^2$.
Divide by 2 (which is easy), and that's $a \cdot b$.

Anyways, back in the sixties (*cite) people thought that maybe there wasn't a faster way to multiply than what people were taught in grade school.
Someone made a prediction about it at a conference (*cite).

One month** later, Karatsuba multiplication was discovered.
To square a number, split it into two halves $a$ and $b$ then square $a$, square $b$, and square $a+b$.
This turns a multiplication of size $n$ into three multiplication of size $n/2$.
Now, when we double the size of the input, the cost only triples instead of quadrupling!

Once people had the general idea, they started improving things.
The main question is: can you express a multiplication of size $n$ in terms of only *two* multiplications of size $n/2$.
It turns out we can get pretty close, and for decades the closest was Schönhage-Strassen multiplication.

---

Schönhage-Strassen multiplication is based on a few key ideas.

The first key idea is to prevent numbers from getting to large.
Not by just throwing away digits past a certain point, but by carrying those digits back around to the bottom.

For example, suppose we square a 100-digit number.
The output will have 199 digits.
But instead of keeping the top 99 digits, we add them back into the bottom 100.

So suppose we have a problem like that:

$Square\_{\text{wrap after 100 digits}}(X_{100})$

Now split X into two halves:

$Square\_{\text{wrap after 100 digits}}(A_{50} | B_{50})$

But, instead of directly, keeping the halves, find a pattern:

$Square\_{\text{wrap after 100 digits}}((C_{50} | C_{50}) + (D_{50} | -D_{50}))$

Now something interesting happens when we distribute since $(a+b)^2 = a^2 + 2ab + b^2$:

$Square\_{\text{wrap after 100 digits}}(C_{50} | C_{50}) + Square\_{\text{wrap after 100 digits}}(D_{50} | -D_{50}) + 2 Multiply\_{\text{wrap after 100 digits}}((C_{50} | C_{50}), (D_{50} | -D_{50}))$

Each of those terms is interesting in its own way.

First, it terms out that the multiplication term will always be zero.
That's good, since we only want pieces.

Second, consider how the $C$ term behaves.
When you square the lower part, the high part of the result overflows into the upper part.
And when you square the upper part, it overflows into the lower part because of the cycling.
But, because the upper and bottom parts are the same, you can think of it as each overflowing into *itself*.
So instead of working with 100 digits, we can work with 50 digits!

$Square\_{\text{wrap after 50 digits}}(C_{50})$

Unfortunately, this doesn't quite work with the $D$ term.
The problem is that now, when one part is overflowing into the other, it's been negated.
We're still cycling, but now we're *subtracting* the overflow instead of *adding* it:

$Square\_{\text{wrap * -1 after 50 digits}}(D_{50})$

So we've reduced our 100 digit problem into two half-sized problems, but one of those problems is slightly different.

---

Okay, can we apply the same trick again?
Split the 50 digits into two halves, look at same-part and opposite-part, etc?

Unfortunately, it doesn't work.
The multiplication term doesn't cancel out anymore.

Okay, maybe we need to twiddle things a bit.
Now, instead of splitting into $C C$ and $D -D$ pieces, we split into $C iC$ and $D -iD$ pieces for some $i$.
We work out the math and find that the multiplication is multiplied by $w - i^2$ where $w$ the overflow factor.

So as long as $i^2 = w$, the multiplication will cancel.
That's why $1$ and $-1$ worked when the overflow factor was 1: those are the square roots of 1.
Now that we're dealing with -1, we need square roots of it.

Nevermind exactly what those roots will be for now, we'll get back to that.
It's probably not what you're expecting it to be.

Anyways, we split into $C iC$ and $D -iD$ pieces and it cancel the multiplication.
And once again, we find that the bottom part and the top part are feeding into each other in a symmetric way.
So we get two half-sized problems yet again, but now the overflow phase factors are starting to get complicated: we're using $\pm \sqrt{-1}$.

We just covered the second key idea by the way: use phasing to cut overflow problems in half.

---

What exactly *are* these phase factors?

At first you might think they're complex numbers.
That would work, but it's kinda tricky to do that our algorithm for multiplying whole numbers ends up multiplying complex numbers in the middle of it.
So that's not ideal.

The final key idea behind Schönhage-Strassen multiplication is the nature of $\sqrt{-1}$.
Consider: if a number's digits get wrapped around and multiplied by -1 when going past 50 digits, then multiplying by $10^{50}$ effectively negates the number.
For all intents and purposes $10^{50}$ *is* negative one in this system.

If $10^{50}$ acts like negative one, do square roots of $10^{50}$ act like square roots of negative one?

Yes.

But there's a bit of a catch.
Basically our square root of -1 is "shift up by 25 digits", but our algorithm works by cutting the number into 25 digit parts.
These two ideas break each other, so that one of our pieces ends up being 0.

We need our shifting-to-phase to be somehow separate from our splitting.

This brings us to the last idea: instead of working in base 10, work in base $10^m$ for some appropriately huge $m$.
We pick $m$ so that we end up with $m$ words made up of $m$ digits each.
We require that each word have -1 cyclcing behavior then, to multiply by $i$, we cycle the bits *inside* each word.

So we'll cut into halves again and again until we get down to a single word, at which point we run out of phase factors but oh it terms out we only need to square the word and it has -1 overflow so we're back where we started but with a much smaller problem!

---

Mathematicians don't think about this process quite the way I've explained it here.
Instead of cutting in half until we run out of phase factors, they think about the whole process as a single transform.

It's called the convolution theorem.

Basically, we applied the convolution theorem to a list of $2^{n+1}$ integers while working modulo $10^{2^n}+1$ so that $10$ is a $2^{n+1}$'th order principal root of unity.

Sorry, I went past the level of a five year old for a minute there.

---

Instead of working with each chunk individually, we can think of SS as being made up of three fundamental operations: sum-difference, phase-gradients, and splitting.

The phase gradients and sum-difference basically amount to what we were doing, but all at once.

The splitting is the really tricky part to get right.
You need enough room for it to work.

I... can't explain it to a 5 year old.
It's not hard to make a splitting strategy that works, but it's hard to make a splitting strategy that doesn't secretly increase the asymptotic running time past $O(n \lg n \lg \lg n)$.

---

It's all well and good to talk about these things in the abstract.
But let's actually *do it*.

I put together some code that performs the algorithm.

And hooked it up to the display below.

Type in any number you want, up to a thousand digits, and it shows all the steps.

