---
layout: post
title: "Rule of Thumb: The Condition is the Message"
date: 2014-03-31 21:30:00
categories: heuristic
---

In this post: a simple time saver.

**Prose vs Code**

Many methods start by checking that the caller satisfied several preconditions. Typically with a big block of `if-then-throw` statements, like this:

```java
void doTheThing(int attempts, double timeout, ...) {
    if (attempts <= 0) throw new IllegalArgumentException("The number of attempts must be positive.");
    if (timeout <= 0) throw new IllegalArgumentException("The timeout can't be zero or negative.");
    if (Double.isNaN(timeout)) throw new IllegalArgumentException("The timeout can't be NaN.");
    ...
}
```

I want to point out something about the above example: the error messages. Consider: why are they in English prose, instead of just verbatim repeating the code for the condition that failed?

Are the messages in prose because the prose is more informative? Not in this case. The messages contain exactly the same information as the code.

Are the messages in prose so the user can understand them? No, because exception messages aren't supposed to be shown to end users (unless you *want* to internationalize them...). They're hints for programmers, who understand code just fine.

So why did we bother writing the messages in English? We already have a perfectly good description of what went wrong: the code for the condition. Why not just repeat it? Like this:

```java
void doTheThing(int attempts, double timeout, ...) {
    if (attempts <= 0) throw new IllegalArgumentException("attempts <= 0");
    if (timeout <= 0) throw new IllegalArgumentException("timeout <= 0");
    if (Double.isNaN(timeout)) throw new IllegalArgumentException("Double.isNaN(timeout)");
    ...
}
```

Re-using the code for the condition saves time. It turns a translation problem into a copy-paste problem simple enough to be automated (e.g. Objective-C's [NSCParameterAssert](https://developer.apple.com/library/ios/documentation/cocoa/reference/foundation/miscellaneous/foundation_functions/reference/reference.html#//apple_ref/c/macro/NSCParameterAssert) uses the C preprocessor to put the expression into the error message). Code is also more compact, and less ambiguous, than English.

... That's it. A super simple time saver. Use it.

Alright, alright. There are cases where you shouldn't.

**When to Use Prose**

The first case where it makes sense to translate an error condition into English is *when you actually include additional information*. Maybe the message explains why the condition is an error in the first place, or maybe it gives some hints for how to fix the problem. Anything beyond just restating the condition causing the problem will do.

Here's the example method from the previous section, but modified to have helpful errors:

```java
void doTheThing(int attempts, double timeout, ...) {
    // helpful errors
    if (attempts == 0) throw new IllegalArgumentException(
        // People tend to guess `0` when learning, so mention that they should try `1` instead.
        "The number of attempts must be positive, not zero. The most commonly used number of attempts is 1.");
    if (timeout == 0) throw new IllegalArgumentException(
        // The mistake of assuming we follow the  misguided convention that a timeout of 0 means no timeout
        // is common enough to justify saying how to fix it in the error message.
        "The timeout must be positive, not zero. Use Double.POSITIVE_INFINITY for an infinite timeout.");

    if (attempts < 0) throw new IllegalArgumentException("The number of attempts must be positive, not negative.");
    if (timeout < 0) throw new IllegalArgumentException("The timeout must be positive, not negative.");
    if (Double.isNaN(timeout)) throw new IllegalArgumentException("The timeout must be positive, not NaN.");
    ...
}
```

Including the extra information justifies the cost of translating the error conditions to English. The place where this makes the most sense is at API boundaries, where the reader is likely *not you*. For example, here's a helpful error from [JodaTime](http://www.joda.org/joda-time/):

```java
...
if (getMonths() != 0) {
    throw new UnsupportedOperationException(
        "Cannot convert to " + destintionType + " as this period contains months and months vary in length");
}
...
```

(Notice how the message mentions the intended result and justifies the condition being an error. (Also, the variable name has a typo. Tee hee.))

The other common case where it doesn't make sense to re-use code verbatim for the message is *when the problem is explained by the exception's type*. For example, C#'s `DivideByZeroException` and `ArgumentNullException` classes only need you to specify the parameter name they should use in their explanations. Also, exceptions like `SocketException` and `IOException` are often not associated with a particular expression failing so there's no code to re-use.

The final reason I typically use prose is *consistency*. If all the other error messages are in aliterated Shakesperean English, then that's the theme thou throws throughout. Having one message not follow the same rule as the others is jarring.

**Summary**

Don't bother translating error cases into English prose if you're just going to restate the condition that caused the problem, without including any additional information or clarifications. Instead, just re-use the condition's code for the message.
