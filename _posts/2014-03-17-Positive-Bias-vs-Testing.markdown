---
layout: post
title: "Positive Bias and Testing"
date: 2014-03-17 21:30:00
categories: puzzle
---

In this post: techniques for avoiding positive bias when writing tests.

**Positive Bias**

Recently, a science educator on YouTube known as Veritaseum posted the video ["Can you solve this?"](http://youtu.be/vKA4w2O61Xo). In the video, he poses a puzzle to people he is interviewing. They have to figure out a secret rule he is using to accept/reject number sequences. As a hint, he tells them his rule accepts the sequence $1,2,4$.

People immediately catch on to the multiplying-by-two pattern in the hint, try a few sequences that follow the rule (e.g. $3,6,12$ and $16,32,64$), then guess that the rule is the multiplying-by-two pattern. And so the trap closes: they only tested sequences *they expected to be accepted*. They never check that $[0,0,0]$ or $[1,2,3]$ or $[-1,\pi,i,4]$ are actually rejected, so they never realize the real rule is *more general* than the rule they've guessed.

This tendency to check positive predictions, instead of negative predictions, is know as *positive bias*. And you should keep it in mind when writing tests.

**Equality**

Suppose I make a custom case-insensitive string type, that works exactly like a normal string except all comparison operations ignore upper/lower casing, and ask you to test that I implemented the equality operators correctly. You write some tests:

    assert((CaselessString)"" == (CaselessString)"");
    assert((CaselessString)"" != (CaselessString)"a");
    assert((CaselessString)"A" == (CaselessString)"A");
    assert((CaselessString)"A" == (CaselessString)"a");
    assert((CaselessString)"a" == (CaselessString)"A");
    assert((CaselessString)"a" != (CaselessString)"b");
    ...

Do you see the problem?

Here's a hint:

    public static bool operator==(CaselessString s1, CaselessString s2) {
        return s1._innerText.ToUpper() == s1._innerText.ToUpper();
    }
    public static bool operator!=(CaselessString s1, CaselessString s2) {
        return s1._innerText.ToUpper() != s1._innerText.ToUpper();
    }

See it? `s1` is being compared against itself! The result is unconditionally `true`.

Our tests aren't catching the problem because they're not testing any cases where the operators should return false. This is a particularly nasty case, because we intuitively assume `==` will be the opposite of `!=`. It's hard to realize that you haven't tested that assumption (unless your programming language guarantees it).

**Authentication**

Another example where it is vitally important to watch out for positive bias is when testing authentication. Don't just test that users can log in, or that packets are accepted when properly signed. Test that giving the wrong password causes login to fail. Test that signing with the wrong private key causes the packet to be rejected.

In fact, in this case I would argue that the failure case is *more important*. Better to reject valid packets than accept forged ones. Both mistakes require fixing the bug, but a machine that's accepted malicious packets may have been compromised. You have to wipe it clean to be sure.

The recent [iOS `goto fail` bug](http://www.wired.com/threatlevel/2014/02/gotofail/) would have been caught by testing for failure. Or by requiring 100% code coverage in security routines. Or by code analysis. Or by... maybe it's not a good example for this *particular* rule of thumb.

**Hashing**

Another example where you should watch out for positive bias is custom hash function. A hash function is supposed to satisfy the property that, when `a == b`, `hash(a) == hash(b)`.
When testing it is important to fight this nature. Make predictions that should be false.

**Eliminate Nearby Programs**

Think of programs that are nearby what the correct code you're trying to test would be. Nearby programs are ones that can be reached with a simply typo, an off-by-one error, or other common human mistakes. After you've tested that the program works, *make sure each of those nearby programs would be rejected*.

**Summary**

[Look into the dark.](http://lesswrong.com/lw/iw/positive_bias_look_into_the_dark/)
