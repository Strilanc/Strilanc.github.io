---
layout: post
title: "Chunky Quantum Multiplication"
date: 2018-06-11 11:11:11 am PST
permalink: post/1800
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Last week, I read the pre-print [Improved reversible and quantum circuits for Karatsuba-based integer multiplication](https://arxiv.org/abs/1706.03419) by Parent et al.
In the paper, they describe an $n$-bit quantum circuit for multiplication that uses $O(n^\lg\_2(3))$ gates, $O(n^1.427)$ qubits, and $O(n^1.158)$ depth.
Which got me to thinking about quantum circuits for multiplication, and wondering why all the papers I've read on the subject never seem to mention a few obvious constructions informed by classical arithmetic circuits.

For example, the [Schönhage-Strassen algorithm](https://en.wikipedia.org/wiki/Sch%C3%B6nhage%E2%80%93Strassen_algorithm) can multiply two $n$-bit integers in $O(n \cdot (\lg n) \cdot \lg \lg n)$ time.
The algorithm is serial so, if you translate it into a quantum circuit, the running time bounds the depth, gate count, and ancillary space used by the circuit.
(The algorithm also has a divide-and-conquer structure, so you can reduce the depth to $O(n \cdot \lg \lg n)$ at the cost of increased ancillary space.)

Note that an $O(n \cdot (\lg n) \cdot \lg \lg n)$ depth/gate/space circuit is asymptotically better than Parent et al's circuit in every way.
Which is fine; their paper is not about finding "the best" multiplication circuit.
The paper is about fixing a problem with a particular type of multiplication circuit and doing a better job at compiling recursive algorithms into circuits.
And, when you take into account the constant factors of these algorithms, it's not so clear which circuit is better.
For example, GMP switches from Karatsuba-like methods to Schönhage-Strassen-like methods when numbers [exceed 4000 to 10000 bits (it depends on your CPU)](https://gmplib.org/devel/thres/MUL_FFT_THRESHOLD.html).
That threshold is slightly higher than [recommended key lengths for RSA](https://crypto.stackexchange.com/a/19702/7860), e.g. 3072 bits.

In this post, I'm going to talk about some other strategies for multiplying numbers.
In particular, I'll talk about an algorithm that does better than simply compiling Schönhage-Strassen into a quantum circuit.
But first, let's go over some other extremes.


# Multiplication by Repeated Shifted Addition

The first thing people try, when writing a multiplication algorithm, is the technique taught in grade school.
Go digit-by-digit through one of the numbers, and add the other number times that digit into an accumulator.
This algorithm is particularly simple in binary, because "times a digit" becomes "do the addition if the bit is 1, otherwise do nothing".

Repeated shifted addition is simple, and requires no ancillary space at all, but slow.
Quantum multiplication circuits based on this strategy tend to have quadratic depth.

[[[diagram]]] 

We can make this circuit better by doing the addition with a logarithmic-depth carry-lookahed adder, such as [this quantum one with $2n + o(n)$ ancillary space proposed by Draper et al](https://arxiv.org/abs/quant-ph/0406142).
That increases the ancillary space costs from 0 to $2n + o(n)$ and the gate count to $O(n^2 \lg n)$, but reduces the depth from $O(n^2)$ to $O(n \lg n)$.

Another way to improve on this algorithm, at the cost of increased space usage, is parallelizing between the adds.


# Multiplication by Spreading and Merging in Parallel

What if, instead of adding the digit-multiplication summands into the accumlator one at a time, we made them all at once and then summed in parallel?
In other words, do the multiplication with a [Wallace tree](https://en.wikipedia.org/wiki/Wallace_tree).

This will be *very fast*.
Generating all the $n$ numbers of add only takes $O(\lg n)$ time, and it takes $O(\lg n)$ pairwise mergings to fold those numbers into a single result.
In total, the depth of the circuit is $O(\text{Add}(n) \cdot \lg n)$.
By using a logarithmic-depth carry-lookahed adder, such as [this quantum one with $2n + o(n)$ ancillary space proposed by Draper et al](https://arxiv.org/abs/quant-ph/0406142), we achieve a depth of $O(\lg^2 n)$.

The problem, of course, is how much space we're using while computing all the summands at the same time.
Each summand has $n$ bits, and there are $n$ summands, so we need $O(n^2)$ space.
Qubits are very expensive, so this is a big problem.

What we really need is something in between these two strategies, with some good use of parallelization but not a ton of space.
But before I talk about that, we need to talk about something else.


# Chunked Multiplication

To find a middle-ground between the massive parallelization of a Wallace tree and the completely serial nature of repeated shifted addition, split the input registers into chunks of size $C$.
Then iterate over the block pairs, working in parallel when possible, fused-multiply-adding them into an accumulator.
(I will explain in the next section how to do the accumulation in parallel and work around an overhead problem caused by propagating carries.)

The accumulator $T$ is twice as large as the two inputs $A$ and $B$.
Our goal is to multiply every input chunk $A\_i \cdot B\_j$ and add them into the accumulator chunk $T\_{i+j}$.
We first match index-by-index and perform $A\_0 \cdot B\_0$, $A\_1 \cdot B\_1$, ..., $A\_{n/C-1} \cdot A\_{n/C-1}$.
Notice that $A\_i \cdot B\_i$ adds into $T\_{2i}$, so all these FMAs are affecting targeting separate parts of the accumulator.

We then move on to pairings of the form $A\_i \cdot B\_{i+1}$.
Then $A\_i \cdot B\_{i+2}$.
And so forth up to $A\_i \cdot B\_{o + (N/c) - 1}$.
(Note that input indices are modulo $n/C$.)

There are $M = n/C$ chunks of size $C$ in inputs of size $n$.
There are $M^2$ chunk pairs to work through, and we can do $O(M)$ chunk pairs per step, so it will take $O(M)$ steps to do them all.
Each step involves many FMAs being done in parallel.

The cost of an FMA depends on the chunk size.
To avoid super-linear space overhead, we will not be recursing when performing the chunks.
Instead, we will use repeated-shifted-addition with carry-lookahead adders.
The depth of an FMA will be $O(C \cdot \lg (C + \lg n))$.
The $\lg n$ is related to carry overhead I will explain later.

Our overall complexity is $O(M * \text{FMA}(C)), the number-of-steps times the cost-per-step.
There's some extra costs for creating the final result and uncomputing intermediate results, but these are asymptotically negligible.
Given our chosen FMA strategy, that means our depth will be $O(n/C \cdot C \cdot \lg (C + \lg n))$ which simplifies to $O(n \cdot \lg (C + \lg n))$.
This clearly hints that we should pick $C \propto \lg n$, giving us an exact asymptotic depth of $O(n \lg \lg n)$.

This algorithm has two sources of space overhead.
First, there are the asymptotic additions.
They contribute $2n + o(n)$ space overhead.
Second, there is some magic happening with the accumulator that will contribute another $3n$ space overhead.
So the total ancillary space is $5n + o(n)$.

The gate count of this algorithm is $O(n^2 \lg n)$.

We have achieved the same depth and size as parallelized Schönhage-Strassen, but with low-constant linear space.


###########


If we apply low-depth addition to SS multiplication, then the divide step goes from $O(n)$ to $O(\lg n)$.
This reduces the time cost to $O(\lg^2 n)$ I think, but increases the space overhead to $n \lg \lg n$.
But I haven't worked through all the details, so take that with a grain of salt.


# Carry Termination

The chunked-multiplication circuit I described does a lot of adding.
Specifically, it does a lot of *small independent* adding into a large carry register.
But, in the context of quantum computing, *every one of those additions might carry all the way to the top of the accumulation register*.

Classically, the possibility of a long carry propagation isn't a problem.
Just condition on the carry bit being set and short-circuit the propagation if it's not.
Every now and then we'll carry a tiny addition all the way to the top of the accumulator, but usually we won't.
In aggregate, we can guarantee a constant time overhead.

But short-circuiting isn't possible on a quantum computer.
We'd have to measure the carry bit to do that, which would cause decoherence, which would defeat whatever purpose we had for using a quantum computer in the first place.
So, quantumly, every single addition has to sweep over the entire accumulator just in case there's a carry happening in some branch of the superposition.
Even though long carries are rare, we have to pay the overhead every time.
This tends to add a factor of $n$ to our asymptotic complexity.

To work around this problem, I will be using what I call a "carry termination register".
This is just a second accumulator register, but we only use it for carries.

We logically divide this second register into "blocks" that will each accept carries from the main register.
If there are $k$ values to add, then a simple safe block size is $\lceil \lg k \rceil + 1$.
(You can go smaller, or even use a heterogeneous blocks. Just make sure that each block can hold all the carries it will be given, without overflowing.)

Now, instead of propagating an addition's carry all the way to the top of the accumulator, we can divert the propagation into the carry termination register at the next block boundary.
This reduces the per-addition overhead during multiplication from the accumulator-sized $O(n)$ to the block-sized $O(\lg n)$.

One downside of this approach is that it spreads the answer across two registers.
We could just add one into the other and say "done!", but that ignores our cleanup duties.
We can't just leave registers lying around with junk information related to the computation.
That would cause decoherence!
We need to uncompute that junk.

There may be a better way to do this, but I just went with the easiest thing: use a temporary clean register as the accumulator.

[[[]]]

Now that that's explained, I can start talking about multiplication.



# Some tricks I won't go into

If you use a low-depth addition circuit such as X, you can reduce the depth to $O(N \lg \lg N)$ at the cost of some space (how much?).

By playing clever pebble games, you can avoid most of the space cost from using a kogge stonne adder.
$O(what?)$

We're not using half of the termination register!
We can reduce the ancillary space used to $3/2 N$ by being more clever in how we carry and merge.
(Actually we can do any $N \cdot (1 + \epsilon)$, but the less space you use the more time you spend propagating carries to a block boundary.)

We could recurse the multiplication, but the space usage would go up and there'd be no gains in the asymptotic time (are you sure?).




# Summary

When you're willing to pay for the space, classical circuits can inform quantum circuits.

Multiplication can be done in nearly-linear time and definitely-linear ancillary space.



And that's it!
A






We make sure that the carry enters the termination register at the start of a "block".

See, when implementing a quantum circuit that performs many small additions, there is no way to tell at runtime whether or not a carry needs to be propagated or not.
So, to be safe, every addition has to carry all the way to the end of the register.
If the target register has size $n$ and the input register you want to add into the target has size $\lg n$... well, too bad, you have to do $O(n)$ work.

A carry-termination register is a second register, placed alongside the target register, that you redirect carries into.
The idea is that, because you know the carry-termination register started out zero, and also you know how many possible-carries you've redirected into it at each position, you can cut off the carries earlier.
For example, ...

[[[]]]

# Grouped Accumulation

My strategy for low-depth multiplication is based on splitting the inputs into blocks of size B.
Performing the multiplication then comes down to sub-multiplying all of the block pairs, and adding up the results.




Grouped accumulation
	Chunk the two input registers into blocks of size B, so there are m=N/B blocks.
	Allocate two registers of size 2N.
	The first register is our accumulator, and the second register is a carry terminator.
	We need B to be at least lg(N) in order for the carry termination to work properly; otherwise we need more space.
	For each chunk pair, we're going to add into the target register at the appropriate place then detour into the carry terminator register after 2B bits for lg(N) more bits or so.
	Because most targets are disjoint we can do m/2 additions.
	With the right pattern we can do this every step, so it will me m^2 / (m/2) = 2m steps before we've done all the additions.
	We then add the two registers into the actual target and uncompute.
	We do the sub-multiplications exhaustively, instead of recursing, to avoid more space overhead.
	We assume that addition takes linear gates and depth, and no ancilla (It's likely that this could be improved...)
	
	If we know the target register is 0, we can use it instead of the carry terminator and still do the uncomputation.
	
	Time: num_steps * time_per_step = 2m * B^2 = NB = N lg(N)
		2m * M(B)
	Space: 4N
	Gates: num_steps * gates_per_step = NB = N lg(N)
	Volume: N^2 lg(N)
	
	If we use sqrt(lg(N)) registers instead of just 2, then the best size reduces to sqrt(lg(N)) and the time reduces to sqrt(lg(N)) while anciallea increases by the same factor.
	With a block-size of one we need carry registers of size lg(N), and our costs start being dominated by carrying.
	We still have to do O(n) carries per slot, but each takes O(lg N) time so that's O(n lg n) time which is worse than the sqrt(lg(N)) block size. The space is also worse.







Basing quantum multiplication on classical circuits

Last week, I read the pre-print [Improved reversible and quantum circuits for Karatsuba-based integer multiplication](https://arxiv.org/abs/1706.03419) by Parent et al.
In the paper, they describe an $n$-bit quantum circuit for multiplication that uses $O(n^\lg\_2(3))$ gates, $O(n^1.427)$ qubits, and $O(n^1.158)$ depth.

My first reaction to this paper was something along the lines of "What? I can do better than that!".
That reaction really isn't fair to the spirit of the paper, but there's several technical senses in which it's true.

First of all, consider Strassen??? multiplication.
This classical algorithm can multiply two n-bit integers in $O(n \lg n \lg lg n)$ time
If we simply directly translate this algorithm into a classical reversible circuit, plus some uncomputation, we get something we can run on a quantum computer.
The circuit will have size, depth, and gate count all bounded by the classical runtime (because Strassen multiplication is a serial algorithm).
This is better than the algorithm in the paper along every single axis!

Second, I found a way to tweak the algorithm in a way that achieves linear? depth and time.
However, it increases the gate count to $O(n^2)$, at which point why are you doing Karatsuba multiplication?
We can do much better things with that many gates and $O(n)$ ancillary space.


The reason this isn't an indictment of the paper is that a) they're up-front about focusing on Karatsuba-style multiplication, b) they have better constant factors, and c) the paper is really about trying to get recursion to work nicely.
Still, it raises the question of what *else* we can do by re-purposing classical algorithms and circuits into quantum ones.

# Classical Multiplication Circuits

The simplest way to perform multiplication is the way you were taught in school: repeated shifted addition.
The nice thing about this kind of circuit, when we translate it into a quantum circuit, is that it can be done inline.

[[[]]]

Of course that assumes we do the additions inline, which I'll address a bit later.
The downside with this approach is that it takes so many additions that you end up with something quite deep.

When you're working with classical circuits, an alternative simple thing you can do is what I call the "spread out really fast to get all the intermediate stuff we need, then merge it back together" strategy.
Or, as it's apparently called, the [Wallace tree](https://en.wikipedia.org/wiki/Wallace_tree).

The great thing about this approach is that it's very shallow.
It takes $O(A(N) \lg N)$ time to spread, combine, and merge all the bits into the result we want.
The downside of this approach is that it has a very girthy center; there are $O(N^2)$ bits in play half-way through, so on a quantum circuit this would require $O(n^2)$ space and $O(n^2 \lg n)$ gates.

In between these two extremes we have



In this post I'm going to explain why I thought that, and also the way in which it's not true.

First, it's important to realize that 



Quantum multiplication algorithms


The Obvious Thing
	Just do controlled shifted additions
	
	Time: O(n^2)
	Ancillae: 0
	Size: O(n)
	Gates: O(n^2)
	
	There have been many constant factor improvements to this approach...?


Maximum parallel
	Make lots of copies of each value in logarithmic time so that you can compute all the and-pairs at the same time, then merge them in parallel into a single total.
	The splitting takes lg(N) time
	To do the merging we do carry-predicting additions that have logarithmic depth.
	It takes lg(n) merges to get everything back together, for a total time of O(lg^2 N)
	Uncomputing also takes O(lg^2 N)
	
	The problem with this approach is that it uses a large amount of space.
	Every single result is being stored in new qubits, so the total space matches the number of gates.
	
	Gates: n^2 + n lg^2(n) = n^2
	Ancillae: n^2
	Depth: lg^2 N
	Volume n^2 lg^2 n
	

Grouped accumulation
	Chunk the two input registers into blocks of size B, so there are m=N/B blocks.
	Allocate two registers of size 2N.
	The first register is our accumulator, and the second register is a carry terminator.
	We need B to be at least lg(N) in order for the carry termination to work properly; otherwise we need more space.
	For each chunk pair, we're going to add into the target register at the appropriate place then detour into the carry terminator register after 2B bits for lg(N) more bits or so.
	Because most targets are disjoint we can do m/2 additions.
	With the right pattern we can do this every step, so it will me m^2 / (m/2) = 2m steps before we've done all the additions.
	We then add the two registers into the actual target and uncompute.
	We do the sub-multiplications exhaustively, instead of recursing, to avoid more space overhead.
	We assume that addition takes linear gates and depth, and no ancilla (It's likely that this could be improved...)
	
	If we know the target register is 0, we can use it instead of the carry terminator and still do the uncomputation.
	
	Time: num_steps * time_per_step = 2m * B^2 = NB = N lg(N)
	Space: 4N
	Gates: num_steps * gates_per_step = NB = N lg(N)
	Volume: N^2 lg(N)
	
	If we use sqrt(lg(N)) registers instead of just 2, then the best size reduces to sqrt(lg(N)) and the time reduces to sqrt(lg(N)) while anciallea increases by the same factor.
	With a block-size of one we need carry registers of size lg(N), and our costs start being dominated by carrying.
	We still have to do O(n) carries per slot, but each takes O(lg N) time so that's O(n lg n) time which is worse than the sqrt(lg(N)) block size. The space is also worse.
	

Use the best classical algorithm

	Size: n \lg n 2^{O(lg^* n)} * [horrible constant factor]
	Depth: n \lg n 2^{O(lg^* n)} * [horrible constant factor]
	Gates: n \lg n 2^{O(lg^* n)} * [horrible constant factor]
	
	That being said, the constant factors on this will be *awful*.
	Much more realistic to use, say, Karatsuba multiplicatino:
	
	Size=Depth=Gates=n^{\lg 3}

The problem with using the well known classical algorithms is that they're designed for serial machines, or under the assumption that space is cheap.
Quantum computers have to do work keeping every qubit alive, so they might as well sneak in useful work while they do that.
This makes them want to work on every qubit all the time, if we can.
A better analogy would be a classical circuit, except that we want to avoid building up huge amounts of garbage qubits that need to be uncomputed.


Improved karatsuba

	From the paper
	

	----
	
It's interesting that the asymptotics of the not-horrible-constant-factor quantum algorithms I found are not that much better than the classical multiplicationa lgorithm where we work serially.
I bet there's much better algorithms here, with linear space overhead and poly-logarithmic depth, just waiting for the right person to find them.



Low-depth addition

Drapper addition + low-depth QFT
	How much space does this use?
	O(lg n + lg lg 1/eps) depth
	O(n lg(n/eps)) size (space? gate? which?)
	
	
Toffily-based low-depth addition:

	add bottom half and top half separately, but do top half with and without carry.
	bottom half is amplified and select selects top half
	uncompute
	
	ancillae: F(N) = 3F(N/2) + N/2 = N/2 + 3/4 N + 9/8 N + ... = N/2 (3/2)^lg n = N/2 n^lg(3/2) = 1/2 n^lg(3) = n^lg(3)
	time: F(N) = F(N/2) + lg(N) = lg(N) + lg(N/2) + lg(N/4) + ... <= lg^2(N)
	gates: 3 F(N/2) + N = n^lg(3)
	
	Or more generally we can divide into K pieces and get:
	
	ancilla: F(N) = (2K - 1) F(N/K) + N = N sum ((2K-1)/K)^j ~= N 2^lg_k(N) = N 2^lg(N)/lg(k) = N^(1 + 2/lg(k))
	time: F(N) = F(N/K) + K + lg(N) = (K+K/K+...) + (lg(N) + lg(N)/K + ...) = K + lg^2(N)
	
	
	
Square root Toffoli-based low-depth addition:

	allocate N qubits in blocks of sqrt(N)
	sqrt(N) + lg(N) propagation time.
	time: F(N) = sqrt(N) + sqrt(N) = sqrt(N)
	space: N + 2 SQRT(N) = N
	gates: N
	
	ALTERNATIVELY
	
	Assuming we propagate carries in the inner and outer layers using fun recursive stuff...
	time: F(N) = 2 F(sqrt(N)) = 2^lg(lg(N)) = lg(N)
	space: F(N) = N + 2 sqrt(N) F(sqrt(N)) = N + 2N + ... = N * 2^lg(lg(N)) = N lg(N)
	
	
Naive multiplication with low-depth addition:

	Time: sqrt(N) * N = N^1.5
	Space: N
	
	or
	
	Time: lg(N)^2 N
	Space: N^lg(3)
	
	or
	
	Time: N lg(N)
	Space: N lg(N)
	
Speedy Multiplication:

	Use the super-low-depth addition in addition to block work
	
	Time: accumulate + merge
		= M*lg(B)*B + sqrt(N)
		= N/B * lg(B)*B + sqrt(N)
		= N * lg(B) + sqrt(N)
	
	Space: B^lg(3) * M + N
		= N * B^0.58 + N
		= N * B^0.58

Zippy Mult:
	Use the sqrt-depth addition
	
	Space: B*M + N = N
	Time: sqrt(B)*B*M = N sqrt(B)
	
	

	
	
Better low-depth addition:

Make a binary tree with aggregation results for computing carries (... somehow)
Access the results in log(N) time.

Building tree: O(N) space and time probably
Using tree to compute carries: would be lg(N) but there is contention.... lg(N) if we use O(N lg(N)) space
So probably...

	Time: lg(N)
	Space: N lg(N)
	
	And if we can pebble some of the space away then
	Space: N sqrt(lg(N))
	
In which case we could block0multiply with...

	Time: M * B*lg(B) + N = N lg(B)
	Space: M * B*lg(B) + N = N lg(B)
	B = lg(N)
	Time: N lg(lg(N))
	Space: N lg(lg(N))
	
Whereas doing straight naive would be:

	Time: N lg(N)
	Space: N lg(N)


	