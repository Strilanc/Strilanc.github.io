---
layout: post
title: "My Misconceptions: The Unintegrable Function"
date: 2015-09-17 11:30:00 EST
categories: math
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


# Comments

<div style="background-color: #EEE; border: 1px solid black; padding: 5px; font-size: 12px;">
  <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
    <strong>hiho</strong> - Sep 17, 2015
    <br/>

    That's why it's sometimes a good idea to look at problems from different viewpoints: in this case, from a geometric standpoint, it's pretty clear every continuous function must be integrable! (just by imagining the process in your head) By doing so, you're essentially reproducing the fundamental theorem of calculus. Take this corollary: every continuous function on a closed interval is bounded. So if you follow Riemann integration, you're just adding a value less than or equal to M*dx, for some M, as you integrate.
    <br/>
    <br/>

    Another intuition is that integration is simply a "smoothing" function, that is, a convolution with a window function -- smoothing only yields "more continuous" functions.

    <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
      <strong>Craig Gidney</strong> - Sep 17, 2015
      <br/>

      That's true, although...
      <br/>
      <br/>

      A detail I left out of the post, to keep it punchy, is that I actually did realize that the function had a well defined geometric area under its curve. But don't give me credit for that; it was just another layer of "HOW DID I MISS THIS?!". I thought that the definite integral was "cancelling out the problems" in the indefinite integral (due to the subtraction involved), so the function "allowed definite integrals but not an indefinite integral". Obviously that's ridiculous, since the area under the curve starting from 0 works as an indefinite integral, but I failed to make the connection.
      <br/>
      <br/>

      The fact that I was thinking more algebraically than geometrically did play a part. But I think the more serious failure was not even realizing there was a problem to be checked for, despite warning signs. I wasn't rigorous enough. I *knew* that swapping the order of an integral and an infinite sum was dangerous, but did it anyway, and then failed because I didn't realize the constant of integration could be different for each summand.

      <div style="border: 1px solid gray; padding: 5px; margin: 5px;">
        <strong>hiho</strong> - Sep 17, 2015
        <br/>

        This one was particularly glaring because I tend to think geometric first; but geometric intuition has limitations too (if you're not careful), which is why I've learned to take a lot of care around those claims. And that brings another example I think you might like. If you told me of the properties of a https://en.wikipedia.org/wiki/Singular_function , I would not believe you for my life, and yet there are simple constructions like that.
      </div>
    </div>
  </div>
</div>
