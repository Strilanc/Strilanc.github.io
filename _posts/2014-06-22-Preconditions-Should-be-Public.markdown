---
layout: post
title: "Rule of Thumb: Preconditions Should be Public"
date: 2014-06-22 11:30:00 EST
categories: rule-of-thumb
---

In software, it's common to have operations that only make sense when an object is in a particular state. For example, in a guess-how-many-jelly-beans-are-in-the-jar contest, you're typically not allowed to guess the same number as someone else. Also, there can't be a winner if no one has guessed. So if you write a class to handle that sort of contest, you naturally end up with code checking for those conditions:

```c#
class JellyBeanGuessingContest(private readonly int actualAmount) {
  private readonly Dictionary<int, Person> guesses = new Dictionary<int, Person>();
  
  public void addGuess(int amount, Person person) {
    if (guesses.ContainsKey(amount)) throw new PreconditionFailed("duplicate guess");
    guesses[amount] = person;
  }
  
  public Person getWinner() {
    if (guesses.Count == 0) throw new PreconditionFailed("no guesses");
    // (in the event of a g+d vs g-d tie, the larger guess wins because I said so)
    return guesses.MaxBy(e => Math.Abs(e.Key - actualAmount + 0.25)).Value;
  }
}
```

The problem here is that whatever is calling this class has no way of checking *for itself* if the operations will succeed or fail. The only way to determine if an amount has already been guessed is to try to make that guess and fail, and the only way to know there isn't a winner is to fail at getting the winner. We have *private* preconditions on *public* methods.

"Can't guess that" and "no winner yet" are important cases that the caller is going to want to handle. Exceptions shine when failure is propagated, not when it's handled, so they're the wrong mechanism for informing the caller here. Basically we're forcing callers to use try-catch blocks, instead of if-else blocks, and that's bad because try-catch blocks are bloated and fickle. They take longer to write, longer to execute, and more effort to review (because you can't tell if they're correct without digging into documentation).

In other words, our exceptions aren't actually exceptional. We want to blame the caller for calling at the wrong time, but we're not giving them the tools to *not* call at the wrong time, so we expect to throw exceptions during normal usage. This makes it harder to detect exceptions thrown due to bugs (e.g. asking your debugger to pause when an exception is thrown becomes effectively useless).

Another benefit of public preconditions is that they provide a shared language with which to communicate the problem. You don't have to say "there were no guesses", you can [turn the condition into the message](http://strilanc.com/heuristic/2014/03/31/The-Condition-Is-the-Message.html) and unambiguously say "here is the exact expression that you can evaluate that should have been true".

Taking all of that into account, we should really rewrite our class to have public preconditions:

```c#
class JellyBeanGuessingContest(private readonly int numberOfJellyBeans) {
  private readonly Dictionary<int, Person> guesses = new Dictionary<int, Person>();
  
  public bool hasAnyoneGuessedAnything() {
    return guesses.Count > 0;
  }

  public bool hasAnyoneGuessedAmount(int amount) {
    return guesses.ContainsKey(amount);
  }

  public void addGuess(int amount, Person person) {
    if (hasAnyoneGuessedAmount(amount)) throw new PreconditionFailed("!hasAnyoneGuessedAmount(amount)");
    guesses[amount] = person;
  }
  
  public Person getWinner() {
    if (!hasAnyoneGuessedAnything()) throw new PreconditionFailed("hasAnyoneGuessedAnything()")
    // (in the event of a g+d vs g-d tie, the larger guess wins because I said so)
    return guesses.MaxBy(e => Math.Abs(e.Key - numberOfJellyBeans + 0.25)).Value;
  }
}
```

(We could also have changed the methods into `tryX` methods, returning false or null when they failed ala [TryParse](http://msdn.microsoft.com/en-us/library/f02979c7%28v=vs.110%29.aspx). As long as you're not using exceptions for non-exceptions things.)

Generally speaking, making preconditions public is a good idea. The cases where it's not correspond well with "actually exceptional" exceptions. For example, no one would bother checking "has this iterator been invalidated due to the collection being modified?". That's almost always caused by a bug, meaning we probably can't handle the problem, and the correct response matches what exceptions do: propagate failure.

**Summary**

If a caller is expected to satisfy a precondition, make the precondition public so they can check it themselves. This doesn't just make the throw unambiguously their fault, it makes it easier to communicate and debug what's wrong.

Making preconditions public is especially important when using languages or tools that treat them as part of a method's signature. For example, [.Net code contracts](http://research.microsoft.com/en-us/projects/contracts/) require that members used in a contract expression be at least as visible as what the contract applies to.
