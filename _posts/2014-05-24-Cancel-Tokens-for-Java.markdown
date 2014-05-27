---
layout: post
title: "Cancelling Cancellation"
date: 2014-05-27 11:30:00 EST
categories: software
---

A cancel token accepts cleanup methods, and runs those methods when/if the token is cancelled. They make cleanup easier, especially in asynchronous cases, but I don't think they're very well known or applied as widely as they should be. So I'll talk about them, and see if they catch on eventually.

One of the neat applications of cancel tokens is... cancel tokens. When a cancellation callback becomes unnecessary, usually because an operation completed without being cancelled, you don't want that operation to just sit around taking up memory. You want to clean it up.

In this post I talk about writing a proper cancel token, that can be applied to itself, in Java.

**Basic Token**

A basic cancel token, that only supports adding callbacks, is really simple to write. Have an object that stores a list of callbacks, give it a cancel method that runs and discards all those callbacks, and also give it a "when-cancelled" method that adds a callback to the list (or runs it right away, if cancellation already happened). Here's a basic token, written in three minutes:

```java
// WARNING: not dealing with thread safety or re-entrancy
class CancelToken {
  private List<Runnable> callbacks = new ArrayList<Runnable>();
  public boolean isCancelled() {
    return callbacks == null;
  }
  public void whenCancelled(Runnable callback) {
    if (isCancelled()) {
      callback.run();
    } else {
      callbacks.add(callback);
    }
  }
  public void cancel() {
    if (isCancelled()) return;
    for (Runnable callback : callbacks) {
      callback.run();
    }
    callbacks = null;
  }
}
```

and people would use the token like so:

```java
token.whenCancelled(() -> {
  cleanup();
});

// (elsewhere)
token.cancel();
```

The problem with this basic token, besides the concurrency and re-entrancy issues, is that it can accumulate garbage. If the token lives for a long time, like "until the user closes this browser tab", then the cleanup callbacks of every operation conditioned on it *also* end up living for a long time. Depending on how many things those callbacks reference, this can be a pretty serious memory leak.

If we want our cancel token to behave well in long-lived cases, we need a way to clean up the unnecessary callbacks. The simplest solution would be to add a "remove callback" method. On the other hand, that sounds an awful lot like cleanup and we're writing a tool to make cleanup easier. A tool that's supposed to be better than manually remembering to store and remove everything we add, not *cause exactly that*.

**Conditional Callback**

Instead of a "remove callback" method, we're going to support adding callbacks conditioned on another token. If that other token is cancelled first, the callback is discarded without being run. Here's the signature of the method we want to write:

```java
void whenCancelledBefore(Runnable callback, CancelToken condition)
```

Seems pretty simple, but it's tricky to implement.

Let's start with the obvious (and wrong) implementation:

```java
  public void whenCancelledBefore(Runnable callback, CancelToken condition) {
    if (isCancelled()) {
      if (condition.isCancelled()) return;
      callback.run();
    } else {
      callbacks.add(callback);
      condition.whenCancelled(() -> callbacks.remove(callback));
    }
  }
```

Do you see the problem (besides concurrency and re-entrancy issues)? Now the *condition* token is accumulating unremovable cruft, that becomes unnecessary if the original token is cancelled first. Clearly we need to condition the condition on the action being conditioned.

Since we're writing a method that conditions callbacks, exactly what we need to do to finish said method, you might think we can just use recursion. That... doesn't go so well:

```java
public void whenCancelledBefore(Runnable callback, CancelToken condition) {
  if (isCancelled()) {
    if (condition.isCancelled()) return;
    callback.run();
  } else {
    callbacks.add(callback);
    condition.whenCancelledBefore(() -> callbacks.remove(callback), this); // *CRUNCH*
  }
}
```

If you call the above method, and both tokens aren't cancelled, it will keep recursing until it overflows the stack. Instead of recursion making the problem smaller until it hits a base case, the problem is staying essentially the same, so the recursion never terminates. Maybe this would work on a machine with infinite memory and speed, depending on how said machine resolved this sort of non-halting case, but (unfortunately) we don't have such a machine.

Instead of making an infinitely tall ladder of callbacks removing the callback below them, we need to make a cycle where two callbacks remove each other. This is tricky for a few reasons. First, you might not have the information needed to remove a callback until after it's been added. Meaning you don't know how to remove the second callback when registering the first callback. Second, the first callback might run immediately and try to remove second callback before it's even been added (and so bad things happen). Third, tokens may be concurrently cancelled as the method progresses.

The way I avoid those issues is to make the first callback only do something the second time it is called, and do nothing the first time it is called. Then, after the second callback has been added, I call the first one once. Essentially, this ensures the first callback can't run until after the second callback has been added (and so can be removed). Here's what it looks like, assuming we have an add callback method that returns a remove-the-callback-you-just-added function:

```java
// condition remover can't be initialized yet, but this is where it will end up
Runnable[] conditionRemoverRef = new Runnable[1];

// only remove the condition (and do the actual useful work) on the *second* call
AtomicBoolean prepared = new AtomicBoolean();
Runnable prepareElseRun = () -> {
  if (prepared.compareAndSet(false, true)) return;

  actualCallback.run();

  conditionRemoverRef[0].run();
};

// set up the cycle
Runnable triggerRemover = trigger.addCallbackReturnRemover(prepareElseRun);
conditionRemoverRef[0] = condition.addCallbackReturnRemover(triggerRemover);

// everything's set up, good to run
prepareElseRun.run();
```

Incorporating that into `whenCancelledBefore` results in a working method, and tokens that can cancel themselves. But we're not quite done yet, because we still have a couple corner cases to clear out.

**Efficiency**

If we use an array list to store the items, removing them is not efficient. The problem is that you have to find where the callback-to-be-removed is, and this requires a linear scan of the array (the actual removal is cheap because you can swap with the last item).

A better data structure for this use case is a cyclical doubly linked list. When we add a callback, by creating a node referencing the callback and placing the node into the list, we can keep a reference to the node around. When it comes time to remove the callback, we don't need to search for it because we already know the node, and can do the removal in constant time.

Here's what the "add callback and return remover" function looks like, when you're using a circular doubly-linked list:

```java
Runnable addCallbackReturnRemover(Runnable callback) {
  // create node for callback
  Node n = new Node(callback);
  
  // insert into list
  n.prev = rootNode;
  n.next = rootNode.next;
  n.prev.next = n.next.prev = n;

  return () -> {
    // remove added node from list in constant time
    n.prev.next = n.next;
    n.next.prev = n.prev;
    n.next = n.prev = n;
  }
}
```

I'm sure it's possible to be more efficient than this, perhaps by using nodes that contain blocks of callbacks. Alternatively, perhaps using a singly-linked list, marking nodes as "to be removed", and gradually scanning around the list removing those nodes as other operations occur would be faster. Or maybe sticking with the array list, having the removal actions remember the index where a callback was inserted, and updating those indexes as items get moved around would work well. But I haven't implemented, let alone benchmarked, these ideas so I won't delve any deeper here. Suffice it to say we can achieve constant time insertion and removal.

**Immortality**

The second corner case I want to tackle is tokens that *never* get cancelled. These are useful because they naturally implement "I don't care about cancellation", which happens quite often when prototyping or testing.

I find immortalizing tokens interesting because it's one of the few places where I think using a finalizer is the right solution. The idea goes like this: separate the cancel token into the token part and the source part. The source part gets the `cancel` method, while the token part gets the `whenCancelled` methods. Then, if the source gets finalized before the token is cancelled, we know that the token can never be cancelled and should be immortalized.

Finalizer-based immortalizing is better than a manual `immortalize` method because it happens automatically, without any effort from users, and there's no need to deal with "what if they try to immortalize cancelled tokens?" corner cases (I guess you could [resurrect](http://en.wikipedia.org/wiki/Object_resurrection) a source then try to cancel it, but that's your own fault). Separating the controller-esque `cancel` method from the consumption-esque `whenCancelled` methods is also good design. It lets you pass tokens around without worrying about them being cancelled elsewhere.

Immortality introduces complications into the implementation. External callbacks shouldn't be run when the tokens becomes immortal, but internal cleanup callbacks still need to happen, so we will need two lists of callbacks instead of one. It also introduces a design decision: do we expose this finalization-based cleanup functionality? I think that's a bad idea, because doing finalization-based cleanup correctly is tricky.

As an example of finalization being tricky, consider the lifetime of the list of callbacks to be run if the token is cancelled. If the source has a finalizer and a reference to the list of cancellation callbacks (via the token), then the callbacks and anything they reference will survive the first garbage collection pass where they could have been collected. This is extremely costly because, instead of the referenced objects being collected, they get [promoted to older generations](http://www.oracle.com/technetwork/java/javase/gc-tuning-6-140523.html#generations). To avoid this cost we need to move the finalizer to an object that can't reach the cancellation callbacks. We also have to ensure the only strong reference to the cancellation callbacks is owned by the source. The token itself can only have a weak reference to the list, because the token can outlive the source, and the same goes for cleanup callbacks referencing the list's internal nodes.

Another thing that makes finalization tricky is that anything you touch may itself have been finalized. Not much of a problem in this case, but a very good reason not to expose a `whenImmortal` method.

**Concurrency**

The last corner case, a really important one for cancel tokens since we want to use them in asynchronous cases, is working correctly under concurrency and re-entrancy.

Normally we could deal with this issue by synchronizing the appropriate methods, [while being careful not to invoke callbacks while holding a lock](http://twistedoakstudios.com/blog/Post8424_deadlocks-in-practice-dont-hold-locks-while-notifying). But, because the `whenCancelledBefore` method touches *two* tokens, we run into the issue of lock ordering. If we're holding the triggering token's lock, and try to do a synchronized operation on the condition token, then an operation with the tokens reversed could be happening at the same time and cause us to deadlock.

To get around this issue, the `whenCancelledBefore` method has to be split into pieces that require only one of the locks at a time. Basically you have to synchronously add or remove a callback, let go of any locks, see how things went, then allow the next thing to happen.

**Implementation and Diagrams**

My implementation of cancel tokens in Java is [available on github](https://github.com/Strilanc/Java-Cancel-Tokens). The design follows the advice outlined in this post.

As part of making sure I understood what happens when conditional cancellation is being cleaned up, I made diagrams of what happens. The diagrams show strong references as solid lines, weak references as dashed lines, garbage collection as red Xs, "was triggered / invoked" as stars, and manual removal as blue Xs. Removed objects are also blurred out (which ended up not looking so great).

The first diagram covers what happens when the condition token is cancelled before the triggering token settles. The four nodes added by the conditional callback are removed, without running the callback:

![Condition cancelled](http://i.imgur.com/kAPu97r.gif)

The next diagram covers what happens when the triggering token is cancelled before the condition token settles. The callback is run, and by the end the four nodes associated with the conditional callback have been removed:

![Trigger cancelled](http://i.imgur.com/m1faEgw.gif)

I also considered what happens when the tokens become immortal. The following diagram covers what happens when the triggering token is immortalized before the condition token settles. As with the condition being cancelled first, the callback is not run and all four conditional-callback-related nodes end up removed:

![Trigger immortal](http://i.imgur.com/DSnduvF.gif)

The final case, which I think is the most interesting, is what happens when the condition token is immortalized before the triggering token settles. Now only three of the four nodes are removed, resulting in the callback being unconditional:

![Condition immortal](http://i.imgur.com/RyxrZ8x.gif)

I'm not sure how much the above diagrams help with understanding what's going on, but I found them really helpful as a reference.

**Summary**

Cancel tokens make cleanup easier. You should be able to use them on themselves, to cleanup cancellation callbacks. I have a [Java implementation on github](https://github.com/Strilanc/Java-Cancel-Tokens).
