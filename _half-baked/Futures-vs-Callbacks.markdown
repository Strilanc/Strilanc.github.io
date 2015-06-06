One of the questions I commonly hear when encouraging someone to try out futures, instead of callbacks is "What's the difference?". Superficially, they look very similar. When using callbacks you write `asyncThingy(args, callback)`, but when using futures you write `asyncThingy(args).then(callback)`. That's only a syntactic difference!

In this post, I'll lay out some of the more important *semantic* differences and their related consequences.

**Caching**

The simplest thing that futures make easier is caching. If you want to give two redundant calls the same result, just re-use a returned future. In a lot of ways a future *is* a cached callback result.

**Ordering**

The first advantage futures have over callbacks is that they let you create callbacks in the order they will be needed, instead of the opposite. For example:

```C#
void f(T v0, Callback b0) {
    var b1 = v5 => func5(v5, b0)
    var b2 = v4 => func4(v4, b1)
    var b3 = v3 => func3(v3, b2)
    var b4 = v2 => func2(v2, b3)
    var b5 = v1 => func1(v1, b4)
    func0(v0, b5)
}
```

See how all the pieces have to be in place before the actual work can start? That's because the action has been split into two phases: wiring and invoking. Wiring builds up a stack of callbacks, then invoking burns the stack down in LIFO order. The wiring happens in reverse order, compared to the effects, forcing you to either nest the effects (creating the "arrow of death") or to specify them in reverse order (as above).

With futures, that's no longer the case. Each future is like a checkpoint that wiring can start from, allowing you to write things in the right order without nesting:

```C#
Future<R> f(T v0) {
    var r0 = func0(v0)
    var r1 = r0.then(v1 => func1(v1))
    var r2 = r1.then(v2 => func2(v2))
    var r3 = r2.then(v3 => func3(v3))
    var r4 = r3.then(v4 => func4(v4))
    return r4.then(v5 => func5(v5))
}
```

More subjectively speaking, when I'm writing with callbacks I always get this feeling of building this giant teetering tower but with futures it feels like I'm making a bunch of small easy towers.

**Testing**

Testing callbacks is a pain. Basically you end up writing and rewriting callbacks that stash the result into a captured local variable, like so:

```C#
void test() {
    var wasCalled = false;
    var result = default(T);
    asyncFunction(v => { wasCalled = true; result = v; })
    assert(wasCalled);
    assert(result == expected);
}
```

Of course it's simpler if you create a class to deal with the boilerplate:

```C#
void test() {
    var resultTaker = new ResultTaker<T>();
    asyncFunction(v => { resultTaker.set(v); })
    assert(resultTaker.got(expected));
}
```

However, the thing to notice here is that `ResultTaker` is just a future. It's an object into which an asynchronous result is placed, so you can read it later. Many attempts to turn an asynchronous function inside out like this end up creating adhoc futures... and would be shorter if you'd just used futures in the first place.

```C#
void test() {
    assertWillEqual(asyncFunction(), expected);
}
```

This simplification also occurs on the mocking side, where you're trying to emulate a service. You can use the minimalist "when called with X return Y" functionality of mocking frameworks, instead of having to interact with X.

**Error Inlining**

Futures combine with errors really, really well. With callbacks you need a second error callback and every step of the computation has to care about it. But with futures you can just have `then` propagate the error into the result.

**Variance**

Futures come *out* of functions while callbacks go *in*, causing futures to be covariant while callbacks are contravariant. Generally speaking, covariant values are easier to work with. A collection of futures of strings is a collection of futures of objects, but a collection of callbacks taking strings is *not* a collection of callbacks taking objects.

You want to group a bunch of asynchronous results into a list? With futures you just invoke the methods and create a list of all their future results. With callbacks you call all the methods with callbacks that put them into the list, but you have to worry about ordering and concurrent mutation and signalling completion. With futures you just put the futures in to a list. You *can* wait for all the futures to complete, but you don't *have* to.

This also allows futures to have a sort of "immutable facade". They aren't *im*mutable, but they're definitely *less* mutable.


