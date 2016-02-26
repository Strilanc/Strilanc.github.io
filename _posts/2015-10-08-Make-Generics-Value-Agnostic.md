---
layout: post
title: "Rule of Thumb: Make Generic Code Value-Agnostic instead of Null-Hostile"
date: 2015-10-08 11:30:00 EST
categories: opinion
comments: true
---

Nulls are a big source of headaches, to [put it mildly](http://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare).
Even the greatest programmers make stupid oversights (just like the greatest mathematicians make sign errors), and the possibility of any and every value being null introduces a whole lot of chances for stupid oversights when programming.

There are lots of strategies and tactics for dealing with the null problem, but in this post I want to talk about one particular tactic, "null-hostile" collections, and why I find it problematic.

A null-hostile collection is a collection that can contain arbitrary values... except for null.
When you try to put a null item, key, or value into a null-hostile collection, your reward is a null reference exception.
Sometimes the exception being thrown is unintentional, caused by a bug, but usually it's a purposeful design decision.

(
Java has both null-friendly and null-hostile collections in its standard libraries. Third-party libraries also tend to go both ways on this issue ([e.g. Guava](https://github.com/google/guava/wiki/LivingWithNullHostileCollections)).
Unfortunately, null-hostility generally isn't called out in class names; you have to memorize which collections have which trait.
It's also not exposed by the type system.
)

# Tradeoffs

There are two reasons to design a collection to be null-hostile, that I can think of.
First, it can make code simpler.
For example, you can write `x.hashCode()` instead of `x == null ? 0 : x.hashCode()` when implementing equality.
Second, in a code base where null is discouraged, null-hostility can help catch accidentally introduced nulls before they spread too far.

The *problem* with null-hostile collections is, of course, that they don't work with null.
This makes using them in glue code and utility code problematic, because the code inherits the collection's aversion to null and passes it on to downstream users.

The best example of this problem, I think, is Java's `Optional<T>`.
Consider the following method:

    Optional<T> first(Iterable<T> sequence) {
        for (T item : sequence) {
            return Optional.of(item);
        }
        return Optional.absent();
    }

`first`'s signature implies this method will work on any iterable.
But that's a bit of a mislead, because `Optional` is null-hostile while iterables are, generally speaking, allowed to contain nulls.
When an iterable given to `first` starts with a null, you won't get an `Optional` containing the iterable's first value back; you'll get a runtime exception.

Effectively, `first` has a precondition hidden inside its *return* type (normally associated with postconditions, not preconditions).
If you want to implement a `first` that actually works on all iterables, you have to roll a custom null-friendly `Optional`.
Otherwise, methods using `first` will also have to avoid null.

The fact that users of null-hostile utilities must also be null-hostile (or else need lots of glue code) *is* acceptable within a single code base.
Killing null is fun for everyone.
But eventually you'll have to interop with external code, and it may not share your anti-null sensibilities.
At that point, null-hostility can become more of a boilerplate-adapter-code-generator than a benefit.

# Why not all nulls?

Why have I been talking specifically about generic collections this whole time?
Don't the same "you should allow null" arguments apply to, say, requiring string arguments to be non-null?

The difference, in my mind, is that generic collections tend not to care or depend upon the details of the items you put into them.
There is no new behavior or corner cases needed for nulls; you just pass them through like every other value.
The internal implementation code may need special handling of null, but the exposed logical interface can treat all values in the same way (i.e. be value-agnostic).

By contrast, if you try to allow all nulls *everywhere*, you will find yourself *introducing* corner cases instead of removing them.
For example, if `String#startsWith` is going to accept a null prefix argument, then you will need to arbitrarily decide whether or not the empty string starts with a null string or not.

The intuition-pump I use, to decide which side of this treat-null-the-same-vs-ban-it distinction a case falls on, is to imagine non-nullable types being added to Java (though that would be a bit of an engineering miracle to pull off).
In that magical hypothetical future, I would immediately switch the signature of `String#startsWith`'s prefix argument from `String` to `String!`.
But, for generic collections, I'd make the opposite decision.

Once you have non-nullable types available, saying `String` starts to mean more than it used to.
You *could* have said `String!`, but you said `String`.
You're *asking* for null to be allowed.
So when `Optional<String>` rejects null, despite you *asking* for null, it seems kind of... backwards.
And that fact would be reflected in a never-ending stream of StackOverflow questions asking why changing `Optional<String!>` to `Optional<String>` didn't work.

Ultimately, I'm saying that users of your generic code have more information than you about whether null is an expected value.
*They* should decide whether or the generic type `T` logically includes null.
Your job is to allow them to make that decision, and being value-agnostic is an effective way to do that.
You should only be null-hostile when null really can't satisfy the code's needs (e.g. if there's a type constraint on the generic parameter).

# Summary

Null-hostililty is great for cleaning nulls out of your code base, but makes interop with null-friendly code hard and exposes value-dependent behavior in code that intuitively shouldn't depend on specific values.
Generic code that treats all values the same is [easier to reason about](http://ttic.uchicago.edu/~dreyer/course/papers/wadler.pdf).
