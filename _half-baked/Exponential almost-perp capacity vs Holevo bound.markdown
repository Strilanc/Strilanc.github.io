The Holevo bound says that you can transmit at most 1 bit per qubit (not entanglement assisted).

But although R^N supports only N mutually perpendicular vectors, it supports exponentially many nearly-perpendicular vectors.

With N qubits we're working in C^(2^N), meaning we can pack doubly-exponentially many nearly-perp vectors. Why can't we recover the packed nearly-perp vector with high fidelity, allowing us to send say 1 out of 2^(2^N) states, meaning log(2^(2^N)) bits ~= 2^N bits of classical information with N qubits?

We can use the packing from the megasphere puzzle to get an idea.

Suppose we have a $t^2$-level quantum system, i.e. we have $2 lg(t)$ qubits.
Also suppose that $t$ is a prime power, so we have a finite field of that size.
Then we can use polynomial of degree $m \pm 1$ to generate superpositions that overlap in at most $m$ states out of $t$.

$B_i = \frac{1}{\sqrt{t}} \sum_{k=0}^{t-1} \ket{m}\ket{P_i(k)}$

$B_i \cdot B_j \leq \frac{m}{t}$ when $i \neq j$

If we have some target error level $\epsilon$ then that means we want $B_i \cdot B_j \leq \epsilon$ which we can do by $\frac{m}{t} \leq epsilon$.

So we pick $m \leq t \epsilon$ or rather $m \approx t \epsilon$

The original number of states is $t^2$.
The number of poly-states is $p = t^{\epsilon t}$.

We start winning once $t \epsilon \geq 2$, or $t \geq \frac{2}{\epsilon}$.

For $n$ qubits and an error rate of $2^{-e}$ we have $t=2^\frac{n}{2}$, $m=2^{\frac{n}{2}-e}$, $p = t^m = 2^{\frac{n}{2} \cdot 2^{\frac{n}{2}-e}}$.

For example, for 100 qubits and an error rate of $2^{-40}$ we have $t=2^{50}$, $m = 2^{10}$, $p = t^m = (2^{50})^(2^{10}) = 2^{50 \cdot 2^10} \approx 2^{50000}$.
We expanded to 50000 bits worth of nearly-distinguishable states with 'nearly' being a 1-in-a-trillion chance of error!

On the other hand, there's an awful lot of chances for error...
With $r$ other vectors we have a $(1-2^{-40})^r$ chance of succeeding.

$(1-\epsilon)^r$

but we'll be losing like an $\frac{\epsilon}{2}$ worth of chance until we get to the 50/50 point, so if $\epsilon = 2^{-40}$ then when $r=2^40$ we're definitely below 50% chance of success.

It seems like the massive number of chances for failure is what kills us; the all-to-all error instead of the one-to-one error.


