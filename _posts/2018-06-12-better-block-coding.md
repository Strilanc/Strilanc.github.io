---
layout: post
title: "Improving Block Code Distillation (Part 1)"
date: 2018-06-12 10:10:10 am PST
permalink: post/1806
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

This series of posts began with the discovery a mistake, and an attempt to fix the problem.
It ends with an insight into and improvement upon the original result.

Part 1: (this post) Resynthesizing the circuits

Part 2: [Reconceptualizing the distillation](/post/1807)

Part 3: [Rebraiding the factory](/post/1900)


# Noticing a mistake

When I read papers describing quantum circuits, I like to test them out in my [drag-and-drop quantum circuit simulator Quirk](/quirk).
Quirk affords fast iterative experimentation.
It allows allows me to push the circuits around, try random ideas to make them smaller, see what makes them break, and maybe even understand what makes them work.

I was experimenting on circuits from the paper ["Surface code implementation of block code state distillation"](https://arxiv.org/abs/1301.7107) when I found a problem: the circuits didn't work as advertised.
The mistake happens right near the beginning of the paper, in figure 1:

<img src="/assets/{{ loc }}/fowler-fig-1.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>

When I [entered this circuit into Quirk][99], I wasn't able to get it to do what it was supposed to do.
At first I figured this was because I simply hadn't found the correct feedback operations (annoyingly, the figure leaves out all of the classical fixup that happen after the measurements).
But gradually it became clear that the problem was in the circuit itself.

The method I used to convince myself that a mistake really is present was to realize that, since this circuit is supposed to detect single errors, inserting a Z gate next to one of the T gates should change the set of possible measurement outcomes.
Otherwise the error would be undetectable.
By just eyeballing the states while dragging a Z gate around (thanks, Quirk!), I was able to find several T gates where inserting a Z error doesn't change the possible measurement results.
Therefore the circuit is wrong.

For example, there is no change in possible results [when adding a Z gate after the third inverse T gate][100]:

[<img src="/assets/{{ loc }}/indistinguishable.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][100]

The fact that this mistake happens in figure 1 of the paper is very unfortunate, because the paper just keeps building and building on this figure.
The one initial mistake poisons *all* of the presented details.
([The k=2 case works, though!][1])
That being said, as we will see by the end of this trilogy of posts, the high-level conclusions of the paper do survive the correction of the mistake.

I happen to work with Austin Fowler, who is the lead author of the paper, so it was very easy to bring the mistake to his attention.
He acknowledged the problem, pointed me at the paper that they had intended to implement (["Magic state distillation with low overhead"](https://arxiv.org/abs/1209.2426) by Bravi et al in 2012), and asked me to look into how hard it would be to fix the issue.


# Rederiving the circuit

I wish I could say that I carefully went through the Bravi et al paper, worked through all the logic, and understood the underlying ideas.
But *actually* what I did was skim through the paper, spot equation 3, and go "Ah! I bet that's it!":

<img src="/assets/{{ loc }}/bravi-eq-3.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>

The above may not look like much, but this pattern of "several columns with different combinations of 1s" is very reminiscent of how some T state distillation works.
Basically, T state distillation circuits often amount to creating several qubits in the $|+\rangle$ state and then applying T gates to various parity combinations of those qubits.
I figured the matrix was saying which parities to phase (e.g. if we associate the rows with qubits $Q\_0$ through $Q\_4$, then the first column is saying we need to apply a T gate to $Q\_0 \oplus Q\_2$).

I threw together [a circuit in Quirk based entirely on this guess][3], did some quick experimenting to figure out the classical decoding, and... it works!

[<img src="/assets/{{ loc }}/initial-14-to-2-abbreviated.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][3]

(Click the image to view the entire circuit in Quirk.)

The above circuit uses 14 T gates and produces two $|T^\dagger\rangle$ states.
And if you insert exactly one Z error next to one of the T gates, the error will be caught by the post-selections.
(I am assuming that the T gates are the only noisy operations, and that they can only produce Z-type errors.
This is consistent with what actually happens when injecting T states in the surface code.)
The circuit is producing the right amount of states with the right amount of error detection; it is correct.

Here is one example of how a Z error will ultimately toggle one of the qubits that are measured when determining whether or not to keep the output:

<img src="/assets/{{ loc }}/initial-14-to-2-abbreviated-with-error.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>

So this fixed-size case works, but we're *supposed* to be creating an extendable construction.
One with some parameter $k$ that determines how many states we make.
Clearly it is necessary to carefully read the rest of the paper.

Anyways, skimming further into the paper, I spotted equations 24 and 25.
They give a recipe for putting together matrices with sizes controlled by a parameter $k$:

<img src="/assets/{{ loc }}/bravi-eqs-24-25.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>

Once again, I threw together a circuit in Quirk based on my guess that the columns of the matrix were indicating which parities to phase.
Getting the decoding right was a bit harder this time; some of the check qubits ended up entangled instead of separable and had to be pulled apart in order to do the post-selection properly.

Anyways, after fixing that, I had a [working k=4 circuit][4]:

[<img src="/assets/{{ loc }}/initial-20-to-4-abbreviated.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][4]

Of course, we don't want just *any* circuit.
We want a *good* circuit.
We've validated that the original construction works, but we still haven't validated that e.g. it can be done in constant depth.
So let's do that.


# Optimizing the circuit

In order to keep things simple, I am going to split the matrix defined by equations 25 and 26 (as well as the corresponding circuits that we're implementing) into two pieces and optimize each separately.
This works well because the columns of the matrix split nicely into a left half (with $L$ and $S\_1$ sub-matrices) and a right half (with $M$ and $S\_2$ sub-matrices).

I'll focus on finite-sized cases, but all of the steps I apply will generalize to arbitrary $k$.
In fact, even though the original paper only defines matrices for even $k$, the construction we end up with will also work for odd $k$!

We'll start with the left half.
Specifically, this is the matrix we'll be implementing:

$$
\begin{bmatrix}
M & 0 \\\\
0 & M \\\\
S\_2 & S\_2
\end{bmatrix} =
\begin{bmatrix}
1 & 1 & 1 &   &   &   &   &   &   &   &   &   \\\\
  &   &   & 1 & 1 & 1 &   &   &   &   &   &   \\\\
  &   &   &   &   &   & 1 & 1 & 1 &   &   &   \\\\
  &   &   &   &   &   &   &   &   & 1 & 1 & 1 \\\\
1 &   & 1 & 1 &   & 1 & 1 &   & 1 & 1 &   & 1 \\\\
  & 1 & 1 &   & 1 & 1 &   & 1 & 1 &   & 1 & 1 \\\\
  &   &   &   &   &   &   &   &   &   &   &   \\\\
\end{bmatrix}$$

Which we can mechanically translate into [this circuit][20]:

[<img src="/assets/{{ loc }}/optimize-M-step-0.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][20]

The circuits I have shown so far always use an ancilla qubit to perform the multi-qubit parity phasing operations.
However, when attempting to optimize a circuit, it is usually desirable to work inline without introducing an ancilla.
Instead of temporarily xoring all of the involved qubits onto a clean qubit and phasing that, we should pick one of of the involved qubits, temporarily xor the other involved qubits into the chosen qubit, and phase the chosen qubit.

Doing the phasing inline is particularly useful in this case because it makes it clear that some phasing operations can be done in parallel.
In particular, the fact that the "M" sub-matrices are laid out along a diagonal suggests that inline phasing will allow them to be done in parallel.

So let's try that out.
For each T gate, we need to choose which qubit to use as the inline target.
In this case, we'll just always pick the topmost involved qubit.
The [resulting circuit looks like this][21]:

[<img src="/assets/{{ loc }}/optimize-M-step-1.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][21]

The next step to simplifying the circuit is to group the phasing operations together based which of the two bottom qubits are involved.
(We can rearrange them because they all commute with each other.)
First we will do all the phasing operations involving just the before-bottom qubit, then all of the phasing operations involving both bottom qubits, then all of the phasing operations involving just the bottom qubit.

[Here's the circuit with the operations grouped][22]:

[<img src="/assets/{{ loc }}/optimize-M-step-2.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][22]

The above circuit is just *begging* us to do T operations at the same time.
We can do this by taking advantage of the fact that the X-controlled-Z operations that are present all commute with each other (though not with the T gates).
In order to move a T gate leftward into the same column as another T gate, we move the X-controlled-Z operation in its way leftward first.

Do this in the obvious way, and rearrange the X-controlled-Z operations so that they have a nice pattern, and you get [this better structured circuit][23]:

[<img src="/assets/{{ loc }}/optimize-M-step-3.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][23]

At this point it's clear that we should switch from X-axis controls and Z-axis targets to Z-axis controls and X-axis targets (i.e. use CNOT operations).
Doing so folds all of the controlled operations into just a few columns, making [a shallow circuit][24]:

[<img src="/assets/{{ loc }}/optimize-M-step-4.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][24]

And now it's obvious that some of these controlled operations are cancelling each other out.
Do the cancellations, and we're left with [a nice short circuit][25]:

[<img src="/assets/{{ loc }}/optimize-M-step-5.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][25]

If we had started with a larger value of $k$, i.e. more $M$ matrix columns, this final circuit would get taller instead of deeper (there would be $k$ copies of the top row).

Now that we've found a nice way to optimize the circuit coming from the part of the matrix involving $M$ and $S\_2$, we turn our attention to optimizing the part involving $S\_1$ and $L$.
This will be a bit trickier to do, but don't worry we'll go through it step by step again.

This time our starting matrix is:

$$\begin{bmatrix}
0 & L \\\\
0 & L \\\\
S\_1 & S\_1
\end{bmatrix} = \begin{bmatrix}
  &   &   &   & 1 & 1 & 1 & 1 \\\\
  &   &   &   & 1 & 1 & 1 & 1 \\\\
  &   &   &   & 1 & 1 & 1 & 1 \\\\
  &   &   &   & 1 & 1 & 1 & 1 \\\\
  & 1 &   & 1 &   & 1 &   & 1 \\\\
  &   & 1 & 1 &   &   & 1 & 1 \\\\
1 & 1 & 1 & 1 & 1 & 1 & 1 & 1 \\\\
\end{bmatrix}
$$

from which, keeping in mind that this part of the matrix will be at the start of our circuit, we mechanically [derive a starting point][30]:

[<img src="/assets/{{ loc }}/optimize-L-step-0.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][30]

The first thing we're going to do is try to simplify the top-right section of the circuit, because it keeps reusing the same combination of qubits again and again.
Instead of depending on every one of those qubits for every phasing operation, we can xor them all into a single target qubit and then only include that one.
[This is the resulting circuit][31]:

[<img src="/assets/{{ loc }}/optimize-L-step-1.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][31]

Now look carefully at the left operation we introduced in the previous step.
It has an X-axis control being applied to a qubit that started as $|0\rangle$ and was then transitioned to the $|+\rangle$ state by a Hadamard operation.
Applying an X-axis control to the $|+\rangle$ state is akin to applying a Z-axis control to the $|0\rangle$ state: the control is not satisfied, and all linked operations do not happen.

Therefore we can [simply drop the operation][32]:

[<img src="/assets/{{ loc }}/optimize-L-step-2.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][32]

And, suddenly, we see that the top three Hadamards can be moved all the way to the right side of the circuit.
The [resulting circuit][33] has an initial part that is independent of $k$ (!), and then a single controlled operation that depends on $k$:

[<img src="/assets/{{ loc }}/optimize-L-step-3.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][33]

Now comes the time to switch to inline phasing.
This time it's a bit harder to pick which qubits to use as the targets.
And actually, because we're going to end up doing four operations at a time, one of the operations needs to continue to use an ancilla!
But, with a bit of foresight, we inline the phases in the way that produces [this circuit][34]:

[<img src="/assets/{{ loc }}/optimize-L-step-4.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][34]

This time it's not so obvious how to move the X-controlled-Z operations out of the way, so that the T gates can be combined into columns.
We start by [combining the T gates that are easy to get together][35]:

[<img src="/assets/{{ loc }}/optimize-L-step-5.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][35]

Now we do two key moves.
First, we propagate the second X-controlled-Z (the one going from qubit #4 to qubit #7) rightward.
This cancels out several Zs, allows a trapped T gate to be combined with the others, and makes the left part of the circuit [look more like the middle part][36]:

[<img src="/assets/{{ loc }}/optimize-L-step-6.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][36]

The second key move is to realize that, although the triple-Z observables do not commute with the operation to their left, they do commute with the *pair* of operations to their left.
This allows the final T gates to be [moved into place][37]:

[<img src="/assets/{{ loc }}/optimize-L-step-7.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][37]

Now that the T gates are in columns, our goal is to simplify the surrounding controlled operations.
If you play around with the middle section for awhile, you will find that the operations on the left can be cancelled against the operations on the right at the cost of creating extra operations targeting the fourth qubit.
Basically, keep playing until you end up with [this circuit][38]:

[<img src="/assets/{{ loc }}/optimize-L-step-8.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][38]

Of course, the middle is now much better [represented with a single multi-target CNOT][39]:

[<img src="/assets/{{ loc }}/optimize-L-step-9.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][39]

Next!
Okay, see the first two controlled operations?
They have controls that aren't satisfied.
They can be dropped, producing [a shorter circuit][40].

[<img src="/assets/{{ loc }}/optimize-L-step-10.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][40]

At this point it is clear that the bottom part of the circuit is preparing some kind of special state, which is then being expanded at the end of the circuit.
What is this special state?

By [adding a couple displays into the circuit][41], it becomes clear what's going on:

[<img src="/assets/{{ loc }}/optimize-L-step-11.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][41]

1. The bottom qubit ends up Off, which makes sense since we were only using it as a temporary ancilla.

2. The second-to-bottom qubit is ending up in the $|+\rangle$ state.
That indicates that it's supposed to be a check qubit.

3. The next three qubits are being prepared into a superposition with equal magnitude on each of the eight possible computational basis state.
However, the phases are not all the same: the $|000\rangle$ state has opposite phase to the rest. They nearly form a $|CCZ\rangle$ state (a state used to apply Toffoli gates in an error-detecting fashion), but normally the negative sign would be on the $|111\rangle$ state, not the $|000\rangle$ state.
I call this slightly different state a $|\overline{CCZ}\rangle$ state (the overbar indicates that it's an "inverse" CCZ).

In the next post, I'll talk more about the significance of this $|\overline{CCZ}\rangle$ state and how recognizing it allowed me to understand in a simple way what the block code is actually doing.
For now, let's move on with optimizing the circuit.

Our next optimization is an easy one, once you spot it.
The last operation on the second-to-bottom qubit, the one that ends up in a $|+\rangle$ state, is a controlled operation that does nothing when said qubit is in the $|+\rangle$ state.
So... [drop that operation][42]:

[<img src="/assets/{{ loc }}/optimize-L-step-12.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][42]

For reasons that will become obvious in the next step, we now turn the two lonely X-controlled-Zs into a multi-target CNOT, and [propagate it leftward a bit][43]:

[<img src="/assets/{{ loc }}/optimize-L-step-13.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][43]

Now, notice that currently the bottom qubit is not used for anything at the end of the circuit.
It is simply being uncomputed and then discarded.
Therefore, instead of uncomputing it, we can get rid of it with erasure.
That is to say, instead of discarding it we do a measurement that aligns with the final operations on it and then use the deferred measurement principle to propagate the measurement over that final operation.
This is particularly beneficial because the classically-controlled operations we end up with in [the resulting circuit][44] are all Pauli operations, which can be propagated around the circuit very easily:

[<img src="/assets/{{ loc }}/optimize-L-step-14.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][44]

The last thing we need to do is something we probably should have done from the start: measure that the qubit that's supposed to end up in the $|+\rangle$ state does in fact end up in the $|+\rangle$ state.
This gives us our [optimized left-half circuit][45]:

[<img src="/assets/{{ loc }}/optimize-L-step-15.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][45]

Now all we need to do is put this $L$ and $S\_1$ piece together with the $M$ and $S\_2$ piece.


# Putting the pieces together

We have our separately optimized both halves of the circuit.
We can combine them into a [single circuit][60]:

[<img src="/assets/{{ loc }}/optimize-C-step-0.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][60]

Currently, increasing the parameter $k$ would extend the circuit upward.
I'd rather the circuit grow downward, so let's [flip everything vertically][61]:

[<img src="/assets/{{ loc }}/optimize-C-step-1.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][61]

Now we need to figure out the error decoding.
See how the top two used qubits on the right side are ending up in the state $|00\rangle - |01\rangle - |10\rangle - |11\rangle$?
We don't want that.
We want a separable state.

One way we could fix this is to apply a CZ to the two qubits, separating them into $|-\rangle$ states.
But solving the problem in that way will lead us down a bad path.
(Trust me, I tried.)
Instead of doing that, all we need to do is insert a NOT gate... at the right place.

I should point out that I certainly wouldn't *expect* inserting a NOT gate to do anything useful here.
The only reason I know it works is because Quirk makes it quick and easy to tweak the circuit and see how the output changes.
As a result, I'm always deleting gates, adding gates, and dragging gates around just to see if they have some useful effect.
It sounds completely dumb, but it pays off *all the time* and right here right now we have a particularly good example of that.
In fact, the most serendipitous consequence of this change will only appear after several more steps.

For now, let's separate the outputs by [inserting the magic NOT gate][62]:

[<img src="/assets/{{ loc }}/optimize-C-step-2.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][62]

Now that the outputs are separated, we can [post-select on them to detect errors][63]:

[<img src="/assets/{{ loc }}/optimize-C-step-3.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][63]

And we might as well [do all the measurements and post-selection in the same place][64]:

[<img src="/assets/{{ loc }}/optimize-C-step-4.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][64]

Which brings us back to that NOT gate.
It turns out that, when you extend the circuit down by two steps, increasing $k$ from 4 to 6, you have to remove the NOT gate.
Otherwise the output ends up in that state we didn't want, again.

In order to extend to $k=6$, [delete the NOT gate][65]:

[<img src="/assets/{{ loc }}/optimize-C-step-5.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][65]

If we increase $k$ by two more, to 8, then the NOT gate is needed again.
And the pattern continues like that, where you need the NOT gate for multiples of 4 but not for numbers equal to 2 mod 4.

Now, if you remember where these circuits came from, you might also remember that they were only defined for even values of $k$.
So there's no reason to expect them to generalize to odd values of $k$.
But we have a *very* suggestive pattern here: if you go two steps, you rotate around X by an additional 180 degrees.
So, that might... [that might just mean...][66]:

[<img src="/assets/{{ loc }}/optimize-C-step-6.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][66]

...you can make the circuit work in the odd cases by using 90 degree rotations!

Without the ability to experiment quickly in Quirk, I would never have found the location where that X gate goes.
That was a key element in finding this generalization.
I think this is a strong indicator that we need more tools like Quirk with a heavy focus on fast feedback and exploration... but I digress.

Before we finish, let's make just one more exploration-based improvement.
By experimentally deleting gates, I found that [one of the columns of CNOTs was redundant][67]:

[<img src="/assets/{{ loc }}/optimize-C-step-7.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>][67]

Leaving us, finally, with the final construction (at least for part 1):

<img src="/assets/{{ loc }}/final-circuit.png" style="max-width: 100%; border: 1px solid black; padding: 20px;"/>

This is a very nice construction, I think.
Not only does it generalize the original construction so that it works for odd values, it also clearly demonstrates that it's possible to implement the circuit in constant depth (independent of $k$).

Note that I did confirm that the error detection actually works.
If you insert exactly one Z error into the circuit, anywhere next to a T gate, the post-selection will detect the error and discard the state.
Errors on the left side trigger the top-most post-selection, while errors on the right side trigger the other post-selections.
This is pretty easy to confirm for yourself by tracing out how each Z propagates through the circuit and into the error-detecting measurements.


# To be continued

Recall from the intro that this whole thing started because I discovered a mistake in a paper.
The circuit construction I showed in this post fixes that initial mistake, but that doesn't mean we're done.
The mistake poisoned the rest of the figures in the paper; we also need to fix those.
For example, we need to translate the circuit diagram into surface code braiding diagrams.

But that's only going to happen in part 3.
We're going to take a slight detour first.
In part 2, I'll explain what this block code is *actually* doing and use that knowledge to reduce the T count of the circuit.

[Discuss on Reddit](https://www.reddit.com/r/algassert/comments/8qowu4/comment_thread_improving_block_code_distillation/)

[99]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22~8luc%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22~l6e7%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Bloch%22%2C%22Bloch%22%2C%22Bloch%22%2C%22Bloch%22%5D%5D%2C%22gates%22%3A%5B%7B%22id%22%3A%22~l6e7%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~ppii%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~8luc%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22%E2%80%A2%22%2C1%2C%22X%22%5D%5D%7D%7D%5D%7D
[100]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22~8luc%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22~l6e7%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%5Et%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B%22Amps9%22%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Bloch%22%2C%22Bloch%22%2C%22Bloch%22%2C%22Bloch%22%5D%5D%2C%22gates%22%3A%5B%7B%22id%22%3A%22~l6e7%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~ppii%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~8luc%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22%E2%80%A2%22%2C1%2C%22X%22%5D%5D%7D%7D%5D%7D
[1]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~8udq%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~8udq%22%5D%2C%5B1%2C1%2C1%2C%22~kkga%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~kkga%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B1%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22X%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22X%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Chance%22%2C%22Chance%22%2C%22Chance%22%2C%22Chance4%22%5D%2C%5B%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C1%2C1%2C1%2C1%2C%22Bloch%22%2C%22Bloch%22%5D%5D%2C%22gates%22%3A%5B%7B%22id%22%3A%22~l6e7%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~kkga%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22%E2%80%A2%22%2C1%2C%22X%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~8udq%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C1%2C%22%E2%80%A2%22%5D%5D%7D%7D%5D%7D
[2]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%5D%2C%5B%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%2C1%2C%22~ppii%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~8luc%22%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22~l6e7%22%2C1%2C%22~l6e7%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22~8luc%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22~l6e7%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%2C%22Z%5E-%C2%BC%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Bloch%22%2C%22Bloch%22%2C%22Bloch%22%2C%22Bloch%22%5D%5D%2C%22gates%22%3A%5B%7B%22id%22%3A%22~l6e7%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~ppii%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22X%22%2C1%2C1%2C1%2C%22%E2%80%A2%22%5D%5D%7D%7D%2C%7B%22id%22%3A%22~8luc%22%2C%22circuit%22%3A%7B%22cols%22%3A%5B%5B%22%E2%80%A2%22%2C1%2C%22X%22%5D%5D%7D%7D%5D%7D
[3]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Amps1%22%2C%22Amps1%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%5D%7D
[4]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22H%22%5D%2C%5B%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%5D%7D
[20]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[21]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%5D%5D%7D
[22]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%5D%7D
[23]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C%22%E2%8A%96%22%2C1%2C1%2C%22Z%22%5D%2C%5B1%2C%22%E2%8A%96%22%2C1%2C1%2C1%2C%22Z%22%5D%2C%5B%22%E2%8A%96%22%2C1%2C1%2C1%2C1%2C%22Z%22%5D%5D%7D
[24]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A6%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A6%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%5D%7D
[25]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%5D%7D
[30]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[31]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[32]: /quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[33]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[34]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[35]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[36]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[37]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[38]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[39]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[40]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[41]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Z%22%2C1%2C1%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Amps3%22%2C1%2C1%2C%22Amps1%22%2C%22Amps1%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[42]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C1%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22Amps3%22%2C1%2C1%2C%22Amps1%22%2C%22Amps1%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[43]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C%22Amps3%22%2C1%2C1%2C%22Amps1%22%2C%22Amps1%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[44]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C1%2C%22Measure%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C%22Amps3%22%2C1%2C1%2C%22Amps1%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[45]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Measure%22%2C%22Measure%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C%22Amps3%22%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%5D%7D
[60]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22Measure%22%2C%22Measure%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%22%2C%22Z%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B1%2C1%2C1%2C%22Amps3%22%2C1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Z%22%2C%22Z%22%2C%22Z%22%2C%22%E2%8A%96%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C1%2C%22%E2%80%A6%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C1%2C%22%E2%80%A2%22%5D%2C%5B%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps2%22%5D%5D%7D
[61]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps3%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C%22Amps2%22%2C1%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D
[62]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps3%22%5D%2C%5B%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C%22Amps2%22%2C1%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D
[63]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps3%22%5D%2C%5B%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C%22Measure%22%2C%22Measure%22%5D%2C%5B1%2C1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D
[64]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D
[65]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%80%A6%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D
[66]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%5E-%C2%BD%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D
[67]: /quirk#circuit=%7B%22cols%22%3A%5B%5B1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22%E2%80%A2%22%5D%2C%5B%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22X%5E-%C2%BD%22%5D%2C%5B1%2C1%2C1%2C1%2C1%2C%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B1%2C1%2C1%2C1%2C%22%E2%8A%96%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%2C%22Z%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C1%2C%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C1%2C1%2C1%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%2C%22Z%5E%C2%BC%22%5D%2C%5B1%2C1%2C%22%E2%80%A2%22%2C1%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B%22H%22%2C%22H%22%2C%22H%22%2C%22H%22%5D%2C%5B%22Measure%22%2C%22Measure%22%2C%22Measure%22%2C%22Measure%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%2C%22X%22%2C%22X%22%5D%2C%5B1%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22%7C0%E2%9F%A9%E2%9F%A80%7C%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%2C%22Amps1%22%5D%5D%7D