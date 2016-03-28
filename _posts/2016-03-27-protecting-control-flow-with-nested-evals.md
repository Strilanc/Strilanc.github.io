---
layout: post
title: "Protecting Control Flow with Nested Evals"
date: 2016-03-27 10:10:10 EST
categories: programming
comments: true
---

Javascript's [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) function has a bad reputation, mostly (but not entirely) because of its tendency to create [code injection attacks](https://en.wikipedia.org/wiki/Code_injection).
In this post, I'll show a way `eval` can help **defend** against code-injection attacks.

(*This post is __not__ a recommendation for eval, and __won't__ prepare you for the many pitfalls of executing untrusted javascript.
If you're unfamiliar with injection attacks, or enjoy puzzles based on them, try out the game [untrusted ('the continuing adventures of Dr. Eval')](https://alexnisnevich.github.io/untrusted/).*)

# Injecting Control Flow

Injection attacks work in many ways, but a common method-of-action is hijacking the flow of code nested around the user-provided code.

For example, suppose you have a game and decide that users should be able to define some kind of custom flair to execute when they win.
You write something like this, to be maximally flexible:

```javascript
let gameCode = `
    ...
    if (isWinner) {
        ${userFlairCode};
    }
    ...
`;
...
eval(gameCode);
```

But then users start entering flair code like `} ${code}; if (true) {`.
It affects the parse tree in a way you didn't expect, tampering with your intended control flow so that their flair runs unconditionally.
Even when the user loses, they appear to win.
Oops.

I grappled with this specific problem when writing the javascript widgets for the [you-vs-bell-tests-vs-no-communication post](http://algorithmicassertions.com/quantum/2015/10/11/Bell-Tests-vs-No-Communication.html).
Users can enter custom coordination strategies, and the code started off looking something like this:

```javascript
let simulationCodeForWebWorker = `
  ...
  for (let i = 0; i < RUN_COUNT; i++) {
     let move = undefined;
     ${userStrategyForAlice}
     moves.push(move);
  }
  ...
`;
```

Although there's really no cost to users beating the widgets by cheating (there's no leaderboard or anything like that), I was still interested in making it at least *slightly* difficult to cheat.
And that meant preventing control flow tampering, among other things.

# Nested Eval

The workaround I used to protect the control flow is ironic, but straightforward: run the code inside an inner `eval`.
Instead of directly inserting the user's code into the text of the code-to-be-executed, have the code-to-be-executed pass the user's code as a string literal into an `eval` within the code-to-be-executed:

```javascript
let simulationCodeForWebWorker = `
  ...
  for (let i = 0; i < RUN_COUNT; i++) {
     let move = undefined;
     eval(${JSON.stringify(userStrategyForAlice)}); // <--- an eval within the code to evaluate
     moves.push(move);
  }
  ...
`;
```

Now, if the user specifies code like `} if (false) {` in an attempt to keep the `moves` array empty, they'll instead cause a syntax error when `eval("} if (false) {")` is evaluated.
They can't tamper with the parse tree because the only thing they control is the logical contents of a string literal.

Of course we still have to prevent the user-entered code from breaking out of the string literal.
In the example, properly escaping the code into a string literal is delegated to [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
I can't guarantee that `JSON.stringify` will work (e.g. what if a future version of javascript allowed [templates](https://developer.mozilla.org/en-US/docs/JavaScript_templates) in all strings?) but, given [how tricky it can be](http://thedailywtf.com/articles/bidding-on-security) to know which characters are safe and which aren't, I'd rather defer to a standard function than write my own.

(*I also did other things to protect the widgets from user-entered code: running in a web worker, using a timeout, caching globals into locals, randomizing the names of variables, hiding scopes with `(function() { ... })()`, and so forth.
Despite all that, you can of course still cheat by using injection attacks.
Don't use eval around anything important.
Just don't.*)

# Summary

When mixing user-defined code with your own code, inserting `eval(${JSON.stringify(userCode)})` instead of just `${userCode}` will prevent the user-defined code from hijacking the surrounding control flow.

It won't stop the user-defined code from tampering with global state, from hanging, from throwing exceptions, from leaking information, or from doing all the other awful things `eval` allows... but it'll stop the control flow tampering.
...Maybe.
