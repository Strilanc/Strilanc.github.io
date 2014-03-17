---
layout: post
title: "Puzzle: Encoding the Remaining Card"
date: 2014-03-16 21:30:00
categories: puzzle
---

In this post: the solution to the puzzle I mentioned at the end of [Ordering Cyclic Sequence Numbers](http://strilanc.com/math/2014/03/11/Ordering-Cyclic-Sequence-Numbers.html).

**Puzzle**

You, me, and your friend are in a room with a standard deck of 52 cards. I propose a game. I tell you that I will shuffle the deck, then deal you five cards. You get to look at them, then pick four to lay down in whatever order you want. Then your friend has to predict what the last card is.

I give you prep-time to discuss strategy with your friend. The only communication you are allowed during the game is in the choosing of which card to not lay down, and the order of the cards you do lay down.

Is it possible to win with certainty? How, or why not? What is the largest deck of cards where it's possible to win with certainty?

This puzzle is better known as the Fitch Cheney Card Trick. It's been explained before, but I'll explain it here anyways. I'll also implement the solutions.

**Solution for 52 Cards**

A common intuition, when first hearing this puzzle, is that it won't work unless the deck is limited to $4+4! = 28$ cards. It seems that, since there's only $4!$ orderings of the $4$ revealed cards, you can only distinguish between $4!$ unrevealed cards. This intuition is wrong, because it misses the power of being able to choose which card to not reveal.

Because you're dealt five cards, and there are only four suits, there must be (at least) two cards that have the same suit in your hand. Additionally, one of those two cards must be *ahead of* the other in the cycle of cards in that suit. Recall that, by *ahead of*, I mean "closer when travelling forward". The two of hearts is *ahead of* the king of hearts, and the nine of hearts, but not the eight of hearts.

The hidden card should be of the same suit, and *ahead of*, the first card you reveal. From the predicting player's perspective, only six cards will satisfy that property. We have three cards left to lay down and, since $3! = 6$, we use their ordering to encode which of those six cards to choose.

The following table implements this type of solution. Enter a hand of five cards, and it will indicate the four cards to reveal in order. Each card, separated by a comma, is specified as a face value followed by a suit (either the unicode characters, or H/S/C/D).

Note that scripts need to be enabled for the table to work:

<table border="1" cellspacing="0" cellpadding="8"><tr>
    <td>
        <label>Dealt to Player:</label><br />
        <input type="text" id="txtDealtCards" />
    </td>
    <td>
        <label>Reveal</label><br />
        <label id="lblRevealedCards" />
    </td>
</tr></table>

To go in the reverse direction, enter an ordered hand of four cards into the table below. It will determine what the hidden card is. You can check its answers against the previous table's results:

<table border="1" cellspacing="0" cellpadding="8"><tr>
    <td>
        <label>Revealed by Player:</label><br />
        <input type="text" id="txtRevealedCards" />
    </td>
    <td>
        <label>Predict</label><br />
        <center><label id="lblHiddenCard" /></center>
    </td>
</tr></table>

The above solution is clever, and easy to do by hand, but only works for $52$ card decks. We can do better.

How much better? Well, there's a clear upper bound on the deck size based on the number of possible ways you can reveal cards, and the number of revealed cards. There are $5!$ ways to reveal four of your five cards, and the predicting player knows the hidden card is not any of the four revealed cards. This places an upper bound of $5! + 4 = 124$ cards in the deck.

How close to that upper bound can we get? *All the way.*

**Solution for 124 Cards**

The following solution is from [a post by 'ThirdParty' in the xkcd forum thread on this puzzle](http://forums.xkcd.com/viewtopic.php?f=3&t=89705#p3136791):

1. Arrange the $124$ cards into a cycle.
2. Eliminate positions based on the revealed cards. When you reveal a card, eliminate it and the $24$ positions ahead of it in the cycle.
3. Propagate elimination instead of stacking it. When a position would be eliminated twice, eliminate the next position instead.
4. There is exactly one choice of card to not reveal, out of the five dealt cards, such that revealing the other four won't eliminate the chosen card. Use it.
5. Given four revealed cards, there will be $24$ positions remaining after elimination (and it doesn't matter what order you do it in). You can encode the hidden card's position, amongst those $24 = 4!$, into the ordering of the revealed cards.

The table below implements this solution. Enter a hand of five cards, where a "card" is a number between 1 and 124 inclusive, and it will determine four cards to reveal:

<table border="1" cellspacing="0" cellpadding="8"><tr>
    <td>
        <label>Dealt to Player:</label><br />
        <input type="text" id="txtDealtCards124" />
    </td>
    <td>
        <label>Reveal</label><br />
        <center><label id="lblRevealedCards124" /></center>
    </td>
</tr></table>

To determine what the hidden card is, from the four revealed cards, enter those cards into the table below. Cross-check against the table above:

<table border="1" cellspacing="0" cellpadding="8"><tr>
    <td>
        <label>Revealed by Player:</label><br />
        <input type="text" id="txtRevealedCards124" />
    </td>
    <td>
        <label>Predict</label><br />
        <center><label id="lblHiddenCard124" /></center>
    </td>
</tr></table>

To make it a bit clearer how the card to hide is being chosen, the following animated diagram cycles through how elimination plays out for each choice of hidden card. It works by adding 25 units of 'fuel' at each revealed card, and spending 1 unit of fuel (to eliminate a card) whenever possible while advancing around the cycle.

The cards dealt to the player, taken from what is entered in the table above, are outlined. The revealed cards are highlighted blue. When the hidden card is eliminated, the bars showing the amount of remaining fuel at each position are shown in red. Otherwise it is the correct card to hide and the fuel bars are shown in blue:

<canvas id="drawCanvas124" width="420" height="420"></canvas>

<script src="/assets/FitchCheneyCardTrick.js"></script>

**Summary**

The size of the decks you can solve, when encoding one card out of five using the other four and their order, is surprisingly large.
