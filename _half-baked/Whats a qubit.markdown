Trying to build up to qubits from classical and probabilistic computers.

Here is a [typical science article](http://arstechnica.com/science/2014/04/quantum-gate-could-link-multiple-qubits-into-single-computer/) trying to explain the difference between a classical bit and a quantum bit (qubit):

> Classical computing uses logic gates with a 1 or 0 value. Quantum bits, or qubits, can represent a 1, 0, or any state achieved by a mixture of these two through their quantum superposition.

There's nothing particularly wrong with this explanation, except that after you've read it you still have no idea what a qubit is.

Most explanations of quantum bits include a bunch of true facts, like "they can be a mix of 0 and 1" and "they can be entangled", but don't go far enough to explain why they aren't simple analog states or probability distributions.

In this post I will try to explain what a quantum bit is, by starting from normal everyday bits then moving up to quantum bits via analog states and probability distributions over states.

**Digital**

In a normal computer, a bit is something that can be set to one of two values (on/off, 1/0, true/false, red/blue, +/-, whatever). You store information in the computer by deciding on some way to assign the bits.

A geometric way to visualize the state space of digital bits is as *the corners of a cube*. If you have three bits then there are three directions along which you can make a one-way-or-the-other choice.

picture

Operations can also be visualized this way. Applying a NOT gate to a bit is equivalent to mirroring along the direction corresponding to that bit.

picture

We can also start with geometric operation and figure out what it means in terms of bits. For example, a half rotation corresponds to swapping two bits:

picture

If we only had two bits then we could get away with just the corners of a square, which is ever easier to visualize. But with more than three bits this visualization breaks down, unless you have the ability to visualize hyper cubes.

**Analog**

Sometimes science articles talk about qubits being "between" 0 and 1, which raises the question: isn't that just an analog computer?

Well, no, but let's consider how the state of an analog computer maps onto our cube. Now the state space is the entire volume of the cube, instead of just the corners.

picture

Again we can visual operations that apply to a single bit as applying along a single direction:

picture

This gives a lot more freedom, but ultimately not much more computing power. You can approximate an analog value by using several digital bits, and the approximation improves exponentially as you increase the number of bits.

**Probability Distributions**

Let's go a bit further now and imagine we have a computer that, instead of storing a single digital state, stores a probability distribution over digital states. We're limited to the corners of the cube again, but instead of having to pick one we can now assign a probability to each. Of course each probability must be between 0% and 100%, and the probabilities must add up to 100%.

picture

This actually makes the analogy between applying a NOT gate to a bit and mirroring along a direction *stronger*. Now the mirroring is not wasting work flipping corners we weren't using.

picture

And now we can define operations that do interesting things like send 1/3 of the weight of a corner to its partner:

picture

Another way of thinking about this is that each bit corresponds to giving every state a partner, combining them into pairs, and operations apply independently to each pair.

How powerful is a computer capable of storing probability distributions? No more powerful than a computer capable of generating random numbers.

**Quantum Superposition**

A quantum superposition is a lot like a probability distribution, except the probabilities are replaced by complex amplitudes.

Each corner will be assigned two values, phase and magnitude, instead of one. Phases must be between 0° and 360°. Magnitudes must be between 0 and 1. You get the probability of a corner by squaring its magnitude. The probabilities must add up to 100%.

picture

Again we can now define operations that would have made no sense before, like "rotate phase if bit is set":

picture

However, note that quantum computers have an important limitation on what operations we can apply. The operation must be reversible, and must maintain the fact that probabilities will add up to 100%. The most notable thing this prevents you from doing is "set to true":

picture

The closest thing to "set to true" is "swap with this other bit, that I happen to know is already true". (Running out of bits in a known state is basically [heat death](http://en.wikipedia.org/wiki/Heat_death_of_the_universe)). Recall that swapping corresponds to a half rotation:

picture

Although the word rotation is a bit ambiguous now because we can rotate between bits, between the two states a bit can be in, the individual phases of states, and combinations of those three. Literally every operation a quantum computer does can be thought of as a series of rotations in this generalized sense.

The main thing that makes quantum computers different is the squaring step at the end to convert from amplitudes to probabilities. Because the sum of squares is not the same thing as the square of the sums, you need to consider all the paths that weight can flow along throughout a computation. Following just one weight, choosing at random instead of splitting, is no longer enough. The fact that amplitudes can cancel out when you add them together just makes this problem worse.


