---
layout: post
title: "Reducing Test Boilerplate with Ascii Diagrams"
date: 2016-05-15 6:10:10 EST
comments: true
---

{% assign loc = page.path | remove_first: '_posts/' | remove: '.md' %}

Sometimes, testing code ends up having a lot of finnicky boilerplate.
That's the issue I was having with [Quirk](https://github.com/Strilanc/Quirk), anyways.

Quirk has a convenient UI for defining small quantum circuits, but the same could not be said of defining circuits for the tests.
For example, suppose we want to test that Quirk is disabling operations it doesn't support (lest it create garbage output).
Here's a specific case where an operation is blocked (because it would recohere a measured qubit):

<img src="/assets/{{ loc }}/circuit-with-disabled-operation.png" style="max-width: 200px;"/>

Simple situation.
Clear requirement.
A good candidate for a unit test.
Let's write it up:


```javascript
let circuitDef = new CircuitDefinition(2, [
    new GateColumn([Gates.HalfTurns.H, Gates.Special.Measure]),
    new GateColumn([Gates.Special.Control, Gates.HalfTurns.X])
]);
assertThat(circuitDef.disabledReasonAt(1, 1)).isNotEqualTo(undefined);
```

UUUUUUuuuuuuuuuugggggggggggggggghhhhh.
Where do I start?

- It should not take 250 characters to write an assertion this simple.
- The columns are written out horizontally instead of vertically.
That consistently tricks me into transposing the circuit.
- Everything is long and boilerplatey (`new GateColumn`, `new GateColumn`, `new GateColumn`, ...).
- There's required redundant information (e.g. the `2` is the wire count).
- I can't see what circuit this is talking about at a glance.

If it was just this one test, these downsides might be acceptable.
But Quirk is a circuit simulator.
I have *kind of a lot* of tests that need to define a circuit!

# Diagrams

The boilerplate issues are bad, but the real problem here is the fact that I don't recognize circuits after writing them into code.
There's a large disconnect between how I think about circuits and the look of the code.

When I'm trying to communicate a circuit to someone over text, I don't describe it in prose or as a list-of-lists.
I draw an ascii diagram.
So, I figured, why not just do that?
I wrote some code to parse simple ascii diagrams of circuits into `CircuitDefinition` instances, and started inlining diagrams into the tests.

Now assertions look like this:

```
assertThat(circuit(`-H-•-
                    -M=X=`).disabledReasonAt(3, 1)).isNotEqualTo(undefined);
```

or this:

```
let c = circuit(`-M=•=
                 -M=◦=
                 ---•-
                 ---◦-
                 ---X-`);

assertTrue(c.doubleWireControlStartsAt(3, 0));
assertFalse(c.doubleWireControlStartsAt(3, 2));
...
```

Defining a circuit is more succinct, but more importantly it's now dead obvious what was defined.
With this change, I make fewer mistakes when reading and writing the tests.

It's a lot fewer mistakes, actually.
Like an order of magnitude fewer.
Which is *crazy*.
You almost never see that kind of improvement in ease-of-programming.
(For contrast, consider that the change in productivity from switching between static and dynamic types is small enough that no one has managed to convincingly measure it either way.)

So I'll be looking for other opportunities to try this out: find a class of tests that takes a lot of boilerplate to set up, and somehow diagram-atize the boilerplate.
(Proto buffers come to mind...)

# Summary

When you're going to write a lot of tests that use an object, invest effort into making it really *really* easy to create instances of that object.
You'll end up with tests that are easier to understand, and make fewer stupid mistakes when writing them.
