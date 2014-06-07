---
layout: post
title: "Eating Lions, Wolves, and Goats Faster"
date: 2014-06-07 11:30:00 EST
categories: algorithm
---

Yesterday I read [Fast Functional Goats, Lions and Wolves](http://unriskinsight.blogspot.com/2014/06/fast-functional-goats-lions-and-wolves.html) on the "UnRisk Insight" blog. The post is about benchmarking solutions to [problem #30 from the 2014 Austrian "Math Kangaroo" contest](http://www.kaenguru.at/uploads/media/2014_Student_EN.pdf) in several languages, as a way of comparing how efficient the languages are.

Reading the post was a bit surreal for me, because it's on a blog for a company that describes itself as "passionate about quant finance and future technologies", but the solution they're using is absurdly inefficient. It's still a valid language comparison, but I spent the whole post waiting for them to mention the better algorithm. (They [hint at it](http://unriskinsight.blogspot.co.at/2014/04/three-ways-to-solve-goats-wolves-and.html) in a single case, but not at all in the general case.)

In this post I'll explain how to solve the problem more efficiently.

**Lions, Wolves, and Goats**

The problem being solved is about a population of lions, wolves, and goats. Stronger animals can eat weaker ones, with the twist that this transforms the stronger animal into another. When a wolf eats a goat, the wolf transforms into a lion. When a lion eats a goat, it transforms into a wolf. When a lion eats a wolf, it transforms into a goat.

Every time one animal eats another, the total population goes down by 1. Eventually the population must become stable, with no animal able to eat another. We want to find a sequence of X-eats-Y operations that reaches as large of a stable population as possible.

The actual question from the Math Kangaroo contest involved a specific case of this general problem, where the initial population was set to 6 lions, 55 wolves, and 17 goats. The possible answers (it was multiple choice) were 1, 6, 17, 23, or 35 animals left. We want to write an algorithm for the general case.

Naturally, the first thing to do with any word problem is to drop all of the unnecessary details. The state of the system is just three numbers, one for each type of animal. Instead of thinking about 6 lions and 55 wolves and 17 goats, we'll work with `[6, 55, 17]`. The operations we can apply are changes to the population, with the lion-eats-goat case translating to `[-1, +1, -1]`, the lion-eats-wolf case becoming `[-1, -1, +1]`, and the wolf-eats-goat case becoming `[+1, -1, -1]`.

Translating the eating operations into population deltas immediately reveals that the three types of animals are actually interchangeable. The problem talks about a lion eating a goat, as opposed to a goat eating a lion, but you always lose the eater and the eatee while gaining one of the uninvolved animal... so the differences don't matter.

Even more importantly, though, is the realization that the order of operations doesn't matter when using deltas. We might get a negative number of goats along the way, but the total will end up the same. Not caring about order would *massively* simplify the problem. Lucky for us, it turns out that we can get away with this simplification. Assuming the final population is stable and positive, we're guaranteed to be able to re-order eating in a way that avoids negative populations.

Basically our problem is now a linear system, meaning we can apply [integer programming](https://en.wikipedia.org/wiki/Integer_programming).

**Integer Program**

If we have an initial population of `$[x_1, x_2, x_3]$`, and apply the operations `[+1,-1,-1]`, `[-1,+1,-1]`, `[-1,-1,+1]` a total of `$d_1$`, `$d_2$`, and `$d_3$` times respectively, then the resulting population will be `[$x_1+d_1-d_2-d_3$, $x_2-d_1+d_2-d_3$, $x_3-d_1-d_2+d_3$]`. We want to maximize the sum of that resulting population, which is `$x_1+x_2+x_3-d_1-d_2-d_3$`.

We only have two constraints on the system. First, the delta operations can only be applied a non-negative integer number of times. We don't want lions throwing up goats or half-transforming into wolves. Second, the final population must have only one type of animal. This is the only way to guarantee nothing can eat anything else anymore, keeping things stable.

The stable population constraint requires a [special ordered set](https://en.wikipedia.org/wiki/Special_ordered_set), but otherwise this integer program is trivial to write:

```
// output maximum stable population
max: finalPopulation;
finalPopulation = x1 + x2 + x3 - d1 - d2 - d3;

// inputs
x1 = 6; // lions
x2 = 55; // wolves
x3 = 17; // goats

// individual final populations
f1 = x1 + d1 - d2 - d3;
f2 = x2 - d1 + d2 - d3;
f3 = x3 - d1 - d2 + d3;

// constrain final population to be stable, with exactly one of them being non-zero
f1 + f2 + f3 > 0;
f1 + f2 + f3 = finalPopulation;
// (special ordered set ensures at most one is non-zero)
sos
f1,f2,f3 <= 1;

// population changes are non-negative and discrete
int d1, d2, d3;
```

You can run the above program with [lpsolve](http://sourceforge.net/projects/lpsolve/). (I would link to a web interpreter, instead of something you have to install, but I can't find any decent ones!) If you do, you'll see in the results tab that the solution has a final population of `23`, with `$d_1=36$`, `$d_2=0$`, and `$d_3=19$`. In other words, 19 wolves ate a goat and 36 lions ate a wolf.

We can find a valid X-eats-Y sequence by bouncing back and forth between the two allowed operations while applying them as much as possible. Doing that, the population will progress as follows:

1. `[6,55,17] + 36[+1,-1,-1] + 19[-1,-1,+1]`
2. `[23,38,0] + 19[+1,-1,-1] + 19[-1,-1,+1]`
3. `[4,19,19] + 19[+1,-1,-1]`
4. `[23,0,0]`

So an optimal eating sequence is: 17 wolves eat a goat, then 19 lions eat a wolf, then 19 wolves eat a goat, leaving a final population of 6+55+17-17-19-19=23 lions.

**Efficiency**

How fast is the above integer program, compared to the brute force approach used in the post I linked to? Well:

```
Goats   Wolves  Lions   Brute(C++)  LPSolve
17      55      6       0.01s       0.050s
117     155     106     0.05s       0.047s
217     255     206     0.35s       0.015s
317     355     306     1.20s       0.050s
417     455     406     2.74s       0.049s
517     555     506     5.09s       0.016s
617     655     606     9.14s       0.014s
717     755     706     14.50s      0.015s
817     855     809     20.25s      0.016s
917     955     906     28.77s      0.016s
1,017   1,055   1,006   39.71s      0.018s
2,017   2,055   2,006   335.07s     0.055s
900,017 900,055 900,006 n/a         0.049s
```

Wow, the difference is so pronounced that it doesn't matter that I didn't average multiple runs or even use the same computer. The integer program is taking effectively the same amount of time regardless of the inputs, finishing faster than you can blink. Meanwhile, the brute force program is taking minutes for a few thousand animals.

(Having a better algorithm is incredibly unfair.)

**Convenience vs Precision**

Because integer programming is based on solving linear systems, the solvers use floating point numbers internally. When inputs get large enough to cause rounding errors, you'll get the wrong answer. This is where the trade-off between the convenience of using a solver, and the exactness of hard-coding how it will solve your system comes into play. To finish off this post, let's figure out an exact solution.

If we assume the largest stable population is all lions, then the linear system reduces to:

```
maximize x1 + x2 + x3 - d1 - d2 - d3

x1 + x2 + x3 - d1 - d2 - d3 = x1 + d1 - d2 - d3
0 = x2 - d1 + d2 - d3
0 = x3 - d1 - d2 + d3
```

Solving for `d1` in the first constraint gives:

```
maximize x1 + x2 + x3 - d1 - d2 - d3

d1 = (x2 + x3)/2
0 = x2 - d1 + d2 - d3
0 = x3 - d1 - d2 + d3
```

Then substituting `d1` into the other two and solving for `d3` or `d2` gives:

```
maximize x1 + x2 + x3 - d1 - d2 - d3

d1 = (x2 + x3)/2
d2 = (x3 - x2)/2 + d3
d3 = (x2 - x3)/2 + d2
```

Now we substitute `d1` and one of `d2` or `d3` into the maximized expression. Whether we use `d2` or `d3` depends on which of `x2` and `x3` is larger:

```
maximize x1 + x2 + x3 - (x2 + x3)/2 - d2 - ((x2 - x3)/2 + d2)
```

Then we simplify:

```
maximize x1 + x3 - 2 d2
```

Which is maximized when `d2 = 0`. Along the way we implicitly assumed that `x2` and `x3` had the same parity and that `x2 >= x3`, because `d3 = (x2 + x3)/2` had to be whole and non-negative.

In total there are six cases we have to consider, with each having a parity constraint and an ordering constraint on two of the variables. Whichever case meets its constraints and has the largest answer is the actual answer.

When all variables have the same parity, the cases reduce to the expression `max(x1, x2, x3) + min(x1, x2, x3)`. If only two have the same parity, then the answer is `xa + min(xb, xc)`, where `xa` is the input with a different parity. No need for any searching, just a few clamping and adding operations. *You can do it by hand*.

**Summary**

In this case, choice of algorithm trumped choice of language.
