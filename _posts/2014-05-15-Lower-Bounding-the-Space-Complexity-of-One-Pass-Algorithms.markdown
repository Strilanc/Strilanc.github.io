---
layout: post
title: "Lower Bounding the Space Complexity of One-Pass Algorithms"
date: 2014-05-15 11:30:00 EST
categories: algorithm
---

A [one-pass algorithm](http://en.wikipedia.org/wiki/One-pass_algorithm) is one that computes its output using only a single in-order scan of its input. In other words, one-pass algorithms still work when given an `IEnumerator<T>` instead of an `IEnumerable<T>` or `List<T>`.

One thing I like about one-pass algorithms is how easy it can be to place lower bounds on their space requirements. In this post I will explain a technique for doing that, based on showing too much information can be extracted from intermediate states.

**Querying Medians**

Suppose I claim to have a one-pass algorithm that can compute the [median](http://en.wikipedia.org/wiki/Median) of a list, using only a constant amount of space. You want to show that I'm mistaken. We will do so by deducing already-processed items.

The intermediate state of a one-pass algorithm can be thought of as a checkpoint. You can save this checkpoint, and later use it to resume the computation. More importantly for our purposes, the checkpoint is *independent of items later in the list*. If you run the algorithm on two lists with the same prefix, then the state of both runs will match until the end of the common prefix, because a one-pass algorithm can't look ahead or go backwards.

Given a large number of lists that start with a common prefix, taking a checkpoint can be a huge time saver. But we're not interested in time savings. We're interested in what we can figure out about a prefix that has been processed, using only the checkpoint and specially crafted suffixes. So let's play a game.

I will generate the first $n$ items of a list of length $2n+1$ at random, run my median algorithm over those items, then give you the intermediate checkpoint state. Your goal is to use that checkpoint to figure out the random items I generated, by finishing the algorithm on suffixes of your choosing. How many of the items can you figure out by "suffix querying" the median? Well, here's a hint:

$median(2,3,5,7, \infty, \infty, \infty) = 7$

$median(2,3,5,7, -\infty, \infty, \infty) = 5$

$median(2,3,5,7, -\infty, -\infty, \infty) = 3$

$median(2,3,5,7, -\infty, -\infty, -\infty) = 2$

By using a suffix of $n-1$ items all set to $+\infty$ (or perhaps `MAX_INT`), you can compute what the largest item in my list was. Then, to figure out the second largest item, you just change one of those $+\infty$ items to a $-\infty$ and recompute (again starting from the checkpoint). By changing more and more positive infinities to negative infinities, you can recover *every single item I generated* (though not their ordering).

Thought of another way, we can use the checkpoint as a [multiset](http://en.wikipedia.org/wiki/Multiset) containing $n$ items (although with an odd way of recovering those items). But a multiset with $n$ arbitrary items requires at least $\Omega(n)$ space, and my claimed median algorithm only uses a constant amount of space. Therefore my algorithm must be incorrect. A one-pass median algorithm must use at least a linear amount of space.

**More Cases**

This idea, of deducing information about a prefix by querying with suffixes, can be applied to other one-pass problems.

As with the median, any [percentile](http://en.wikipedia.org/wiki/Percentile) (except the 0th and 100th) can be suffix-queried to deduce the whole prefix. Therefore percentiles can't be computed in one pass with less than linear space. You can also use the [mode](http://en.wikipedia.org/wiki/Mode_%28statistics%29) to suffix-query all of the items in a hidden prefix, so it must also require at least linear space to compute in one pass (left as an exercise or the reader).

Things also work out for values that *can* be computed in one pass with constant space, like the maximum, the minimum, the mean, the sum, the count, and even the standard deviation. You'll find that, for each of these, you *can't* determine more than a constant amount of information about the prefix by suffix querying. For example, using the maximum you can't learn anything about the prefix except its maximum (because $max(concat(A, B)) = max(max(A), max(B))$).

Often you can tweak a statistic to make it more efficient, and this will also decrease what you can infer about the prefix. For example, using the [remedian](http://web.ipac.caltech.edu/staff/fmasci/home/statistics_refs/Remedian.pdf) instead of the median, or the [majority](http://www.cs.utexas.edu/users/boyer/ftp/ics-reports/cmp32.pdf) instead of the mode.

**One Pass Only**

It's tempting to try to use this technique to lower-bound other algorithms, but unfortunately it relies too crucially on the suffix not affecting how the prefix is processed. Even allowing just one more pass breaks everything.

For example, consider my made-up statistic `SumPluck`, which returns the sum'th item of a list (wrapping around if necessary). More exactly: `SumPluck(a) = a[a.Sum() % a.Count]`. Suffix-querying `SumPluck` trivially allows the recovery of a prefix (just add a single item and keep incrementing it to scan across the list). So `SumPluck` can't be computed in one pass using only constant space.

On the other hand, if we allow two passes, then `SumPluck` can be computed in constant space by using the first pass to compute the sum and the second pass to pluck out the correct item. No need to worry about random access. Even a single extra pass invalidates the space bound.

There may be a way to generalize the technique in some way, so that it applies in more cases, but I don't know how to do it.

**Summary**

If it is possible to determine $\Omega (g(|P|))$ items of the list prefix $P$, using only the results of querying the list statistic $F$ of various lists that start with $P$, then a one-pass algorithm for $F$ must use at least $\Omega(g(n))$ space.

---

[Discuss on Reddit](http://www.reddit.com/r/programming/comments/25mir1/lower_bounding_the_space_complexity_of_onepass/)
