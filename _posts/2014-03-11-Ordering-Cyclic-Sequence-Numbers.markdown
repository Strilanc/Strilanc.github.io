---
layout: post
title: "Ordering Cyclic Sequence Numbers"
date: 2014-03-11 21:30:00
categories: math
---

In this post: computing ordering and signed distance when numbers loop around.

**Sequence Numbers**

In the [Real-time Transfer Protocol (RTP)](http://en.wikipedia.org/wiki/Real-time_Transport_Protocol), every packet is assigned a *sequence number*. The sender increases the sequence number by one for each packet it sends, and the receiver uses the sequence number to consume potentially re-ordered packets in the right order.

RTP's sequence numbers, like clocks and angles and odometers, do not just keep increasing without bound. They are 16 bit integers. After sending 65536 packets, the sender will have looped around the whole range and must start re-using previously sent sequence numbers.

The looping around complicates how the receiver determines if a packet should be *before* or *after* another. You can't just assume the larger sequence number comes after, because your voip app would get stuck on sequence number 65535 and the call would fail. This is a tricky bug, because it takes tens of minutes to happen (i.e. you must specifically test for it, preferably [without talking on a phone for an hour](http://twistedoakstudios.com/blog/Post3516_rule-of-thumb-ask-for-the-clock)).

Another sequence number complication comes from [ZRTP](http://en.wikipedia.org/wiki/ZRTP), which secures the contents of RTP packets. ZRTP uses a block cipher in [counter mode](http://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_.28CTR.29), with the sequence number as the counter value. The problem is that repeating counter values is a security bug, like [re-using a one-time pad](http://en.wikipedia.org/wiki/Venona_project#Breakthrough): attackers could learn the difference between the encoding of what you said 10 minutes ago and what you're saying now. You'd go from AES levels of security to talking-over-yourself levels of security. ZRTP solves this problem by internally *expanding* sequence numbers from 16 bits to 64 bits, increasing the cycle time from tens of minutes to billions of years.

The rest of this post explains, and provides code for, the ordering and expanding of loopy sequence numbers.

Note that the solutions will look trivial, and *are* trivial, but they're also *tricky*. When writing code to solve them, it's easy to end up in a terrible cycle of introducing corner cases by trying to handle other corner cases. I've been in that place before, and I know others have too because it's one of the bugs I [caught](https://github.com/WhisperSystems/RedPhone/commit/56d2aedcf79a3214a96b017ac5e19f72712d7ffa) in RedPhone.

**Closer Ahead**

The ordering we want for our sequence numbers is "closer when going forward". We will say `y` is *ahead of* `x` when, starting from `x` and heading to `y`, it would take less time to travel forward (in the positive direction) than backward. For example, on a clock we would say 2 o'clock is *ahead of* 11 o'clock because 2 o'clock is 9 hours counter-clockwise from 11 o'clock but only 3 hours clockwise from 11 o'clock.

In the case of signed 16 bit sequence numbers, computing this ordering is trivial. You just subtract `y` from `x`, assuming your language handles signed overflow with wraparound. If the result is positive, then `y` is *ahead of* `x`. If the result is negative, then `y` is *behind* `x` (i.e. `x` is *ahead of* `y`). A zero result means `x = y`.

You might be worrying that the "ordering" we're computing here is not transitive. That does make calling it an "ordering" a bit of a misnomer... but in practice we really do use it like a proper ordering. For example, we can make a priority queue that uses it:

``` csharp
// note: relying on signed overflow wrapping
new PriorityQueue<Packet>(comparator: (a, b) => (short)(b.seq - a.seq));
```

This priority queue will work great, *as long as you don't put an intransitive set of values in it*. In the case of RTP sequence numbers this is not a problem, because of the way packets slowly count forward and are quickly consumed. Packets arriving now are consumed way, *way* before you get to where they would cause trouble (on the other side of the sequence number cycle).

A side-benefit of using subtraction to determine our ordering is that it gives us a *distance*. It tells us how *far* ahead, or behind, a sequence number is (relative to the current sequence number). We can use that to play it safe, detecting when sequence numbers "skip":

``` csharp
// priority queue with fail-fast check for big skips
new PriorityQueue<Packet>((a, b) => {
    short d = b.seq - a.seq;
    // fail if sequence number is more than a quarter-turn away, because something is wrong
    // (caller should not be detecting such suspicious packets before forwarding to us)
    assert(Math.abs(d) < (1<<14));
    return d;
});
```

Slightly perverting a priority queue in this way, to use our ordering that is not quite an ordering, is really useful. It automatically solves the problems of buffering and ordering RTP packets to be consumed.

**Expanding**

Knowing that subtraction with signed overflow gives us a distance makes the expanding-to-64-bits problem a lot simpler. Just keep adding in the (signed) distances:

``` java
// expanding from 16 to 64 bits
long _expandedSeq;
long expandRollingSequenceId(short seq) {
    _expandedSeq += (short)(seq - _expandedSeq);
    return _expandedSeq;
}
```

Seen above: beautifully simple code. (Gets uglier in C, where you have to manually wrap the signed overflow.)

Again we're relying on the fact that sequence numbers increase slowly, instead of jumping all over the available range. In ZRTP this is the case, since packets aren't delayed by tens of minutes so the above code can be used to keep the receiver's expanded sequence number in sync with the sender's expanded sequence number. Even when packets are being re-ordered.

(Note: Beware an attacker forcing a sequence number desync by replaying packets after tens of minutes. You can prevent this attack by decrypting and authenticating packets before mutating the internal "current" expanded sequence number.)

**Other Cycle Sizes**

What about when the cycle you're dealing with isn't a 16 bit integer? What if it doesn't match up with a built-in numeric type? What if it's a continuous value, like an angle? Ordering and distance are just a matter of subtraction, except you have to follow up with forcing the result into the interval $[-\frac{n}{2}, \frac{n}{2})$, where $n$ is the length of the cycle:

```java
// Returns the smallest value x, by absolute value,
// such that start+x is congruent to end (mod cycleLength)
int cycleDelta(int start, int end, int cycleLength) {
    assert(cycleLength > 0);
    int d = end - start;
    
    // make smaller
    d %= cycleLength;
    if (d*2 >= cycleLength) d -= cycleLength;
    if (d*2 < -cycleLength) d += cycleLength;
    
    return d;
}
```

Note that everything breaks if signed overflow occurs during the subtraction, so use a large enough numeric type. Changing all the `int`s to `float`s makes the code work on `float`s. If your language has a proper modulo operator, that returns non-negative results even for negative numerators (e.g. Python), you can remove the last adjustment line.

**Summary**

Sequence numbers are ordered by a non-transitive "ahead of" relationship that can be thought of as "closer when going forward".

In practice the non-transitive ordering works *like* a transitive ordering, because at any given time you're only looking at a small part of the cycle.

The signed distance between two sequence numbers is the smallest value congruent to their difference (modulo the cycle length).

**Bonus: Puzzle**

Here's a puzzle related to today's post.

You, me, and your friend are in a room with a standard deck of 52 cards. I propose a game. I tell you that I will shuffle the deck, then deal you five cards. You get to look at them, then pick four to lay down in whatever order you want. Then your friend has to predict what the last card is.

I give you prep-time to discuss strategy with your friend. The only communication you are allowed during the game is in the choosing of which card to not lay down, and the order of the cards you do lay down.

Is it possible to win with certainty? How, or why not? What is the largest deck of cards where it's possible to win with certainty?
