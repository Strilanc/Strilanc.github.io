---
layout: post
title: "Java should Autobox Arrays, or maybe not"
date: 2016-09-10 12:10:10 pm EST
permalink: post/1621
---

I remember, the first time I used C#, being pleasantly surprised that `1.ToString()` worked.
For a seasoned C# programmer, that might seem a bit silly: why *wouldn't* it work?
`ToString` works on every other value, except null, so why wouldn't I expect it work on a simple value like the number 1?

As you might have guessed from the title, it was only the low bar set by Java that allowed C# to create a feeling of delight while doing nothing but the obvious.
C# makes no distinction between a value and its boxed form, but in Java there's a sharp line between *objects* and *primitives*.
Primitives don't have methods.
`1` is a primitive.
`ToString` is a method.
Therefore `1.toString()` doesn't compile in Java.
Instead, you have to use the boxed form of `int`: say `new Integer(1).toString()`.

This same basic story, of C# doing the obvious thing and Java doing the boilerplate thing, repeated itself with arrays and collections.
In C#, arrays implement interfaces like `ICollection<T>` and `IEnumerable<T>`.
In Java, you can't pass a `String[]` into a method asking for an `Iterable<String>` because `String[]` doesn't implement `Iterable<String>` or even `Iterable`.
Instead, just like with `int`, an adapter object is needed.
Perhaps the one returned by [`Arrays.asList`](https://docs.oracle.com/javase/7/docs/api/java/util/Arrays.html#asList\(T...\))?

Java 5 fixed most primitive-to-boxed-object-and-back boilerplate with [autoboxing](https://docs.oracle.com/javase/tutorial/java/data/autoboxing.html).
You still can't call `toString` on `1`, but at least you can add `1` into a list.
Since the arrays-vs-collections thing is int-vs-Integer all over again, why not re-use the autoboxing solution?
Whenever a method asks for an `Iterable<String>`, and I pass a `String[]` instead, just have the compiler do the `Arrays.asList` call for me.
Wouldn't that be *nice*?

Well... probably.
But it's also likely that, in ten years, I'd be complaining about it as a bad move.

Consider that exposing a `byte[]` as an iterable requires two levels of boxing.
The array has to be boxed into a collection, and then each `byte` item has to be boxed into a `Byte`.
This would be an unfortunate thing to do, [when you're planning on adding value types to the language](https://www.youtube.com/watch?v=Tc9vs_HFHVo).
It would lock down `byte[]` as being an `Iterable<Byte>` instead of (possibly in the future) an `Iterable<byte>`.

Another issue that would crop up when autoboxing arrays, that isn't an issue for primitives, is the expectation of reference equality.
Programmers could reasonably expect that `arr == (Iterable) arr` should evaluate to true.
But `arr != Arrays.asList(arr)`.
So that would be surprising and confusing.

Lastly, due to arrays' covariance ([a design mistake that C# copied](http://stackoverflow.com/a/4318510/52239)), the autoboxing is technically not type safe.
Code like `Iterable<String> x = (String[]) (Object[]) new Byte[] {1, 2, 3}` will produce a broken iterable (... I guess that already happens with `Arrays.asList`).

# Summary

Twenty years ago, Java was created with unnecessary distinctions between primitives and objects.
We've been paying for it ever since, in `IEnumerable` ways.
