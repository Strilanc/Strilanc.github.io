---
layout: post
title: "Positive Bias and Testing"
date: 2014-03-18 7:30:00
categories: testing
---

Recently, I watched the YouTube video ["Can you solve this?"](http://youtu.be/vKA4w2O61Xo). In the video, Veritaseum (a science educator) poses a puzzle to people he is interviewing. They have to figure out a secret rule he is using to accept/reject number sequences. They can test sequences, to see if he accepts or rejects them, and he gets them started by saying his rule accepts the sequence $1,2,4$.

People immediately catch on to the multiplying-by-two pattern in the hint, try a few sequences that follow the rule (e.g. $3,6,12$ and $16,32,64$), then go with that guess.

And so the trap closes: they only tested sequences *they expected to be accepted*. They never checked that $[0,0,0]$ or $[1,2,3]$ or $[-1,\pi,i,4]$ are actually rejected, so they never realized the real rule is *more general* than the first rule that came to mind.

This tendency to check positive predictions, instead of negative predictions, is known as [positive bias](http://lesswrong.com/lw/iw/positive_bias_look_into_the_dark/). It's one of the many things you should keep in mind when writing tests.

**Equality**

Suppose I make a custom case-insensitive string type for C#, that works exactly like a normal string, except all comparison operations ignore upper/lower casing. I ask you to test the equality operators. You write some tests:

    assert((CaselessString)"" == (CaselessString)"");
    assert((CaselessString)"" != (CaselessString)"a");
    assert((CaselessString)"A" == (CaselessString)"A");
    assert((CaselessString)"A" == (CaselessString)"a");
    assert((CaselessString)"a" == (CaselessString)"A");
    assert((CaselessString)"a" != (CaselessString)"b");
    ...

The tests all pass. But then you notice some compiler warnings and take a look at the code:

    public static bool operator==(CaselessString s1, CaselessString s2) {
        return s1._innerText.ToUpper() == s1._innerText.ToUpper();
    }
    public static bool operator!=(CaselessString s1, CaselessString s2) {
        return s1._innerText.ToUpper() != s1._innerText.ToUpper();
    }

See it? The result is always `true`, because `s1` is being compared against itself instead of `s2`!

The tests didn't catch the problem because they're not testing any cases where the operators should return false. We missed an important negative case, because we were thinking in terms of satisfying instead of rejecting. We implicitly assumed `==` was the opposite of `!=` instead of testing it (or using a language that enforced that fact).

**Authentication**

Let's look at another example: authenticating packets. Suppose you write some code to compute the [HMAC](http://en.wikipedia.org/wiki/Hash-based_message_authentication_code) of a packet's payload, and compare it against the HMAC included in the packet:

    bool Packet::isAuthentic() {
        return memcmp(hmac(contents.payload, secretKey), contents.hmac, 16/8) == 0;
    }

You also write some tests:

    assert(Packet(somePayload, someCorrectHmac).isAuthentic());
    assert(!Packet(somePayload, allZeroes).isAuthentic());
    assert(Packet(someOtherPayload, someOtherCorrectHmac).isAuthentic());
    ...

And the tests pass.

Notice that we do have a negative test to make sure the code is not just `return true`. That's a very good thing (it's one of the many ways Apple's [`goto fail` security bug in iOS](http://www.wired.com/threatlevel/2014/02/gotofail/) could have been caught).
 Unfortunately, there's a typo that breaks the code. The size of the data being compared should be `160/8`, not `16/8`. The odds of a bad packet getting through should be one in a trillion trillion trillion trillions, but is instead more like one in a hundred thousand. The authentication only depends on the first two bytes of the HMAC, instead of all twenty.

We had a test to reject naive programs like `return true // todo: implement`, but no tests to reject programs where the size given to memcmp was simply typo'd. Or tests to reject programs using `strncmp` [instead of](http://rdist.root.org/2008/03/25/wii-hacking-and-the-freeloader/) `memcmp`. Or to reject programs that don't depend on all the bytes for other reasons. Or programs that [accidentally assign](http://stackoverflow.com/a/2775046/52239) `contents.payload` instead of comparing against it.

And that's my trick for avoiding positive bias: come up with wrong (but nearby) programs, and write tests to reject them.

**Summary**

Think of tests not just in terms of *what should happen*, but in terms of *what could be wrong*. Come up with plausible flawed implementations, and write tests to reject them.

---

[Discuss on Reddit](http://www.reddit.com/r/programming/comments/20sxmn/positive_bias_and_testing/)
