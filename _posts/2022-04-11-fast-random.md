---
layout: post
title: "Briskly Biased Bits"
date: 2022-04-10 10:10:10 am PST
permalink: post/2200
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Last year, I wrote a high performance simulator ([stim](github.com/quantumlib/stim/)) for noisy stabilizer circuits.
One of the major bottlenecks on the speed of simulation was generating noise.
Ultimately, I fixed this bottleneck.
I wrote code that can produce streams of noisy bits, with each bit being independently true with probability $p$, at gigahertz rates, for any value of $p$.
This blog post is an explanation of how to do that.

To structure the post, I will divide the problem into three cases:
max entropy bits (probability exactly 50%),
low entropy bits (probability below 1%),
and mid entropy bits (probability between 1% and 50%).
After explaining how to produce high rates of each of these types of bits,
I'll finish by showing how to measure their quality.


# Producing Max Entropy Bits

Producing max entropy bits at a high rate is something that I would describe as a solved problem.
Or at least, solved enough for our purposes here.
Doing this effectively is not about solving the problem for yourself, it's about finding a good pre-existing solution to use.

First, you need to pick a language that doesn't have a lot of runtime overhead.
If you picked Python, you've already thrown away 10x or even 100x performance.
For example, on my machine, Python takes tens of nanoseconds to increment a single integer (instead of tenths of nanoseconds).
Second, you need to pick a pseudo random number generator that has good performance and meets whatever quality requirements you have.
There's lots of options out there, with various tradeoffs between quantity and quality, so make sure to look around.

In this post, I'll be using C++ as the language and the 64 bit mersenne twister
[`std::mt19937_64`](http://www.cplusplus.com/reference/random/mt19937_64/) as the pseudo random number generator.
I made these choices because a) the mersenne twister is well established as a decent PRNG, and b) I measured that the standard C++
implementation was capable of producing output fast enough to meet my needs.
These choices would be different if e.g. I needed more guarantees about memory safety or if I needed cryptographically secure entropy.

Here is example code showing how to produce random bits with this generator.
[Correctly seeding `std::mt19937_64` can be a bit tricky](https://codingnest.com/generating-random-numbers-using-c-standard-library-the-problems/),
so to avoid that whole thing the example code I'm providing is always going to take a reference to some already-initialized instance:

```C++
#include <cstdint>
#include <random>

/// Randomize the bits from out_start (inclusive) to out_end (exclusive).
void generate_max_entropy_bits(uint64_t *out_start, uint64_t *out_end, std::mt19937_64 &rng) {
    for (uint64_t *cur = out_start; cur != out_end; cur++) {
		*cur = rng();
	}
}
```

The above code is simple (just iterate over the memory that the caller asked you to randomize, writing the output of the prng into that memory)
and sufficiently performant (on my machine it writes 20 gigabits of entropy per second).


# Producing Low Entropy Bits

Usually when you're simulating error processes, the errors have a pretty small chance of occurring.
For example, the threshold error rate of the surface code is roughly 1%,
so if you're doing surface code simulations most of your simulated errors are going to occur less than 1% of the time.
In this section, we want to produce bits that decide whether or not these errors occur.
We want to produce a lot of biased random bits that are ON with independent probability $p < 1\%$.

The easy way to produce a biased random bit that's ON with probability $p$ is to generate a uniform random real number $r$ over the range $[0, 1)$,
and return the value of the expression $r < p$ as your biased random bit.
Equivalently, you can produce a uniform random $b$-bit integer $i$ over the range $[0, 2^b)$ and return the value of the expression $i < \lfloor p 2^b \rfloor$.
Note that this truncates $p$ to $b$ bits of precision, distorting the output; we'll come back to that later.

The easy method for producing biased bits that I just described is very inefficient.
This is perhaps most obvious if you look at how much entropy is being consumed versus how much entropy is being produced.
Suppose that $p=0.1\%$ and that $b=32$.
The entropy of a bit that is ON with probability $0.1\%$ is $-0.001 \log\_2 0.001 \approx 0.01 \text{bits}$.
The easy method is consuming 32 bits of entropy to produce one hundredth of a bit of entropy; a loss of more than 1000x.
Recall that we can produce max entropy bits at 20GHz, and that these are the input bits into the biasing process.
Having an input rate of 20GHz and a loss factor larger than 1000 means that the output rate cannot be faster than 20MHz, which is too slow.

There are a variety of ways of being more efficient with the entropy that we're given.
For example, we could use an [arithmetic coder](https://en.wikipedia.org/wiki/Arithmetic_coding).
However, making arithmetic coding fast requires precomputing Huffman tables, and I happen to know that
for Stim there isn't really time for that (it tends to generate 1000 bits for one noise process using some probability $p\_1$ and then move on to some other process with a different probability $p\_2$).
Instead, I've found that a very effective strategy is to switch from directly sampling each output bit to sampling the
*length of the gaps between the 1s*.
This changes the amount of work we're doing, so that instead of scaling with the number of output bits,
we're scaling with the number of ON output bits.
This is great because we know we're working in a context where ON output bits are rare.

Let's work out what the distribution of gaps between ON bits is.
We're flipping a coin heavily biased towards HEADS and we're sampling how many times we need to flip before we get a TAILS.
The probability that we immediately get a TAILS is $p$,
the probability we get HEADS then TAILS is $(1-p)p$,
and in general the probability of getting $k$ HEADS until finally landing that TAILS is $(1-p)^k p$.
So our distribution is $P(k) = p (1-p)^k$.
That's the [geometric distribution](https://en.wikipedia.org/wiki/Binomial_distribution).

C++ includes a built-in utility [`std::geometric_distribution`](https://en.cppreference.com/w/cpp/numeric/random/geometric_distribution)
for sampling from the geometric distribution.
Using it, we can write some low entropy biased bit sampler code:

```C++
#include <cstdint>
#include <random>

/// Randomize the bits from out_start (inclusive) to out_end (exclusive) with bias probability p.
/// Assumes that the output range is zero'd.
void generate_low_entropy_bits(
        double probability,
        uint64_t *out_start,
        uint64_t *out_end,
        std::mt19937_64 &rng) {
    std::geometric_distribution<uint64_t> geo(probability);
	size_t n = (out_end - out_start) * 64;
	for (size_t k = geo(rng); k < n; k += gen(rng) + 1) {
	    out_start[k / 64] |= uint64_t{1} << (k % 64);
	}
}
```

On my machine, with $p=0.1\%$, this method produces output bits at a few GHz.
As $p$ gets smaller, the runtime also gets smaller.
This is because, under the hood, the geometric distribution is using a single sample and some algebra to produce its output.
Note that the cumulative geometric distribution has a simple expression $C(k) = \sum_{i=0}^{k-1} p (1-p)^i = 1 - (1-p)^k$.
We can isolate $k$ in this expression to get $k = \log(1 - C(k)) / \log(1 - p)$.
If we replace the $C(k)$ with a uniformly random real sample from 0 to 1, then that expression is a sample from the
geometric distribution:

```C++
uint64_t convert_uniform_sample_to_geometric_sample(double probability, uint64_t sample) {
    double u = ((double)sample + 0.5) / pow(2, 64);
    return (uint64_t)floor(log(u) / log1p(-probability));
}
```

(This code makes a few tweaks to the algebra to avoid some rounding issues.
It adds 0.5 to the sample to get the midpoints of the $2^{64}$ buckets, and uses $u$ instead of $1-u$, so that the argument to $\log$
is never 0.
Note that this code does introduce some distortion.
For example, a real geometric distribution has a non-zero probability of sampling $2^{64}+1$ whereas the above code obviously will not ever return that result.
We'll come back to the issue of quality later.)

Now that we have some insight into what's going on behind the scenes, we can see why this method is capable of going so much faster.
First, the entropy usage is much more efficient.
We're consuming 64 bits of entropy per geometric sample, and each geometric sample gives us (on average) $1/p$ output samples.
For $p=0.1\%$ that means we're consuming $0.064$ input bits per output bit.
Compared to the easy method, that's over two orders of magnitude closer to the $0.01$ bit limit at $p=0.1\%$.
Second, although we are calling some pretty heavy weight functions like $\log$, the cost of these calls is amortized over hundreds of output bits.
That is to say, we're in a pretty good place in the space of possible tradeoffs between entropy efficiency and compute efficiency.


# Producing Mid Entropy Bits

At last we come to what I consider the hardest case: bits whose probability is between 1% and 49%.
I don't particularly want to go through a list of everthing I tried, most of which had pretty mediocre results.
I'm just going to explain the thing I did that worked the best.

The key underlying idea I used was to truncate the probability, to make the sampling easier to do, and then to fix the distortion from the truncation
using a refinement involving low entropy bits.
Instead of sampling bits with probability $p$, we'll sample the bitwise-or of bits with probability $p^\prime = \lfloor p \cdot 2^8 \rfloor / 2^8$
and bits with probability $(p^\prime - p) / (1 - p^\prime)$.
(Exercise for the reader: check that this in fact produces bits that are ON with probability $p$.)

To sample from the truncated probability, which had 8 bits of precision, I initially grouped the bits coming out of the random number generator
into random bytes and used the easy "is it less than 256p" conversion.
I used vectorized instructions to do many of these comparisons with fewer instructions.
However, surprisingly, I found that this was slower than using bit-level parallelism.
Instead of using the CPU's built-in comparison instructions, I took the circuit for a ripple carry comparator and ran a bitwise instruction for each gate from the circuit.
This is of course slower than the native comparison, but it turns out it's not 64 times slower; so the 64 times speedup of using bit-level parallelism on 64 bit words ultimately wins the day.

Here's simplified code for generating mid entropy bits:

```C++
#include <random>
#include <cstdint>
#include <cassert>

void or_low_probability_bits(
        double probability,
        uint64_t *start,
        uint64_t *end,
        std::mt19937_64 &rng) {
    if (probability == 0) {
       return;
    }
    double d = log1p(-probability);
    size_t i = 0;
    size_t n = (end - start) * 64;
    while (true) {
        double u = ((double)rng() + 0.5) / pow(2, 64);
        i += (uint64_t)floor(log(u) / d);
        if (i >= n) {
            return;
        }
        start[i / 64] |= 1ULL << (i & 63);
        i++;
    }
}

void generate_biased_random_bits(
        double probability,
        uint64_t *start,
        uint64_t *end,
        std::mt19937_64 &rng) {
    assert(probability <= 0.5);
    constexpr size_t COIN_FLIPS = 8;
    constexpr double BUCKETS = (double)(1 << COIN_FLIPS);
    double raised = probability * BUCKETS;
    double raised_floor = floor(raised);
    double raised_leftover = raised - raised_floor;
    double p_truncated = raised_floor / BUCKETS;
    double p_leftover = raised_leftover / BUCKETS;
    uint64_t p_top_bits = (uint64_t)raised_floor;

    // Flip 8 coins for each output bit, using the position of the first HEADS
    // result to select a bit from the probability's binary representation.
    for (uint64_t *cur = start; cur != end; cur++) {
        uint64_t alive = rng();
        uint64_t result = 0;
        for (size_t k_bit = COIN_FLIPS - 1; k_bit--;) {
            uint64_t shoot = rng();
            result ^= shoot & alive & -((p_top_bits >> k_bit) & 1);
            alive &= ~shoot;
        }
        *cur = result;
    }

    // De-truncate the probability by refining the output.
    or_low_probability_bits(
        p_leftover / (1 - p_truncated),
        start,
        end,
        rng);
}
```

You can also view the [production code in stim](https://github.com/quantumlib/Stim/blob/8d56132e31a3ea39cc15def2758859b0faf85f10/src/stim/probability_util.cc#L80).

On my machine, this code produces output bits at a rate of 1-2 GHz.
Note that, just by focusing on entropy conversion efficiency, we can see that this speed makes sense.
We're consuming ~8 bits of entropy per output bit,
and the output rate is ~8 times slower than the rate that we can produce max entropy bits.
In principle, it should be possible to do better by reducing the amount of waste in the entropy conversion.
Unfortunately, I don't know how to do that without increasing the computational cost of the conversion so much that it erases the gains.

# Quality

Throughout the post I've mentioned that there are distortations in the output.
In this section, I want to quantify how big those distortions are.
The metric that I'll be using is "expected bits of evidence per sample".

Basically, suppose we are generating samples that are being given to an ideal Bayesian reasoner
and that reasoner is attempting to determine whether those samples are coming from an ideal
distribution or our code approximation that ideal distribution.
How quickly is that reasoner able to distringuish between those two cases
(assuming they have access to our source code)?
Well, for each possible sample $s$, there will be an ideal probability $P(s)$ and an actual achieved probability $P^\prime(s)$.
Upon seeing $s$, a Bayesian reasoner that currently assigns $a:b$ odds will perform a Bayesian update $a:b \rightarrow a P(s) : b P^\prime(s)$.
We're trying to quantify the rate at which the odds on the left and right hand sides diverge from each other.

Understanding the divergence of the odds is simpler when using log odds.
We can rewrite the update process into the following form: $1:2^x \rightarrow 2^{x + \log\_2 \frac{P^\prime(s)}{P(s)}}$.
Now instead of having to understand two multiplications, we only have to understand one addition.
The value being added, $\log\_2 \frac{P^\prime(s)}{P(s)}$, is the "bits of evidence" of an observation.
Its magnitude represents how much the Bayesian reasoner will update based on seeing the sample $s$.
If a sample is twice is as likely to be produced by our implementation than by an ideal process, then upon seeing that sample
the Bayesian updater will shift by one bit (one factor of 2 in the odds) towards the generator in question being our implementation
instead of the ideal process.

When observing samples produced by our implementation,
the expected bits of evidence that the Bayesian reasoner will gain per sample is $P^\prime(s) \log\_2 \frac{P^\prime(s)}{P(s)}$.
If this value was equal to 0, our implementation would be exactly perfect.
In practice our implementation is never perfect, and so the expected bits of evidence per sample is non-zero, and so the Bayesian reasoner will slowly become confident that they are using our generator instead of an ideal generator.
If the expected evidence per sample is $10^{-9}$, then it would be reasonable for us to say that our bit producing process is safe to use
for a billion samples, but if you use it for a trillion samples you've gone too far and are perhaps measuring properties of the
distortions between the idealized process and the actual process rather than properties of the idealized process.

Here is code that computes the expected evidence per sample for the low entropy sampling code
(assuming that the input entropy is ideal):

```C++
#include <functional>

uint64_t convert_uniform_sample_to_geometric_sample(double probability, uint64_t sample) {
    double u = ((double)sample + 0.5) / pow(2, 64);
    return (uint64_t)floor(log(u) / log1p(-probability));
}

template <typename T>
T binary_search_first(T target, std::function<T(T)> f) {
    T min = 0;
    T max = -1;
    while (min < max) {
        T dif = (max - min) >> 1;
        T med = min + dif;
        T a = f(med);
        if (a >= target) {
            max = med;
        } else {
            min = med + 1;
        }
    }
    return min;
}

double expected_evidence_per_low_entropy_bit(double p) {
    double result = 0;
    for (uint64_t k = 0; k < 100000; k++) {
        auto f = [&](uint64_t s){ return convert_uniform_sample_to_geometric_sample(p, ~s); };
        uint64_t v0 = binary_search_first<uint64_t>(k, f);
        uint64_t v1 = binary_search_first<uint64_t>(k + 1, f);
        double actual = (v1 - v0) / pow(2, 64);
        double ideal = p * pow(1 - p, k);
        double rtol = actual / ideal;
        if (actual > 0) {
            result += log2(actual / ideal) * actual;
        }
    }
    return result;
}
```

According to this code, for $p=0.001$, the expected evidence per sample is $10^{-15}$ bits.
Basically, you can produce a million billion samples from the low entropy sampling process before you have to start worrying about
distortions due to numerical imprecision.

I also checked what happened if the input samples were 32 bit numbers instead of 64 bit numbers ($10^{-8}$ evidence bits per sample) and what happened if I used
single precision floats insteasd of double precision floats ($10^{-6}$ evidence bits per sample).

# Closing Remarks

You can see the sampling code [in stim on github](https://github.com/quantumlib/Stim/blob/8d56132e31a3ea39cc15def2758859b0faf85f10/src/stim/probability_util.cc#L80).

I used the evidence-per-sample estimates when deciding whether to use double or single precision floats in stim's code.
I decided to go with single precision.
This is probably a bit surprising to you, since it means a few million samples is enough to betray that the sampling is approximate and a million samples is not that many.
There are three factors that made me decide this way.
First, using single precision floats is faster and stim is very *very* speed focused.
There needs to be a good reason *not* to go fast.
Second, the ideal Bayesian reasoner is a worst case scenario.
Stim is instended for use cases like estimating how often a syndrome decoder makes a bad prediction.
That kind of process should be much less sensitive to the distortions introduced by these approximations.
Third (and, honestly, the actual deciding factor) we don't know the error rates of actual quantum hardware to *anywhere near* "million samples to tell apart" levels of precision.
Physical error rates drift orders of magnitude more than that from day to day.
Any result that was ruined by distortion this small would have to be laughably disconnected from practice.
