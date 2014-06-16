---
layout: post
title: "Counterfactual Strategies"
date: 2014-06-15 11:30:00 EST
categories: math
---

In this post, I talk about a game theory phenomenon similar to bluffing: purposefully doing badly in order to deny your opponent information when you play again.

**A game**

Let's play a game I call "stormy fate". In the game, an attacker asks fate if the seas will be safe. Then the attacker chooses how to attack, by land or by sea, based on the answer. There is also a defender, who can choose to stand their ground or run away based on how the attacker is approaching.

The game is decided by who ends up with the most points. The attacker starts the game by paying 11 points for daring to interrogate the fates. Questioning the fates further, by sailing seas fated to be stormy, costs an even heftier 30 points. The rest of the points are determined by whether the defender choose to stand their ground or run. If they run then the attacker gains 20 points. If they defend, then the outcome depends on how the attacker approached. The defender can hold off any attack by land, with no points changing hand. But the attacker has a stronger navy, easily winning 30 points when attacking on calm seas and even eking out a 10 point win when the seas are stormy.

Note that the defender doesn't know whether the seas were stormy when choosing whether or not to defend. If this was a [complete information](http://en.wikipedia.org/wiki/Complete_information) game, the solution would be trivial. (This seems a bit odd, given the narrative of the game, but it's the best narrative I came up with.)

Here's the game tree, for reference:

![Stormy fate game tree](http://i.imgur.com/EgKr0Dh.png)

The puzzle is: does the attacker have a resilient strategy, where the expected point gain is positive regardless of what strategy the defender uses?

**Analysis**

Analyzing the game is a lot easier if we modify it to award all points at the end, so let's do that. The cases break down as follows:

<table style="width:300px; border:1px solid black;">
  <tr style="border:1px solid black;">
    <td style="width:60px;"><strong>Fate</strong></td>
    <td style="width:60px;"><strong>Attacker</strong></td>
    <td style="width:60px;"><strong>Defender</strong></td>
    <td style="width:60px;"><strong>Outcome</strong></td>
  </tr>
  <tr><td>storm</td> <td>land</td>       <td>run</td>      <td>+9</td></tr>
  <tr><td>storm</td> <td>land</td>       <td>fight</td>    <td>-11</td></tr>
  <tr><td>storm</td> <td>sea</td>        <td>run</td>      <td>-1</td></tr>
  <tr><td>storm</td> <td>sea</td>        <td>fight</td>    <td>-31</td></tr>
  <tr><td>calm</td>  <td>land</td>       <td>run</td>      <td>+9</td></tr>
  <tr><td>calm</td>  <td>land</td>       <td>fight</td>    <td>-11</td></tr>
  <tr><td>calm</td>  <td>sea</td>        <td>run</td>      <td>+9</td></tr>
  <tr><td>calm</td>  <td>sea</td>        <td>fight</td>    <td>+19</td></tr>
</table>

A *strategy* determines what decision to make in each case, or rather the *probability* of making each decision. The attacker and defender each have two decisions. The attacker decides how to attack when the seas are stormy, and how to attack when the seas are calm. The defender decides whether to fight or flee when the attack comes by land, and whether to fight or flee when the attack comes by sea. (Recall that the defender doesn't know whether the seas were stormy. They may be able to infer that based on where the attack is coming from, but otherwise their strategy is forced to be independent of sea storminess.)

The expected outcome of the game is determined by the combination of the two strategies. We just scale each outcome by the probabilities that lead to it, and sum up. So:

- Let $p$ be the probability of the attacker attacking by land when it's stormy.
- Let $q$ be the probability of the attacker attacking by land when it's calm.
- Let $a$ be the probability of the defender running when attacked by land.
- Let $b$ be the probability of the defender running when attacked by sea.
- Define $\overline{x}$ to be $1-x$, the complement of $x$.
- Then $E = \frac{1}{2} \left(+9 p a - 11 p \overline{a} - \overline{p} b - 31 \overline{p} \overline{b} +9 q a - 11 q \overline{a} + 9 \overline{q} b + 19 \overline{q} \overline{b} \right)$

The defender's goal is to minimize the points gained by the attacker. Also, because the goal of the puzzle is to gain points against all defender strategies, we can assume the defender has access to the attacker's $p$ and $q$ when choosing $a$ and $b$. (Imagine that the attacker is a casino machine, and the defender is going to reverse engineer it looking for any exploits. We want the optimal attacker strategy in that situation.)

To decide what $a$ should be, the defender inspects the derivative of $E$ with respect to $a$:

$\frac{dE}{da} = \frac{1}{2} \left(+9 p + 11 p +9 q + 11 q \right) = 10 p + 10 q$

When the derivative is positive, the attacker will gain points whenever $a$ is increased. So in that case the defender wants $a$ as low as possible, and should set it to 0. Conversely, when the derivative is negative, the defender should set $d$ to 1. The value of $d$ goes discontinuously from $0$ to $1$ when the sign of the derivative changes. We can represent that as $H(-p - q)$, where $H$ is the [heaviside step function](http://en.wikipedia.org/wiki/Heaviside_step_function).

We repeat the same procedure for $b$. Compute the derivative:

$\frac{dE}{db} = \frac{1}{2} \left( -\overline{p} + 31 \overline{p} + 9 \overline{q} - 19 \overline{q} \right) = 10 - 15p + 5q$

Again we flip the sign, remove the common factors, and use the heaviside step function function. We find that $b = H(3p - q - 2)$.

Now let's rearrange the expected value formula so we can plug in our formulas for $a$ and $b$. Start by expanding $\overline{a}$ and $\overline{b}$, and gathering terms:

$E = \frac{1}{2} \left(a \left( +9 p  + 11 p + 11 q + 9 q \right) + b \left( -\overline{p} + 31 \overline{p} + 9 \overline{q} - 19 \overline{q} \right) - 31 \overline{p} - 11 p - 11 q  + 19 \overline{q} \right)$

Simplify the terms:

$E = \frac{1}{2} \left(a \left( 20 p + 20 q \right) + b \left( 20 - 30 p + 10 q \right) - 12 + 20 p - 30 q \right)$

Insert the formulas, and extract factors so the heaviside functions get multiplied by their own argument:

$E = \frac{1}{2} \left(-10 H(-p - q) \left( - p - q \right) - 10 H(3p - q - 2) \left( 3p - q - 2 \right) - 12 + 20 p - 30 q \right)$

Now use the fact that $H(x) x = x \uparrow 0$, where $a \uparrow b = max(a, b)$.

$E = \frac{1}{2} \left(-10 ((-p - q) \uparrow 0) - 10 ((3p - q - 2) \uparrow 0) - 12 + 20 p - 30 q \right)$

Finally, get rid of that darn factor of a half:

$E = 10p - 15q - 6 - 5 ((-p - q) \uparrow 0) - 5 ((3p - q - 2) \uparrow 0)$

Great! Now we have a compact formula that only involves $p$ and $q$. The least-exploitable attacker strategy is the maximum value that $E$ can take, restricting $p$ and $q$ to be between 0 and 1. We don't even have to do an exhaustive search: all the cases are linear, so we just need to check critical points.

There's a critical point wherever two critical lines intersect. In this case our critical lines include not just the four lines bordering the unit square, but also the lines $p=q$ and $3p = q + 2$ because they define the border where the the maximum operators switch which argument wins.

Ultimately, the critical points are $(0,0)$, $(0,1)$, $(1,0)$, $(1,1)$, and $\left(\frac{2}{3}, 0 \right)$. The maximum is at $\left(\frac{2}{3}, 0 \right)$, where $E$ is $\frac{2}{3}$. Given $p=\frac{2}{3}$ and $q=0$, we can also determine that $a = H(-\frac{2}{3} - 0) = 0$ and that $b = H(3 \frac{2}{3} - 0 - 2) = H(0)$.

Translated back in terms of the word problem, these numbers means that the attacker will always attack by sea when the seas are calm, but only $\frac{1}{3}$ of the time when it's stormy. The defender will always fight land attacks, but may fight or run from sea attacks because the expected outcome is the same in both cases.

A slightly easier way to find the maximum is to just [plug the problem into wolfram alpha](http://www.wolframalpha.com/input/?i=maximum+of+10p+-+15q+-+6+-+5+Max[-p+-+q%2C+0]+-+5+Max[3p+-+q+-+2%2C+0]%2C+0+%3C%3D+p+%3C%3D+1%2C+0+%3C%3D+q+%3C%3D+1):

![Solution and plots of minimum point from Wolfram-Alpha](http://i.imgur.com/6nOlZBS.png)

(Note: I rearranged and removed content from that screenshot to make it fit better.)

The small triangular green area in the contour plot is the space of strategies with positive returns. *Bonus puzzle: adjust the payoffs so that the positive returns area doesn't touch the sides.*

**Sub-games**

Based on the above analysis together, the attacker can expect to gain two thirds of a point per game by attacking by sea one third of the time when its stormy, and always attacking by sea when it's calm.

But imagine we were solving the overall game by recursively solving subtrees and combining the result, like [expectiminimax](http://en.wikipedia.org/wiki/Expectiminimax_tree). What would the algorithm do when looking at the stormy sub-tree?

Well, the game definitely gets a lot simpler. We can throw away all the calm sea outcomes, and fate is no longer involved. We can even arrange the game into a simple 2x2 matrix, with simpler payoffs because we only care about the marginal changes and the -11 penalty is in the past:

<table style="width:300px; border:1px solid black;">
  <tr style="border:1px solid black;">
    <td style="width:60px;"><em>storm</em></td>
    <td style="width:60px;"><strong>land</strong></td> <td style="width:60px;"><strong>sea</strong></td>
  </tr>
  <tr><td><strong>run</strong></td>   <td>+20</td>     <td>+10</td></tr>
  <tr><td><strong>fight</strong></td> <td>0</td>       <td>-20</td></tr>
</table>

Clearly the optimal attack strategy in the above sub-game is to always attack by land. The land column dominates the sea column. The fight row dominates the run row, too, so we know the defender is always going to fight. So the outcome will always be no change in points.

Except the optimal attack strategy, taking into account for the entire game, *isn't* to always attack by land in this case. We *can't* consider the game trees one by one, because they affect each other. If we were to always attack by land in the stormy case, then an attack by sea is a dead giveaway that the seas were calm and the defender will respond more effectively. Even against a defender that *always* fights us, where switching from land to sea costs us 20 points, we have to do it $\frac{1}{3}$ of the time lest we leave an exploitable opening in the other case.

By purposefully doing not-quite-optimal in the stormy case, we are reducing the amount of information they have in the calm seas case and *creating bluffing opportunities*.

This is the property that makes incomplete information games so hard to solve. You can't consider sub-games by themselves, because what you *don't* do informs your opponent in *other* cases. In general there's no way around this. Unless the specific game you're working on has nice properties you can exploit, enjoy spending [**doubly-exponential** time to solve it](http://ac.els-cdn.com/0022000084900345/1-s2.0-0022000084900345-main.pdf?_tid=2992af6a-f509-11e3-9590-00000aab0f01&acdnat=1402890725_2a4ade6b4a5f0208cc899353173482fd). That's right, every time you add a few more states to a game you *square* the worst case number of operations needed to solve it.

**Summary**

Don't expect poker to be solved anytime soon. Played better than humans? Sure. Played optimally? Err...

[Discuss on Reddit](http://www.reddit.com/r/programming/comments/27jbii/eating_lions_wolves_and_goats_faster/)
