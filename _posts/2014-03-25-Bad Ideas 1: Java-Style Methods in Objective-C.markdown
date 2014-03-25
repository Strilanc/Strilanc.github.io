---
layout: post
title: "Bad Ideas #1: Java-Style Methods in Objective-C"
date: 2014-03-25 10:00:00
categories: bad-idea
---

Sometimes, when you're coding, you come up with ideas. Sometimes using those ideas is a bad idea. In this series of posts, "bad ideas", I come up with tempting tricks that you shouldn't actually use.

Today's trick: How to make invoking methods in Objective-C look like Java.

**Invoke Nesting**

One of the superficial things I don't like about Objective-C is the way methods are invoked. Unlike Java's invoke syntax, where you "dot off" an object then bracket the arguments (e.g. `instance.method(arg1, arg2)`), Objective-C's invoke syntax brackets the entire expression (e.g. `[instance message:arg1 anotherParam:arg2]`).

The issue I have with bracketing the entire expression is that it doesn't match how I think and write code. I tend to go in pipeline order, by starting from the input and repeatedly saying "and then apply X to the intermediate result" until I get what I want. As a result, when writing expressions in Objective-C, I'm constantly bouncing back-and-forth balancing brackets. The extra nesting depth also makes the resulting code harder to read.

There are languages that take advantage of bracketing entire invoke expressions, like LISP does as part of keeping its syntax amazingly simple, but I don't consider Objective-C to be part of that group. So, is there some way to force Java/C#/C++'s invoke syntax into Objective-C?

**Block Getters**

Objective-C does have a limited "dotting off" syntax, but only for methods that take no arguments. In addition to this syntactic sugar for getters, Objective-C has blocks (anonymous functions). Blocks are invoked the same way functions are invoked, by following them with bracketed arguments like `someBlock(arg1, arg2)`.

Also, you can return blocks from methods. Including getters.

Yeah... we can expose a Java-esque invoke syntax by having a getter that returns a block. Instead of giving the arguments to the getter, they'll be given to the block. It looks like this:

``` objective-c
// [inside a category on NSString]
-(NSString*(^)(NSString*))concat {
    return ^(NSString* second) {
        return [this stringByAppendingString:second];
    };
}

// [... elsewhere ...]
NSString* farsight = @"far".concat(@"sight");
```

Of course, you should never do this. It's a clear example of fighting the language instead of using it. And readers will be very confused about what's going on. And IDEs will give poor auto-completion. And there will be few warnings when you get block parameter types wrong. And it's slower.

But it's still really tempting to me.

**Summary**

You can force Java's invoke syntax into Objective-C by abusing blocks and the syntactic sugar for properties. These "block properties" are a bad idea.
