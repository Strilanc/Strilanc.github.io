---
layout: post
title: "Cancelling Cancellation"
date: 2014-05-24 11:30:00 EST
categories: software
---

A cancel token accepts cleanup methods, and runs those methods when/if the token is cancelled. They make cleanup easier, especially in asynchronous cases, but I don't think they're very well known.

One of the neat applications of cancel tokens is... cancel tokens. When a cancellation callback becomes unnecessary, usually because an operation completed without being cancelled, you don't want it to just sit around taking up memory. You want to remove it.<

In this post I talk about writing a proper cancel token, that can be applied to itself, in Java.

**Basic Token**

A basic cancel token, that only supports adding callbacks, is really simple to write. Have an object that stores a list of callbacks, give it a cancel method to run and discard all those callbacks, and also give it a "when-cancelled" method to add callbacks to the list (or run them right away, if cancellation already happened). Here's a basic token, written in 2 minutes:

```java
// WARNING: not dealing with thread safety or re-entrancy
class CancelToken {
  private List<Action> callbacks = new ArrayList<Action>();
  public boolean isCancelled() {
    return callbacks == null;
  }
  public void whenCancelled(Action callback) {
    if (isCancelled()) {
      callback.call();
    } else {
      callbacks.add(callback);
    }
  }
  public void cancel() {
    if (isCancelled()) return;
    for (Action callback : callbacks) {
      callback.call();
    }
    callbacks = null;
  }
}
```

and people would us the token like so:

```java
token.whenCancelled(() -> {
  cleanup();
});

// (elsewhere)
token.cancel();
```

The problem with this basic token, besides the concurrency and re-entrancy issues, is that it can accumulate garbage. If the token lives for a long time, like "until the user closes this browser tab", then the cleanup callbacks of every operation conditioned on it *also* end up living for a long time. Depending on how many things those callbacks reference, this can be a pretty serious memory leak.

If we want our cancel token to behave well in long-lived cases, we need a way to clean up the unnecessary callbacks. The simplest solution would be to add a "remove callback" method. On the other hand, that sounds an awful lot like cleanup and we're writing a tool to make cleanup easier. A tool that's supposed to be better than manually remembering to undo everything, not *cause it*. So, instead of a remove callback method, we're going to add support for adding callbacks conditioned on another token. If that other tokens is cancelled first, the callback is discarded without being run.

**Conditional Callback**

Here's the signature of the method we want to write:

```java
void whenCancelledBefore(Action callback, CancelToken condition);
```

and here's a (wrong) implementation of it:

```java
  public void whenCancelledBefore(Action callback, CancelToken condition) {
    if (isCancelled()) {
      if (condition.isCancelled()) return;
      callback.call();
    } else {
      callbacks.add(callback);
      condition.whenCancelled(() -> callbacks.remove(callback));
    }
  }
```

Do you see the problem (besides concurrency and re-entrancy issues)? Now the *condition* token is accumulating unremovable cruft. We need to condition the condition.

Since we're writing a method that does exactly what we need, you might think you can just use it. That... doesn't go so well:

```java
  public void whenCancelledBefore(Action callback, CancelToken condition) {
    if (isCancelled()) {
      if (condition.isCancelled()) return;
      callback.call();
    } else {
      callbacks.add(callback);
      condition.whenCancelledBefore(() -> callbacks.remove(callback), this); // *CRUNCH*
    }
  }
```

If you call the above method, and both tokens aren't cancelled, it will keep recursing until it overflows the stack. The problem is that it keeps introducing new conditions that must be conditioned. Maybe it would work on a machine with infinite memory and time, depending on how said machine resolved this sort of non-halting case, but we don't have one of those.

Instead of making an infinitely tall ladder of callbacks removing the callback below them, we need to make a cycle where two callbacks remove each other. This is tricky, for a few reasons. You might not have the information needed to remove a callback until after it's been added. You have to be careful not to remove the second callback until it's actually been added. Plus, in the concurrent case, tokens may be cancelled as the method progresses but if we synchronize on both tokens at the same time we'll have introduced a [lock ordering deadlock](http://en.wikipedia.org/wiki/Deadlock).

The way I avoid those issues is to make the first callback do nothing the first time it is called. Then I call it once, after the second callback has been added. Essentially, this ensures the first callback can't run until after the second callback is removable. Here's what it looks like, assuming we have an add callback method that returns a remove-the-callback-you-just-added function:

```java
// condition remover can't be initialized yet, but this is where it will end up
Action[] conditionRemoverRef = new Action[1];

// only remove the condition (and do the actual useful work) on the *second* call
AtomicBoolean prepared = new AtomicBoolean();
Action prepareElseRun = () -> {
  if (prepared.compareAndSet(false, true)) return;

  actualCallback.call();

  conditionRemoverRef[0].call();
};

// set up the cycle
Action triggerRemover = trigger.addCallbackReturnRemover(prepareElseRun);
conditionRemoverRef[0] = condition.addCallbackReturnRemover(triggerRemover);

// everything's set up, good to run
prepareElseRun.call();
```

Incorporating that into `whenCancelledBefore` results in a working method, and tokens that can cancel themselves. But we're not quite done yet, because we still have a couple corner cases to clear out.

**Efficiency**

If we use an array list to store the items, removing them is not efficient. The problem is that you have to find where the callback-to-be-removed is, and this requires a linear scan of the array (the actual removal is cheap because you can swap with the last item).

A better data structure for this use case is a cyclical doubly linked list. When we add a callback, by creating a node referencing the callback and placing the node into the list, we can keep a reference to the node around. When it comes time to remove the callback, we don't need to search for it because we already know the node. Like this:

```java
Action addCallbackReturnRemover(Action callback) {
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

I'm sure it's possible to be more efficient than this, perhaps by using nodes that contain blocks of callbacks, but it's sufficient to demonstrate the point.

We have one more corner case I want to tackle: tokens that *never* get cancelled. These are useful because they easily turn cancellable operations into simpler non-cancellable operations when that's what you want, which happens quite often when prototyping or testing.

**Immortality**

How can we detect that a token will never ever be cancelled?

The approach I use is to separate the cancel method into a separate class, called the token's *source*. A token's source is the *only* way to cancel it. Meaning that, if the source becomes garbage and gets collected, the token is guaranteed to never be cancelled. We can detect this happening by given the source a finalizer, and discard the token's callbacks without running them.

This adds a third state to our tokens. Before they were cancelled or not, but now they can be cancelled, still-cancellable, or immortal. An immortal token is quite possible the most useless object you can imagine: when you give it a callback it just discards it without doing anything. But this is actually a really useful bit of logic for many cancellable operations, because it corresponds to the "I don't want to ever cancel" case.

The main distinction introduced into the code by immortality is we have to maintain to lists of things to run. There's the list of normal callbacks, which are run when the token is cancelled, but also the list of internal cleanups that also run when the token is cancelled but *also* run when the token becomes immortal. We don't expose "whenImmortal" functionality to callers, because finalization based cleanup is tricky to get right.

For example, finalization keeps objects alive longer. When an object has a finalizer, the first garbage collector sweep that notices it is not referenced does not collect it. This promotes the object, *and everything it referenced*, to the next generation. This makes collecting them much more expensive.

The token I've written is very carefully set up to allow callbacks to be collected by the *first* pass. This is done by having the source keep the only strong reference to the list of callbacks (the token itself has only a weak reference), and by moving the finalizer to an object held by the source that does not reference the list of callbacks. It also uses weak references when making the cleanup cycle.

**Diagrams**

Here are some diagrams of the cleanup process in each case:

![Condition cancelled](http://i.imgur.com/kAPu97r.gif)

![Trigger cancelled](http://i.imgur.com/m1faEgw.gif)

![Condition immortal](http://i.imgur.com/YvSFpuG.gif)

![Trigger immortal](http://i.imgur.com/DSnduvF.gif)

**Summary**

Cancel tokens make cleanup easier. You should be able to use them on themselves, to cleanup cancellation callbacks.

You can remove items from a doubly-linked list in constant time, if you keep track of the nodes. Finalizers are tricky things to use well.






